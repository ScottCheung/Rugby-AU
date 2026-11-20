import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { cardGridSchema } from '../lib/components/cardGrid';
import { imageSliderSchema } from '../lib/components/imageSlider';
import { sectionSchema } from '../lib/components/section';
import {
  defaultValue,
  describeField,
  describeSchema,
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
          { value: 'full', label: 'Full width' },
          { value: 'two-column', label: 'Two columns' },
          { value: 'two-column-wide', label: 'Two columns, wide left' },
          { value: 'three-column', label: 'Three columns' },
        ],
      }),
      expect.objectContaining({
        key: 'background',
        kind: 'enum',
        label: 'Background',
      }),
    ]);
  });

  it('describes the Card Grid: a list of cards with a nested image and an optional link', () => {
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
      ['link', 'object', true],
    ]);
    const image = cards.item.fields[0];
    if (image.kind !== 'object') throw new Error('unexpected shape');
    expect(image.fields.map((field) => [field.key, field.kind])).toEqual([
      ['url', 'url'],
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
  it('shows the Card Grid variant as a three-option choice and unwraps its default', () => {
    const variant = describeSchema(cardGridSchema).find(
      (field) => field.key === 'variant',
    );
    expect(variant).toMatchObject({
      kind: 'enum',
      label: 'Display as',
      optional: false,
      options: [
        { value: 'grid', label: 'Grid' },
        { value: 'carousel', label: 'Carousel' },
        { value: 'masonry', label: 'Masonry' },
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

  it('gives Section an optional heading and four layouts', () => {
    const fields = describeSchema(sectionSchema);
    expect(fields.map((field) => [field.key, field.optional])).toEqual([
      ['heading', true],
      ['intro', true],
      ['layout', false],
      ['background', false],
    ]);
    const layout = fields[2];
    if (layout.kind !== 'enum') throw new Error('unexpected shape');
    expect(layout.options.map((option) => option.value)).toEqual([
      'full',
      'two-column',
      'two-column-wide',
      'three-column',
    ]);
  });
});
