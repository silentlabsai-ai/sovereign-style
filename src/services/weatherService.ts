import axios from 'axios';
import { OpenWeatherPayload } from '../types/index';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Fetches real-time weather data from OpenWeather AU.
 * @param lat Latitude
 * @param lon Longitude
 * @returns Typed OpenWeatherPayload
 */
export async function fetchWeatherData(lat: number, lon: number): Promise<OpenWeatherPayload> {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OPENWEATHER_API_KEY is not defined in environment variables.');
  }

  try {
    const response = await axios.get<OpenWeatherPayload>(BASE_URL, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric' // Ensure Celsius and km/h (speed is converted in payload usually)
      },
      timeout: 5000 // 5 second timeout for responsiveness
    });

    if (response.status !== 200) {
      throw new Error(`OpenWeather API returned status ${response.status}`);
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
    throw error;
  }
}
