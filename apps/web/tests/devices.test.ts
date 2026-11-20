import { describe, expect, it } from 'vitest';
import {
  devices,
  fitScale,
  previewWidth,
} from '../components/manager/editor/devices';

describe('fitScale', () => {
  it('shrinks a wide page to the space available', () => {
    expect(fitScale(640, devices.desktop.width)).toBe(0.5);
  });

  it('never enlarges a page that already fits', () => {
    expect(fitScale(1000, devices.mobile.width)).toBe(1);
  });

  it('shows the page at full size until the space is measured', () => {
    expect(fitScale(0, devices.desktop.width)).toBe(1);
  });
});

describe('previewWidth', () => {
  it('lays desktop out at the browser window width', () => {
    expect(previewWidth('desktop', 1512)).toBe(1512);
  });

  it('uses at least a small-laptop width for desktop', () => {
    expect(previewWidth('desktop', 900)).toBe(1024);
  });

  it('keeps fixed widths for tablet and phone, and a fallback before measuring', () => {
    expect(previewWidth('tablet', 1512)).toBe(768);
    expect(previewWidth('mobile', 1512)).toBe(390);
    expect(previewWidth('desktop', 0)).toBe(1280);
  });
});
