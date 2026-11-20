/**
 * Delay for the nth of a row of siblings, so they arrive one after another
 * but never wait more than 0.5s. Plain module (not 'use client'), so server
 * components can call it.
 */
export const stagger = (index: number, step = 0.1) =>
  Math.min(index * step, 0.5);

/**
 * Blocks that do not play an entrance of their own: a Section's children
 * animate instead, and Card Grid and Latest news animate each card. Without
 * this the same content would animate twice (the grid, then its cards).
 */
const animatedInside = new Set(['section', 'cardGrid', 'latestNews']);

export const animatesAsWhole = (type: string) => !animatedInside.has(type);
