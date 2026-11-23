/**
 * Preview sizes. The preview lays the page out at the device's real width
 * and scales it down to fit the space between the panels, so the site's
 * breakpoints and container queries see the same width as on a real screen:
 * a desktop preview stays a desktop layout however narrow the editor is.
 */
export const devices = {
  // Desktop follows the editor's own window (see layoutWidth).
  desktop: { label: 'Desktop', width: 1280 },
  tablet: { label: 'Tablet', width: 768 },
  mobile: { label: 'Mobile', width: 390 },
} as const;

export type Device = keyof typeof devices;

/**
 * The width to lay the page out at. Desktop uses the browser window the
 * editor is open in (at least 1024), so the preview matches opening the
 * live site in that same window; tablet and phone use fixed widths.
 */
export function layoutWidth(device: Device, windowWidth: number): number {
  if (device !== 'desktop' || windowWidth <= 0) return devices[device].width;
  return Math.max(1024, windowWidth);
}

/** Shrink to fit the space available, never enlarge past 100%. */
export function fitScale(available: number, width: number): number {
  if (available <= 0 || width <= 0) return 1;
  return Math.min(1, available / width);
}
