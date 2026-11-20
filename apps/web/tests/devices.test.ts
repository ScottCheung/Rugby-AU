import { describe, expect, it } from 'vitest';
import { devices, fitScale } from '../components/manager/editor/devices';

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
