import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// ── Types ──

type Palette = string[];
type Season = 'Summer' | 'Autumn' | 'Winter' | 'Spring';

interface OpenWeatherPayload {
  main: { temp: number; feels_like: number; humidity: number; temp_min: number; temp_max: number; pressure: number };
  wind: { speed: number; deg: number };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  name: string;
}

interface UserProfile {
  id: string;
  display_name: string;
  city: string;
  sizing: { top: string; bottom: string; outerwear: string; shoes: string };
  style_preferences: { corporate_strictness: 'Low' | 'Medium' | 'High'; preferred_fabrics: string[]; brand_affinities: string[]; disliked_colors: string[] };
}

interface OutfitItem { name: string; description: string; reasoning: string; color: string }
interface RecommendationResponse { outfit: OutfitItem[]; overall_styling_advice: string; thermal_weight: number }
interface ImageGenerationOptions { prompt: string; aspect_ratio: '16:9' | '4:3' | '1:1'; media_resolution: 'LOW' | 'MEDIUM' | 'HIGH' }

// ── Weather Service ──

async function fetchWeatherData(lat: number, lon: number): Promise<OpenWeatherPayload> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) throw new Error('OPENWEATHER_API_KEY is not defined.');
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenWeather API returned status ${res.status}`);
  return res.json() as Promise<OpenWeatherPayload>;
}

// ── User Service ──

async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const url = process.env.SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  if (!url || !anonKey) throw new Error('Supabase configuration is missing.');
  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw new Error(`Error fetching user profile: ${error.message}`);
  if (!data) throw new Error(`User profile not found for ID: ${userId}`);
  return data as UserProfile;
}

// ── Seasonality Engine ──

const PALETTE_MAPPINGS: Record<Season, Palette> = {
  Summer: ['Cloud-dancer white', 'Canary yellow', 'Candy pink', 'Vibrant violet', 'Chartreuse'],
  Autumn: ['Chocolate brown', 'Terracotta', 'Burnt orange', 'Olive', 'Deep caramel'],
  Winter: ['Transformative teal', 'Cocoa powder', 'Sapphire', 'Emerald', 'Amethyst', 'Midnight navy'],
  Spring: ['Sage green', 'Blush', 'Sky blue', 'Warm sand', 'Soft coral']
};

function getPalette(date: Date): Palette {
  const month = date.getMonth();
  let season: Season;
  if (month === 11 || month <= 1) season = 'Summer';
  else if (month >= 2 && month <= 4) season = 'Autumn';
  else if (month >= 5 && month <= 7) season = 'Winter';
  else season = 'Spring';
  return PALETTE_MAPPINGS[season];
}

// ── Weather Weight Engine ──

function calculateOutfitWeight(weatherData: OpenWeatherPayload): number {
  const feelsLike = weatherData.main.feels_like;
  const humidity = weatherData.main.humidity;
  const windSpeedKmH = weatherData.wind.speed;
  let weight = 0;
  if (feelsLike >= 35) weight = 1;
  else if (feelsLike >= 30) weight = 2;
  else if (feelsLike >= 25) weight = 3;
  else if (feelsLike >= 20) weight = 4;
  else if (feelsLike >= 15) weight = 5;
  else if (feelsLike >= 10) weight = 6;
  else if (feelsLike >= 5) weight = 8;
  else weight = 10;
  if (windSpeedKmH > 20 || humidity > 80) weight += 1;
  return Math.min(Math.max(weight, 1), 10);
}

// ── Recommendation Service (Gemini) ──

async function getOutfitRecommendations(thermalWeight: number, palette: Palette, userProfile: UserProfile): Promise<RecommendationResponse> {
  const apiKey = process.env.GENAI_API_KEY || '';
  if (!apiKey) throw new Error('GENAI_API_KEY is not defined.');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

  const systemPrompt = `You are Sovereign Style, an expert Australian fashion advisor specializing in office-wear.
Your goal is to recommend a 3-item professional outfit based on the current weather and user preferences.

