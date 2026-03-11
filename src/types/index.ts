/**
 * Represents a palette of colors associated with a season.
 */
export type Palette = string[];

/**
 * Simplified OpenWeather API payload structure for the engine.
 */
export interface OpenWeatherPayload {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
  };
  wind: {
    speed: number; // in m/s (OpenWeather default) or km/h depending on unit configuration
    deg: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  name: string; // City name
}

/**
 * Season types for Australia.
 */
export type Season = 'Summer' | 'Autumn' | 'Winter' | 'Spring';

/**
 * User profile from Supabase.
 */
export interface UserProfile {
  id: string;
  display_name: string;
  city: string;
  sizing: {
    top: string;
    bottom: string;
    outerwear: string;
    shoes: string;
  };
  style_preferences: {
    corporate_strictness: 'Low' | 'Medium' | 'High';
    preferred_fabrics: string[];
    brand_affinities: string[];
    disliked_colors: string[];
  };
}

/**
 * A single item in a recommended outfit.
 */
export interface OutfitItem {
  name: string;
  description: string;
  reasoning: string;
  color: string;
}

/**
 * Structured response from Gemini 3 Flash.
 */
export interface RecommendationResponse {
  outfit: OutfitItem[];
  overall_styling_advice: string;
  thermal_weight: number;
}

/**
 * Options for Nano Banana 2 image generation.
 */
export interface ImageGenerationOptions {
  prompt: string;
  aspect_ratio: '16:9' | '4:3' | '1:1';
  media_resolution: 'LOW' | 'MEDIUM' | 'HIGH';
}
