/**
 * Color utility functions for the glass tab bar.
 * @module utils/colors
 */

/**
 * Converts a hex color string to rgba with the given alpha.
 *
 * @param hex - Color in '#RGB', '#RRGGBB', or '#RRGGBBAA' format
 * @param alpha - Alpha value from 0 to 1
 * @returns rgba() color string
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  const cleaned = hex.replace('#', '');
  let r: number, g: number, b: number;

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0]! + cleaned[0]!, 16);
    g = parseInt(cleaned[1]! + cleaned[1]!, 16);
    b = parseInt(cleaned[2]! + cleaned[2]!, 16);
  } else {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Appends a hex alpha value to a hex color string.
 *
 * @param hex - Color in '#RRGGBB' format
 * @param alpha - Alpha value from 0 to 1
 * @returns '#RRGGBBAA' color string
 */
export const withAlpha = (hex: string, alpha: number): string => {
  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  const base = hex.startsWith('#') ? hex : `#${hex}`;
  const cleanBase = base.length === 9 ? base.substring(0, 7) : base;
  return `${cleanBase}${alphaHex}`;
};

/**
 * Blends a hex colour towards white (amount 0 = unchanged, 1 = white). Non-hex colours (e.g.
 * 'rgb(...)', named colours) are returned unchanged.
 *
 * @param hex - Color in '#RGB' or '#RRGGBB' format
 * @param amount - How much white to mix in, 0 to 1
 * @returns '#RRGGBB' color string
 */
export const lighten = (hex: string, amount: number): string => {
  const cleaned = hex.replace('#', '');
  if (!/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(cleaned)) return hex;
  const full =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned.substring(0, 6);
  const mix = (i: number) => {
    const v = parseInt(full.substring(i, i + 2), 16);
    return Math.round(v + (255 - v) * amount)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${mix(0)}${mix(2)}${mix(4)}`;
};
