import { Request, Response } from 'express';
import { fetchWeatherData } from '../../services/weatherService';
import { fetchUserProfile } from '../../services/userService';
import { calculateOutfitWeight } from '../../engine/weatherWeight';
import { getPalette } from '../../engine/seasonality';
import { getOutfitRecommendations } from '../../services/recommendationService';
import { generateOutfitVisuals } from '../../services/imageGenerationService';

/**
 * Controller for POST /api/v1/generate-outfit
 * Orchestrates the end-to-end outfit generation flow.
 */
export const generateOutfitController = async (req: Request, res: Response) => {
  const { latitude, longitude, userId } = req.body;

  // Validation
  if (!latitude || !longitude || !userId) {
    return res.status(400).json({ error: 'Missing required parameters: latitude, longitude, and userId.' });
  }

  try {
    // 1. Fetch external data in parallel
    const [weatherData, userProfile] = await Promise.all([
      fetchWeatherData(latitude, longitude),
      fetchUserProfile(userId)
    ]);

    // 2. Core Engine Calculations
    const thermalWeight = calculateOutfitWeight(weatherData);
    const palette = getPalette(new Date());

    // 3. AI Recommendation Logic (Gemini 3 Flash)
    const recommendations = await getOutfitRecommendations(
      thermalWeight,
      palette,
      userProfile
    );

    // 4. Image Generation Loop (Nano Banana 2)
    // Note: Generating a single premium flat-lay according to the service implementation
    const imageUrls = await generateOutfitVisuals(recommendations);

    // 5. Construct Final Payload
    const response = {
      city: weatherData.name,
      currentTemp: weatherData.main.feels_like,
      thermalWeight: thermalWeight,
      outfits: recommendations.outfit.map((item, index) => ({
        description: `${item.name}: ${item.description}`,
        reasoning: item.reasoning,
        color: item.color,
        // Since we generate a premium flat-lay, we use the same visual for the set
        image_url: imageUrls[0], 
        // Mock shop link based on item name for demonstration
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
};
