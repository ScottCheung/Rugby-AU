/**
 * Animation rules specific to this app's components. The shared timings,
 * easing and entrance live in @scottcheung/ui/motion.
 */

/**
 * Blocks that do not play an entrance of their own: a Section's children
 * animate instead, and Card Grid and Latest news animate each card. Without
 * this the same content would animate twice (the grid, then its cards).
 */
const animatedInside = new Set(['section', 'cardGrid', 'latestNews']);

export const animatesAsWhole = (type: string) => !animatedInside.has(type);
