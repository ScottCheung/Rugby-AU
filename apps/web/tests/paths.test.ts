import { describe, expect, it } from 'vitest';
import { isValidPath, normalizePath, pathFromSegments } from '../lib/paths';

describe('paths', () => {
  it.each([
    ['', '/'],
    ['/', '/'],
    ['about', '/about'],
    ['/About/', '/about'],
    ['  //fixtures-and-news// ', '/fixtures-and-news'],
    ['teams//senior', '/teams/senior'],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizePath(input)).toBe(expected);
  });

  it('accepts lowercase hyphenated segments only', () => {
    expect(isValidPath('/')).toBe(true);
    expect(isValidPath('/fixtures-and-news')).toBe(true);
    expect(isValidPath('/teams/u18')).toBe(true);
    expect(isValidPath('/bad path')).toBe(false);
    expect(isValidPath('/double--hyphen')).toBe(false);
    expect(isValidPath('/-start')).toBe(false);
  });

  it('turns catch-all route segments into a stored path', () => {
    expect(pathFromSegments(undefined)).toBe('/');
    expect(pathFromSegments(['about'])).toBe('/about');
  });
});
