/**
 * Delay for the nth of a row of siblings, so they arrive one after another
 * but never wait more than 0.4s. Plain module (not 'use client'), so server
 * components can call it.
 */
export const stagger = (index: number, step = 0.07) =>
  Math.min(index * step, 0.4);
