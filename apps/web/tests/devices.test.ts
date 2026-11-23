import { describe, expect, it } from 'vitest';
import {
  devices,
  fitScale,
  layoutWidth,
} from '../components/manager/editor/devices';

describe('layoutWidth', () => {
  it('lays desktop out at the window’s width, never narrower than 1024', () => {
    expect(layoutWidth('desktop', 1440)).toBe(1440);
    expect(layoutWidth('desktop', 900)).toBe(1024);
  });

  it('uses real device widths for tablet and phone', () => {
    expect(layoutWidth('tablet', 1440)).toBe(devices.tablet.width);
    expect(layoutWidth('mobile', 1440)).toBe(devices.mobile.width);
  });
});

describe('fitScale', () => {
  it('shrinks to fit and never enlarges', () => {
    expect(fitScale(720, 1440)).toBe(0.5);
    expect(fitScale(1600, 1440)).toBe(1);
    expect(fitScale(0, 1440)).toBe(1);
  });
});
