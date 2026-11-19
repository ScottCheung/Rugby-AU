import type { DeepPartial, Theme, ThemeOverrides } from './types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Recursively copy `overrides` onto `base`. Undefined values are ignored. */
function deepMerge<T>(base: T, overrides: DeepPartial<T>): T {
  const result: Record<string, unknown> = {
    ...(base as Record<string, unknown>),
  };
  for (const [key, value] of Object.entries(
    overrides as Record<string, unknown>,
  )) {
    if (value === undefined) continue;
    const current = result[key];
    result[key] =
      isPlainObject(current) && isPlainObject(value)
        ? deepMerge(current, value)
        : value;
  }
  return result as T;
}

/** Pure: defaults + a site's overrides = the complete theme for that site. */
export function resolveTheme(
  defaults: Theme,
  overrides: ThemeOverrides = {},
): Theme {
  return deepMerge(defaults, overrides);
}