Current Constraints:
- Thermal Weight: ${thermalWeight}/10 (1 is very hot/minimal layers, 10 is freezing/heavy outerwear).
- Seasonal Palette: ${palette.join(', ')}.
- Corporate Strictness: ${userProfile.style_preferences.corporate_strictness}.
- User Sizing: TOP: ${userProfile.sizing.top}, BOTTOM: ${userProfile.sizing.bottom}, OUTERWEAR: ${userProfile.sizing.outerwear}.
- Preferred Fabrics: ${userProfile.style_preferences.preferred_fabrics.join(', ')}.
- Brand Affinities: ${userProfile.style_preferences.brand_affinities.join(', ')}.
- Disliked Colors: ${userProfile.style_preferences.disliked_colors.join(', ')}.

Return ONLY a JSON object (no markdown, no code fences) matching this format:
{
  "outfit": [
    { "name": "Item Name", "description": "Detailed visual description", "reasoning": "Why this works", "color": "Palette Color" }
  ],
  "overall_styling_advice": "Advice for Australian office context.",
  "thermal_weight": ${thermalWeight}
}
Select EXACTLY 3 items. Colors must be from the Seasonal Palette.`;

  const result = await model.generateContent(systemPrompt);
  const text = result.response.text();
  const jsonString = text.replace(/```json|```/g, '').trim();
  const data = JSON.parse(jsonString) as RecommendationResponse;
  if (!data.outfit || data.outfit.length !== 3) throw new Error('Invalid recommendation format: Expected 3 outfit items.');
  return data;
}

// ── Image Generation Service (Nano Banana) ──

async function generateOutfitVisuals(recommendations: RecommendationResponse): Promise<string[]> {
  const apiUrl = process.env.NANO_BANANA_API_URL || 'https://api.nanobanana.ai/v2/generate';
  const apiKey = process.env.NANO_BANANA_API_KEY || '';
  if (!apiKey) throw new Error('NANO_BANANA_API_KEY is not defined.');

  const itemsDescription = recommendations.outfit.map(item => `${item.color} ${item.name}: ${item.description}`).join(', ');
  const options: ImageGenerationOptions = {
    prompt: `A premium, 4K photorealistic flat-lay fashion photography of an Australian corporate outfit. Items included: ${itemsDescription}. Style: Minimalist, soft professional lighting, high-end editorial aesthetic. Background: Neutral textured stone. Layout: Artistic arrangement of clothing and accessories.`,
    aspect_ratio: '16:9',
    media_resolution: 'HIGH'
  };

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });

  const data = await res.json() as { image_urls: string[] };
  if (!data?.image_urls?.length) throw new Error('Nano Banana 2 failed to return image URLs.');
  return data.image_urls;
}

// ── Main Handler ──

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { latitude, longitude, userId } = req.body;
  if (!latitude || !longitude || !userId) {
    return res.status(400).json({ error: 'Missing required parameters: latitude, longitude, and userId.' });
  }

  try {
    const [weatherData, userProfile] = await Promise.all([
      fetchWeatherData(latitude, longitude),
      fetchUserProfile(userId)
    ]);

    const thermalWeight = calculateOutfitWeight(weatherData);
    const palette = getPalette(new Date());
    const recommendations = await getOutfitRecommendations(thermalWeight, palette, userProfile);
    const imageUrls = await generateOutfitVisuals(recommendations);

    return res.status(200).json({
      city: weatherData.name,
      currentTemp: weatherData.main.feels_like,
      thermalWeight,
      outfits: recommendations.outfit.map((item) => ({
        description: `${item.name}: ${item.description}`,
        reasoning: item.reasoning,
        color: item.color,
        image_url: imageUrls[0],
        shop_link: `https://www.theiconic.com.au/catalog/?q=${encodeURIComponent(item.name)}`
      })),
      overall_styling_advice: recommendations.overall_styling_advice
    });
  } catch (error) {
    console.error('Error generating outfit:', error);
    return res.status(500).json({
      error: 'Failed to generate outfit recommendation.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
