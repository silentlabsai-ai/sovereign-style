import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecommendationResponse, UserProfile, Palette } from '../types/index';

const GENAI_API_KEY = process.env.GENAI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GENAI_API_KEY);

/**
 * Service to generate office-wear recommendations using Gemini 3 Flash.
 * @param thermalWeight Normalized weight (1-10)
 * @param palette Active seasonal palette
 * @param userProfile User preferences and sizing
 * @returns RecommendationResponse with outfit details
 */
export async function getOutfitRecommendations(
  thermalWeight: number,
  palette: Palette,
  userProfile: UserProfile
): Promise<RecommendationResponse> {
  if (!GENAI_API_KEY) {
    throw new Error('GENAI_API_KEY is not defined.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash' });

  const systemPrompt = `
    You are Sovereign Style, an expert Australian fashion advisor specializing in office-wear.
    Your goal is to recommend a 3-item professional outfit based on the current weather and user preferences.
    
    Current Constraints:
    - Thermal Weight: ${thermalWeight}/10 (1 is very hot/minimal layers, 10 is freezing/heavy outerwear).
    - Seasonal Palette: ${palette.join(', ')}.
    - Corporate Strictness: ${userProfile.style_preferences.corporate_strictness}.
    - User Sizing: TOP: ${userProfile.sizing.top}, BOTTOM: ${userProfile.sizing.bottom}, OUTERWEAR: ${userProfile.sizing.outerwear}.
    - Preferred Fabrics: ${userProfile.style_preferences.preferred_fabrics.join(', ')}.
    - Brand Affinities: ${userProfile.style_preferences.brand_affinities.join(', ')}.
    - Disliked Colors: ${userProfile.style_preferences.disliked_colors.join(', ')}.

    Output Instructions:
    - Return a JSON object matching the RecommendationResponse interface.
    - Select EXACTLY 3 items (e.g., Blazer, Shirt, Trousers).
    - Ensure colors are strictly from the Seasonal Palette provided.
    - Reasoning must explain why the item is appropriate for a Thermal Weight of ${thermalWeight}.
    
    Format:
    {
      "outfit": [
        { "name": "Item Name", "description": "Detailed visual description", "reasoning": "Why this works for the weight/weather", "color": "Selected Palette Color" }
      ],
      "overall_styling_advice": "Advice on how to wear this specifically in an Australian office context.",
      "thermal_weight": ${thermalWeight}
    }
  `;

  try {
    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();
    
    // Clean potential markdown formatting if Gemini includes it
    const jsonString = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(jsonString) as RecommendationResponse;

    if (!data.outfit || data.outfit.length !== 3) {
      throw new Error('Invalid recommendation format: Expected 3 outfit items.');
    }

    return data;
  } catch (error) {
    throw new Error(`Gemini recommendation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
