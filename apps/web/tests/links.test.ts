import { describe, expect, it } from 'vitest';
import { resolveHref } from '../lib/links';

describe('resolveHref', () => {
  it.each([
    ['/', '/sites/coastal-union'],
    ['/fixtures-and-news', '/sites/coastal-union/fixtures-and-news'],
    ['https://example.com/tickets', 'https://example.com/tickets'],
    ['#squad', '#squad'],
    ['javascript:alert(1)', undefined],
    ['about', undefined],
  ])('%s -> %s', (href, expected) => {
    expect(resolveHref(href, 'coastal-union')).toBe(expected);
  });
});
