import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { cardGridSchema } from '../lib/components/cardGrid';
import { imageSliderSchema } from '../lib/components/imageSlider';
import { sectionSchema } from '../lib/components/section';
import { statsSchema } from '../lib/components/stats';
import {
  defaultValue,
  describeField,
  describeSchema,
  groupFields,
  humanize,
} from '../lib/forms/describe';
import '../lib/components/editorMeta';

describe('describeSchema', () => {
  it('maps each Zod type to a field kind', () => {
    const fields = describeSchema(
      z.object({
        name: z.string(),
        bio: z.string().meta({ multiline: true }),
        website: z.url(),
        age: z.number(),
        active: z.boolean(),
        size: z.enum(['small', 'extra-large']),
        address: z.object({ city: z.string() }),
        tags: z.array(z.string()),
        nickname: z.string().optional(),
      }),
    );
    expect(
      fields.map((field) => [field.key, field.kind, field.optional]),
    ).toEqual([
      ['name', 'text', false],
      ['bio', 'textarea', false],
      ['website', 'url', false],
      ['age', 'number', false],
      ['active', 'boolean', false],
      ['size', 'enum', false],
      ['address', 'object', false],
      ['tags', 'array', false],
      ['nickname', 'text', true],
    ]);
  });

  it('uses schema metadata for labels and falls back to a humanised key', () => {
    const [labelled, plain] = describeSchema(
      z.object({
        heroTitle: z.string().meta({
          label: 'Big title',
          hint: 'Shown at the top',
          placeholder: 'Hi',
        }),
        heroSubtitle: z.string(),
      }),
    );
    expect(labelled).toMatchObject({
      label: 'Big title',
      hint: 'Shown at the top',
      placeholder: 'Hi',
    });
    expect(plain.label).toBe('Hero subtitle');
  });

  it('reads metadata placed on either side of .optional()', () => {
    expect(
      describeField('a', z.string().meta({ label: 'Inner' }).optional()).label,
    ).toBe('Inner');
    expect(
      describeField('b', z.string().optional().meta({ label: 'Outer' })).label,
    ).toBe('Outer');
  });

  it('describes the Section layout and background as choices with readable options', () => {
    expect(
      describeSchema(sectionSchema).filter((field) => field.kind === 'enum'),
    ).toEqual([
      expect.objectContaining({
        key: 'layout',
        kind: 'enum',
        label: 'Layout',
        options: [
          { value: 'full', label: 'One column', sketch: 'one-column' },
          { value: 'two-column', label: 'Two columns', sketch: 'two-column' },
          {
            value: 'two-column-wide',
            label: 'Two columns, wide left',
            sketch: 'two-column-wide',
          },
          {
            value: 'two-column-wide-right',
            label: 'Two columns, wide right',
            sketch: 'two-column-wide-right',
          },
          {
            value: 'three-column',
            label: 'Three columns',
            sketch: 'three-column',
          },
        ],
      }),
      expect.objectContaining({
        key: 'background',
        kind: 'enum',
        label: 'Background',
      }),
      expect.objectContaining({
        key: 'width',
        kind: 'enum',
        label: 'Width',
        options: [
          { value: 'contained', label: 'Page column', sketch: 'contained' },
          {
            value: 'full-background',
            label: 'Full-width background',
            sketch: 'full-background',
          },
          { value: 'full-width', label: 'Edge to edge', sketch: 'full-width' },
        ],
      }),
    ]);
  });

  it('describes the Card Grid: a list of cards with a nested image, optional text and an optional link', () => {
    const [title, , cards] = describeSchema(cardGridSchema);
    expect(title).toMatchObject({
      key: 'title',
      kind: 'text',
      optional: false,
    });
    expect(cards.kind).toBe('array');
    if (cards.kind !== 'array' || cards.item.kind !== 'object')
      throw new Error('unexpected shape');
    expect(cards.itemLabel).toBe('Card');
    expect(
      cards.item.fields.map((field) => [field.key, field.kind, field.optional]),
    ).toEqual([
      ['image', 'object', false],
      ['heading', 'text', false],
      ['text', 'textarea', true],
      ['link', 'object', true],
    ]);
    const image = cards.item.fields[0];
    if (image.kind !== 'object') throw new Error('unexpected shape');
    expect(image.fields.map((field) => [field.key, field.kind])).toEqual([
      // Text, not a URL input: a path on this site ("/players/x.webp") is valid too.
      ['url', 'text'],
      ['alt', 'text'],
    ]);
  });
});

