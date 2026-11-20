/**
 * Preview sizes. The canvas lays the page out at the device's real width
 * and scales it down to fit the editor, so container queries see the same
 * width as on a real screen and the preview matches the live site.
 */
export const devices = {
  desktop: { label: 'Desktop', width: 1280 },
  tablet: { label: 'Tablet', width: 768 },
  mobile: { label: 'Mobile', width: 390 },
} as const;

export type Device = keyof typeof devices;

/** Shrink to fit the space available, never enlarge past 100%. */
export function fitScale(available: number, width: number): number {
  if (available <= 0 || width <= 0) return 1;
  return Math.min(1, available / width);
}
