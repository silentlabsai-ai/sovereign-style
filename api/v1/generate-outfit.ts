import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchWeatherData } from '../../src/services/weatherService';
import { fetchUserProfile } from '../../src/services/userService';
import { calculateOutfitWeight } from '../../src/engine/weatherWeight';
import { getPalette } from '../../src/engine/seasonality';
import { getOutfitRecommendations } from '../../src/services/recommendationService';
import { generateOutfitVisuals } from '../../src/services/imageGenerationService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    const recommendations = await getOutfitRecommendations(
      thermalWeight,
      palette,
      userProfile
    );

    const imageUrls = await generateOutfitVisuals(recommendations);

    const response = {
      city: weatherData.name,
      currentTemp: weatherData.main.feels_like,
      thermalWeight: thermalWeight,
      outfits: recommendations.outfit.map((item) => ({
        description: `${item.name}: ${item.description}`,
        reasoning: item.reasoning,
        color: item.color,
        image_url: imageUrls[0],
        shop_link: `https://www.theiconic.com.au/catalog/?q=${encodeURIComponent(item.name)}`
      })),
      overall_styling_advice: recommendations.overall_styling_advice
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error generating outfit:', error);
    return res.status(500).json({
      error: 'Failed to generate outfit recommendation.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