describe('defaultValue', () => {
  it('builds a new card from the schema, leaving the optional link out', () => {
    const [, , cards] = describeSchema(cardGridSchema);
    if (cards.kind !== 'array') throw new Error('unexpected shape');
    expect(defaultValue(cards.item)).toEqual({
      image: { url: '', alt: '' },
      heading: '',
    });
  });

  it('starts enums on their first option and lists empty', () => {
    const [size, tags, active, count] = describeSchema(
      z.object({
        size: z.enum(['s', 'm']),
        tags: z.array(z.string()),
        active: z.boolean(),
        count: z.number(),
      }),
    );
    expect([size, tags, active, count].map(defaultValue)).toEqual([
      's',
      [],
      false,
      0,
    ]);
  });
});

describe('humanize', () => {
  it.each([
    ['title', 'Title'],
    ['showDate', 'Show date'],
    ['two-column', 'Two column'],
  ])('%s -> %s', (key, expected) => expect(humanize(key)).toBe(expected));
});

describe('new component props', () => {
  it('shows the Card Grid variant as a choice of layouts and unwraps its default', () => {
    const variant = describeSchema(cardGridSchema).find(
      (field) => field.key === 'variant',
    );
    expect(variant).toMatchObject({
      kind: 'enum',
      label: 'Display as',
      optional: false,
      options: [
        { value: 'grid', label: 'Grid', sketch: 'grid' },
        { value: 'list', label: 'List', sketch: 'list' },
        { value: 'featured', label: 'Featured', sketch: 'featured' },
        { value: 'overlay', label: 'Overlay', sketch: 'overlay' },
        { value: 'carousel', label: 'Carousel', sketch: 'carousel' },
        { value: 'masonry', label: 'Masonry', sketch: 'masonry' },
      ],
    });
  });

  it('describes the Image Slider: a list of slides with optional text and button, and a switch', () => {
    const [slides, autoplay] = describeSchema(imageSliderSchema);
    expect(autoplay).toMatchObject({ key: 'autoplay', kind: 'boolean' });
    if (slides.kind !== 'array' || slides.item.kind !== 'object')
      throw new Error('unexpected shape');
    expect(
      slides.item.fields.map((field) => [
        field.key,
        field.kind,
        field.optional,
      ]),
    ).toEqual([
      ['image', 'object', false],
      ['heading', 'text', false],
      ['text', 'textarea', true],
      ['button', 'object', true],
    ]);
    expect(slides.item.fields[3].label).toBe('Button');
  });

  it('gives Section an optional heading, five layouts and a width', () => {
    const fields = describeSchema(sectionSchema);
    expect(fields.map((field) => [field.key, field.optional])).toEqual([
      ['heading', true],
      ['intro', true],
      ['layout', false],
      ['background', false],
      ['width', false],
    ]);
    const layout = fields[2];
    if (layout.kind !== 'enum') throw new Error('unexpected shape');
    expect(layout.options.map((option) => option.value)).toEqual([
      'full',
      'two-column',
      'two-column-wide',
      'two-column-wide-right',
      'three-column',
    ]);
  });

  it('leaves options without sketches as a plain choice', () => {
    const background = describeSchema(sectionSchema).find(
      (field) => field.key === 'background',
    );
    if (background?.kind !== 'enum') throw new Error('unexpected shape');
    expect(background.options.every((option) => !('sketch' in option))).toBe(
      true,
    );
  });
});

describe('groupFields', () => {
  it('splits a Section form into content, layout and style tabs', () => {
    const groups = groupFields(describeSchema(sectionSchema)).map((entry) => [
      entry.group,
      entry.fields.map((field) => field.key),
    ]);
    expect(groups).toEqual([
      ['content', ['heading', 'intro']],
      ['layout', ['layout', 'width']],
      ['style', ['background']],
    ]);
  });

  it('gives a content-only component a single group, so no tabs', () => {
    expect(groupFields(describeSchema(statsSchema))).toHaveLength(1);
  });
});
