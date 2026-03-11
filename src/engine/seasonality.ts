import { Palette, Season } from '../types/index';

/**
 * AU 2026 Seasonal Palette Mappings
 */
const PALETTE_MAPPINGS: Record<Season, Palette> = {
  Summer: [
    'Cloud-dancer white',
    'Canary yellow',
    'Candy pink',
    'Vibrant violet',
    'Chartreuse'
  ],
  Autumn: [
    'Chocolate brown',
    'Terracotta',
    'Burnt orange',
    'Olive',
    'Deep caramel'
  ],
  Winter: [
    'Transformative teal',
    'Cocoa powder',
    'Sapphire',
    'Emerald',
    'Amethyst',
    'Midnight navy'
  ],
  Spring: [
    'Sage green',
    'Blush',
    'Sky blue',
    'Warm sand',
    'Soft coral'
  ]
};

/**
 * Returns the correct seasonal palette based on the given date (AU seasons).
 * @param date The date to check.
 * @returns An array of color names or hex codes.
 */
export function getPalette(date: Date): Palette {
  const month = date.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)

  let season: Season;

  // AU Season Logic:
  // Dec, Jan, Feb -> Summer
  // Mar, Apr, May -> Autumn
  // Jun, Jul, Aug -> Winter
  // Sep, Oct, Nov -> Spring
  if (month === 11 || month <= 1) {
    season = 'Summer';
  } else if (month >= 2 && month <= 4) {
    season = 'Autumn';
  } else if (month >= 5 && month <= 7) {
    season = 'Winter';
  } else {
    season = 'Spring';
  }

  return PALETTE_MAPPINGS[season];
}
