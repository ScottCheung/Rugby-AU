/**
 * Preview sizes. The canvas lays the page out at the device's real width
 * and scales it down to fit the editor, so container queries see the same
 * width as on a real screen and the preview matches the live site.
 */
export const devices = {
  // Desktop follows the editor's own window (see previewWidth); 1280 is the
  // fallback before it is known.
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

/**
 * The width to lay the page out at. Desktop uses the browser window the
 * editor is open in, so the preview matches opening the live site in that
 * same window; tablet and phone use fixed device widths.
 */
export function previewWidth(device: Device, windowWidth: number): number {
  if (device !== 'desktop' || windowWidth <= 0) return devices[device].width;
  return Math.max(1024, windowWidth);
}
