import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { cards } from '../lib/components/blocks/cards';
import { layoutSchema } from '../lib/components/blocks/layout';
import { matches } from '../lib/components/blocks/matches';
import { sectionSchema } from '../lib/components/section';
import {
  defaultValue,
  describeField,
  describeSchema,
  humanize,
  isShown,
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

  it('describes the Section columns and background as choices with readable options', () => {
    expect(
      describeSchema(sectionSchema).filter((field) => field.kind === 'enum'),
    ).toEqual([
      expect.objectContaining({
        key: 'columns',
        kind: 'enum',
        label: 'Columns',
        options: [
          { value: '1', label: 'One', sketch: 'one-column' },
          { value: '1-1', label: 'Two', sketch: 'two-column' },
          {
            value: '2-1',
            label: 'Wide left',
            sketch: 'two-column-wide',
          },
          {
            value: '1-2',
            label: 'Wide right',
            sketch: 'two-column-wide-right',
          },
          {
            value: '1-1-1',
            label: 'Three',
            sketch: 'three-column',
          },
        ],
      }),
      expect.objectContaining({
        key: 'align',
        kind: 'enum',
        label: 'Align columns',
      }),
      expect.objectContaining({
        key: 'background',
        kind: 'enum',
        label: 'Background',
      }),
      expect.objectContaining({
        key: 'overlay',
        kind: 'enum',
        label: 'Image overlay',
        emptyIs: 'primary',
        showIf: { background: 'image' },
      }),
      expect.objectContaining({
        key: 'padding',
        kind: 'enum',
        label: 'Padding',
        optional: false,
        options: [
          { value: 'none', label: 'None', sketch: 'pad-none' },
          { value: 'sm', label: 'Small', sketch: 'pad-sm' },
          { value: 'md', label: 'Medium', sketch: 'pad-md' },
          { value: 'lg', label: 'Large', sketch: 'pad-lg' },
        ],
      }),
      expect.objectContaining({
        key: 'width',
        kind: 'enum',
        label: 'Width',
        options: [
          { value: 'full-background', label: 'Column', sketch: 'width-column' },
          { value: 'full-padded', label: 'Wide', sketch: 'width-wide' },
          { value: 'full-width', label: 'Full', sketch: 'width-full' },
        ],
      }),
    ]);
  });

  it('describes a card: a nested image, a heading, optional text and an optional link', () => {
    const fields = describeSchema(cards.itemSchema);
    expect(
      fields.map((field) => [field.key, field.kind, field.optional]),
    ).toEqual([
      ['title', 'text', false],
      ['text', 'textarea', true],
      ['image', 'object', false],
      ['link', 'object', true],
      ['hidden', 'boolean', true],
    ]);
    const image = fields.find((field) => field.key === 'image');
    if (image?.kind !== 'object') throw new Error('unexpected shape');
    expect(image.widget).toBe('image');
    expect(image.fields.map((field) => field.key)).toEqual(['url', 'alt']);
  });

  it('builds a new card from the schema, leaving the optional fields out', () => {
    expect(defaultValue(describeField('card', cards.itemSchema))).toEqual({
      title: '',
      image: { url: '', alt: '' },
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

describe('unions and conditional fields', () => {
  it('describes a union (a block layout) as its shapes, each with its own fields', () => {
    const layout = describeField('layout', layoutSchema);
    if (layout.kind !== 'union') throw new Error('unexpected shape');
    expect(layout.discriminator).toBe('arrange');
    expect(
      layout.options.map((option) => [
        option.value,
        option.label,
        option.fields.map((field) => field.key),
      ]),
    ).toEqual([
      ['grid', 'Grid', ['perRow', 'perRowNarrow']],
      ['list', 'List', []],
      ['featured', 'Featured', []],
      ['wall', 'Wall', []],
      ['carousel', 'Carousel', ['rows']],
      ['slider', 'Slider', ['autoplay', 'indicator', 'indicatorTheme', 'indicatorPosition']],
    ]);
    // Each is picked by its picture.
    expect(layout.options.every((option) => option.sketch)).toBe(true);
    // A new layout starts on the first shape, with its required options.
    expect(defaultValue(layout)).toEqual({ arrange: 'grid' });
  });

  it('shows a field only while its siblings have the values it names', () => {
    const [shape, size] = describeSchema(
      z.object({
        shape: z.enum(['round', 'square']),
        size: z.number().meta({ showIf: { shape: 'square' } }),
      }),
    );
    expect(isShown(shape, {})).toBe(true);
    expect(isShown(size, { shape: 'square' })).toBe(true);
    expect(isShown(size, { shape: 'round' })).toBe(false);
  });

  it('keeps fields the editor manages itself out of the form', () => {
    const content = describeField('content', matches.schema.shape.content);
    if (content.kind !== 'union') throw new Error('unexpected shape');
    // Matches only come from the fixtures service: one shape, no items.
    expect(content.options.map((option) => option.value)).toEqual(['fixtures']);
    const hidden = content.options[0].fields.find(
      (field) => field.key === 'hidden',
    );
    expect(hidden && isShown(hidden, {})).toBe(false);
  });
});

describe('Section props', () => {
  it('gives Section an optional heading, five column layouts, a padding that always has a value and a width', () => {
    const fields = describeSchema(sectionSchema);
    expect(fields.map((field) => [field.key, field.optional])).toEqual([
      ['heading', true],
      ['intro', true],
      ['columns', false],
      ['align', false],
      ['background', false],
      ['backgroundImage', true],
      ['overlay', true],
      ['padding', false],
      ['width', false],
    ]);
    const layout = fields[2];
    if (layout.kind !== 'enum') throw new Error('unexpected shape');
    expect(layout.options.map((option) => option.value)).toEqual([
      '1',
      '1-1',
      '2-1',
      '1-2',
      '1-1-1',
    ]);
  });

  it('draws the Section background as pictures too', () => {
    const background = describeSchema(sectionSchema).find(
      (field) => field.key === 'background',
    );
    if (background?.kind !== 'enum') throw new Error('unexpected shape');
    expect(background.options.every((option) => 'sketch' in option)).toBe(true);
    expect(background.options.map((option) => option.label)).toEqual([
      'Primary',
      'Secondary',
      'Glass',
      'Image',
      'None',
    ]);
  });
});

describe('editor tabs', () => {
  const tabs = (fields: ReturnType<typeof describeSchema>) =>
    (['content', 'layout', 'style'] as const).map((group) => [
      group,
      fields.filter((field) => field.group === group).map((field) => field.key),
    ]);

  it('puts each Section field on the tab its schema names', () => {
    expect(tabs(describeSchema(sectionSchema))).toEqual([
      ['content', ['heading', 'intro']],
      ['layout', ['columns', 'align', 'padding', 'width']],
      ['style', ['background', 'backgroundImage', 'overlay']],
    ]);
  });

  it('gives a block one prop per tab', () => {
    expect(tabs(describeSchema(cards.schema))).toEqual([
      ['content', ['content']],
      ['layout', ['layout']],
      ['style', ['style']],
    ]);
  });
});
