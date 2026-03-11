import axios from 'axios';
import { ImageGenerationOptions, RecommendationResponse } from '../types/index';

const NANO_BANANA_API_URL = process.env.NANO_BANANA_API_URL || 'https://api.nanobanana.ai/v2/generate';
const NANO_BANANA_API_KEY = process.env.NANO_BANANA_API_KEY || '';

/**
 * Service to generate photorealistic outfit images using Nano Banana 2.
 * @param recommendations RecommendationResponse from Gemini
 * @returns Array of image URLs (one for each outfit item or one combined flat-lay)
 */
export async function generateOutfitVisuals(
  recommendations: RecommendationResponse
): Promise<string[]> {
  if (!NANO_BANANA_API_KEY) {
    throw new Error('NANO_BANANA_API_KEY is not defined.');
  }

  // Creating a combined prompt for a high-quality flat-lay
  const itemsDescription = recommendations.outfit
    .map(item => `${item.color} ${item.name}: ${item.description}`)
    .join(', ');

  const prompt = `A premium, 4K photorealistic flat-lay fashion photography of an Australian corporate outfit. 
    Items included: ${itemsDescription}. 
    Style: Minimalist, soft professional lighting, high-end editorial aesthetic. 
    Background: Neutral textured stone. 
    Layout: Artistic arrangement of clothing and accessories.`;

  const options: ImageGenerationOptions = {
    prompt,
    aspect_ratio: '16:9',
    media_resolution: 'HIGH'
  };

  try {
    const response = await axios.post<{ image_urls: string[] }>(
      NANO_BANANA_API_URL,
      options,
      {
        headers: {
          'Authorization': `Bearer ${NANO_BANANA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // Image generation takes longer, 30s timeout
      }
    );

    if (!response.data || !response.data.image_urls || response.data.image_urls.length === 0) {
      throw new Error('Nano Banana 2 failed to return image URLs.');
    }

    return response.data.image_urls;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Image generation failed: ${error.message} (Status: ${error.response?.status})`);
    }
    throw error;
  }
}
