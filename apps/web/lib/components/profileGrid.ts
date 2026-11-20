import { z } from 'zod';
import { defineComponent } from './define';
import { imageSchema, linkSchema } from './fields';

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Add a name').meta({ label: 'Name' }),
  role: z
    .string()
    .trim()
    .min(1, 'Add a role or position, or remove it')
    .optional()
    .meta({ label: 'Role or position', placeholder: 'Fly-half' }),
  text: z
    .string()
    .trim()
    .min(1, 'Add some text or remove it')
    .optional()
    .meta({ label: 'Text', multiline: true }),
  // Photos are optional: without them the card shows a silhouette and
  // initials in the site's colours.
  cutout: imageSchema.optional().meta({
    label: 'Cut-out photo',
    hint: 'A PNG or WebP with a transparent background. The person can rise above the top of the card.',
    widget: 'image',
  }),
  background: imageSchema.optional().meta({
    label: 'Background',
    hint: 'The card colour is taken from the bottom of this photo automatically.',
    widget: 'image',
  }),
  link: linkSchema.optional(),
});

export const profileGridSchema = z.object({
  title: z.string().trim().meta({ label: 'Title', placeholder: 'The squad' }),
  display: z
    .enum(['carousel', 'grid'])
    .default('carousel')
    .meta({
      group: 'layout',
      label: 'Display as',
      optionLabels: { carousel: 'Carousel', grid: 'Grid' },
      optionSketches: { carousel: 'carousel', grid: 'grid' },
    }),
  profiles: z
    .array(profileSchema)
    .meta({ label: 'People', itemLabel: 'Person' }),
});

export const profileGrid = defineComponent({
  type: 'profileGrid',
  label: 'Profile cards',
  description:
    'People as cards: a cut-out photo rising out of a background, or initials and a silhouette when there is no photo.',
  schema: profileGridSchema,
  defaultProps: { title: 'The squad', display: 'carousel', profiles: [] },
  acceptsChildren: false,
});

/** Background photos a page's profile cards take their colour from. */
export function profileBackgrounds(
  nodes: {
    type: string;
    props: Record<string, unknown>;
    children?: unknown[];
  }[],
): string[] {
  return nodes.flatMap((node) => {
    const own =
      node.type === 'profileGrid'
        ? ((node.props.profiles as { background?: { url?: string } }[]) ?? [])
            .map((profile) => profile.background?.url)
            .filter((url): url is string => typeof url === 'string')
        : [];
    return [
      ...own,
      ...profileBackgrounds((node.children ?? []) as typeof nodes),
    ];
  });
}
