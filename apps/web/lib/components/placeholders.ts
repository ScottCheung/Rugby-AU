import {
  imageRoles,
  missingRoles,
  type Item,
  type Roles,
} from './blocks/roles';

/**
 * A striped picture saying what is missing. Editor preview only: an item
 * missing a required field cannot be published (the block does not
 * validate), so visitors never see these.
 */
function placeholderImage(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><pattern id="s" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="28" fill="#d1d5db"/><rect x="14" width="14" height="28" fill="#e5e7eb"/></pattern></defs><rect width="800" height="600" fill="url(#s)"/><text x="400" y="310" font-family="system-ui,sans-serif" font-size="34" font-weight="600" text-anchor="middle" fill="#4b5563">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * An item with a placeholder for each field its block needs and it lacks
 * (after switching a block to a type that reads more), and their names.
 */
export function fillMissing(
  item: Item,
  roles: Roles,
): { item: Item; missing: string[] } {
  const missing = missingRoles(item, roles);
  if (missing.length === 0) return { item, missing: [] };
  const filled: Item = { ...item };
  for (const role of missing) {
    const label = roles[role]!.label.toLowerCase();
    if (imageRoles.includes(role))
      (filled as Record<string, unknown>)[role] = {
        url: placeholderImage(`Missing: ${label}`),
        alt: `Missing ${label}`,
      };
    else if (role === 'story')
      filled.story = [{ kind: 'paragraph', text: `Missing ${label}` }];
    else (filled as Record<string, unknown>)[role] = `Missing ${label}`;
  }
  return { item: filled, missing: missing.map((role) => roles[role]!.label) };
}
