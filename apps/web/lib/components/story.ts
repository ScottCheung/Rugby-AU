import { z } from 'zod';
import { imageSchema } from './fields';
import './editorMeta';

/**
 * A story: long text made of pieces in any order (a paragraph, a
 * subheading, a picture, a quote, a list), so an article can put a photo
 * between two paragraphs or a quote under a subheading. Each piece is one
 * atom with only its own fields; how it looks is the site's, not the
 * piece's. Used by an article's body and by the Story block.
 */
const pieceKinds = ['paragraph', 'heading', 'image', 'quote', 'list'] as const;
export type PieceKind = (typeof pieceKinds)[number];

const words = (label: string, message: string) =>
  z.string().trim().min(1, message).meta({ label, multiline: true });

export const storyPieceSchema = z
  .discriminatedUnion('kind', [
    z.object({
      kind: z.literal('paragraph'),
      text: words('Text', 'Write the paragraph, or remove it'),
    }),
    z.object({
      kind: z.literal('heading'),
      text: z
        .string()
        .trim()
        .min(1, 'Write the subheading, or remove it')
        .meta({ label: 'Subheading' }),
    }),
    z.object({
      kind: z.literal('image'),
      image: imageSchema,
      caption: z
        .string()
        .trim()
        .min(1, 'Write a caption, or remove it')
        .optional()
        .meta({ label: 'Caption' }),
      width: z
        .enum(['column', 'wide'])
        .default('column')
        .meta({
          label: 'Width',
          optionLabels: { column: 'Text width', wide: 'Wider than the text' },
        }),
    }),
    z.object({
      kind: z.literal('quote'),
      text: words('Quote', 'Write the quote, or remove it'),
      by: z
        .string()
        .trim()
        .min(1, 'Say who said it, or remove it')
        .optional()
        .meta({ label: 'Who said it' }),
    }),
    z.object({
      kind: z.literal('list'),
      numbered: z.boolean().optional().meta({ label: 'Numbered' }),
      items: z
        .array(z.string().trim().min(1, 'Write the point, or remove it'))
        .min(1, 'Add at least one point')
        .meta({ label: 'Points', itemLabel: 'Point' }),
    }),
  ])
  .meta({
    label: 'Piece',
    optionLabels: {
      paragraph: 'Paragraph',
      heading: 'Subheading',
      image: 'Picture',
      quote: 'Quote',
      list: 'List',
    },
    optionSketches: {
      paragraph: 'piece-paragraph',
      heading: 'piece-heading',
      image: 'piece-image',
      quote: 'piece-quote',
      list: 'piece-list',
    },
  });

export type StoryPiece = z.infer<typeof storyPieceSchema>;
export type Story = StoryPiece[];

export const storySchema = z
  .array(storyPieceSchema)
  .min(1, 'Add at least one paragraph')
  .meta({ label: 'Story', itemLabel: 'Piece', widget: 'story' });

export const isStoryField = (field: z.ZodType) =>
  field.meta()?.widget === 'story';

/**
 * A story from plain text, as article bodies were written before they
 * were made of pieces: an empty line between paragraphs, "## " starting
 * a subheading. Already a story: returned as it is.
 */
export function storyFromText(value: unknown): Story {
  if (Array.isArray(value)) return value as Story;
  if (typeof value !== 'string') return [];
  return value
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part): StoryPiece =>
      part.startsWith('## ')
        ? { kind: 'heading', text: part.slice(3).trim() }
        : { kind: 'paragraph', text: part },
    );
}

/** A story's words, for a summary line or search. */
export function storyText(story: Story): string {
  return story
    .flatMap((piece) =>
      piece.kind === 'list'
        ? piece.items
        : piece.kind === 'image'
          ? (piece.caption ?? [])
          : piece.text,
    )
    .join(' ');
}

export { pieceKinds };
