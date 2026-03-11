import { OpenWeatherPayload } from '../types/index';

/**
 * Calculates a normalized Thermal Weight (1-10) for an outfit based on weather data.
 * @param weatherData The payload from OpenWeather API.
 * @returns A number between 1 and 10 representing the recommended outfit weight.
 */
export function calculateOutfitWeight(weatherData: OpenWeatherPayload): number {
  const feelsLike = weatherData.main.feels_like;
  const humidity = weatherData.main.humidity;
  const windSpeedKmH = weatherData.wind.speed; // Assuming km/h as per prompt instructions

  let weight = 0;

  // 1. Base weight based on "Feels Like" temperature
  // Mapping temperature ranges to a base weight (1-10)
  if (feelsLike >= 35) {
    weight = 1;
  } else if (feelsLike >= 30) {
    weight = 2;
  } else if (feelsLike >= 25) {
    weight = 3;
  } else if (feelsLike >= 20) {
    weight = 4;
  } else if (feelsLike >= 15) {
    weight = 5;
  } else if (feelsLike >= 10) {
    weight = 6;
  } else if (feelsLike >= 5) {
    weight = 8;
  } else {
    weight = 10;
  }

  // 2. Apply "Melbourne Chill" factor modifiers
  // Apply a +1 weight modifier if wind speed is > 20 km/h or humidity is > 80%
  if (windSpeedKmH > 20 || humidity > 80) {
    weight += 1;
  }

  // Ensure weight stays within 1-10 range
  return Math.min(Math.max(weight, 1), 10);
}
