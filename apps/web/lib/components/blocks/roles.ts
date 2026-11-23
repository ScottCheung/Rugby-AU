import { z } from 'zod';
import type { Fixture } from '../../fixtures/types';
import { hiddenFlag, imageSchema, linkSchema } from '../fields';
import { storySchema, type Story } from '../story';

/**
 * The fields an item can have, shared by every block. A block type says
 * which of them it reads (its `roles`); a data source says which it fills
 * in. Because the names are shared, items written for one block type show
 * in another (cards as people, news as a hero carousel) without being
 * typed again.
 */
export const editableRoles = [
  'title',
  'subtitle',
  'text',
  'value',
  'image',
  'cutout',
  'background',
  'link',
  'story',
] as const;
export type EditableRole = (typeof editableRoles)[number];

/**
 * Filled in by a data source only, never typed: the small line above a
 * news card ("History · 12 November 2026") and a match from the fixtures
 * service (with the team it is seen from, if any).
 */
export type SourceRole = 'eyebrow' | 'match';
export type Role = EditableRole | SourceRole;

type Image = { url: string; alt: string };
type Link = { label: string; href: string };

/** One item, wherever it came from. */
export type Item = {
  title?: string;
  subtitle?: string;
  text?: string;
  value?: string;
  image?: Image;
  cutout?: Image;
  background?: Image;
  link?: Link;
  /** Long text in pieces: paragraphs, subheadings, pictures, quotes. */
  story?: Story;
  eyebrow?: string;
  match?: { fixture: Fixture; team?: string };
  /**
   * A colour picked from the background photo on the server, so a person
   * card arrives in its colour (lib/imageColor.ts). Filled in by
   * blockItems; never stored.
   */
  tint?: string;
  hidden?: boolean;
};

export const imageRoles: readonly EditableRole[] = [
  'image',
  'cutout',
  'background',
];

/** How one block type uses a role: required or not, and its label there. */
export type RoleUse = {
  required: boolean;
  /** What the form calls the field in this block, e.g. "Name". */
  label: string;
  hint?: string;
};

export const required = (label: string, hint?: string): RoleUse => ({
  required: true,
  label,
  hint,
});
export const optional = (label: string, hint?: string): RoleUse => ({
  required: false,
  label,
  hint,
});

export type Roles = Partial<Record<Role, RoleUse>>;

const roleSchemas: Record<EditableRole, z.ZodType> = {
  title: z.string().trim(),
  subtitle: z.string().trim(),
  text: z.string().trim(),
  value: z.string().trim(),
  image: imageSchema,
  cutout: imageSchema,
  background: imageSchema,
  link: linkSchema,
  story: storySchema,
};

const isEditable = (role: string): role is EditableRole =>
  (editableRoles as readonly string[]).includes(role);

/** Whether items of these roles can be written by hand (not a match). */
export function canWriteItems(roles: Roles): boolean {
  return Object.entries(roles).every(
    ([role, use]) => isEditable(role) || !use.required,
  );
}

/**
 * The form (and the rules) for one item of a block: only the roles that
 * block reads, labelled its way, plus the `hidden` eye toggle.
 */
export function itemSchemaFor(roles: Roles) {
  const shape: Record<string, z.ZodType> = {};
  for (const role of editableRoles) {
    const use = roles[role];
    if (!use) continue;
    let field = roleSchemas[role];
    if (field instanceof z.ZodString)
      field = field.min(
        1,
        `Add ${use.label.toLowerCase()}${use.required ? '' : ' or remove it'}`,
      );
    field = field.meta({
      ...(field.meta() ?? {}),
      label: use.label,
      ...(use.hint ? { hint: use.hint } : {}),
      ...(role === 'text' ? { multiline: true } : {}),
    });
    shape[role] = use.required ? field : field.optional();
  }
  shape.hidden = hiddenFlag;
  return z.object(shape);
}

/** The roles these use requires that the item does not have. */
export function missingRoles(item: Item, roles: Roles): EditableRole[] {
  return editableRoles.filter((role) => {
    if (!roles[role]?.required) return false;
    const value = item[role];
    return (
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    );
  });
}
