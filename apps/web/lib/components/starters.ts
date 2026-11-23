import type { ComponentNode } from '../types';
import { createNode } from './createNode';
import type { BlockDefinition } from './blocks/defineBlock';
import { sourceIds, sources, type SourceId } from './blocks/sources';
import { blockDefinitions, getBlock, type ComponentType } from './registry';

/**
 * What "Add a block" offers: each block type as it starts, plus a few
 * blocks that start from the site's data (News is a Cards block of the
 * latest articles). Presets only: what they create is an ordinary block,
 * which can be changed in every way afterwards.
 */
export type Starter = {
  id: string;
  group: 'write' | 'site' | 'layout';
  label: string;
  description: string;
  sketch: string;
  create: () => ComponentNode;
};

export const starterGroups = {
  write: {
    label: 'Write',
    hint: 'Items you write here.',
  },
  site: {
    label: "From the site's content",
    hint: 'Filled in automatically. Edit an article once and every page updates.',
  },
  layout: {
    label: 'Layout',
    hint: 'Blocks side by side, inside this Section.',
  },
} as const;

/**
 * Blocks offered once per look, each its own tile with the look named
 * under the block's name, so a look is picked straight away rather than
 * found in Style afterwards. The block itself is the same either way.
 */
const looks: Partial<
  Record<
    ComponentType,
    {
      id: string;
      caption: string;
      sketch: string;
      style: Record<string, unknown>;
    }[]
  >
> = {
  cards: [
    {
      id: 'card',
      caption: 'Photo above',
      sketch: 'item-card',
      style: { look: 'card' },
    },
    {
      id: 'overlay',
      caption: 'Text on photo',
      sketch: 'item-overlay',
      style: { look: 'overlay' },
    },
  ],
};

const fromBlock = (type: ComponentType): Starter[] => {
  const block = getBlock(type)!;
  const base: Starter = {
    id: type,
    group: 'write',
    label: block.label,
    description: block.description,
    sketch: block.sketch,
    create: () => createNode(type),
  };
  const variants = looks[type];
  if (!variants) return [base];
  return variants.map((look) => ({
    ...base,
    id: `${type}-${look.id}`,
    description: look.caption,
    sketch: look.sketch,
    create: () => {
      const props = block.defaultProps as Record<string, unknown>;
      return createNode(type, {
        ...props,
        style: { ...(props.style as Record<string, unknown>), ...look.style },
      });
    },
  }));
};

/** The ready-made block a data source offers (sources.ts, `starter`). */
const fromSource = (id: SourceId): Starter[] => {
  const source = sources[id];
  const starter = source.starter;
  const block = starter && getBlock(starter.type);
  if (!starter || !block) return [];
  return [
    {
      id,
      group: 'site',
      label: starter.label,
      description: starter.description,
      sketch: block.sketch,
      create: () =>
        createNode(block.type as ComponentType, {
          ...block.defaultProps,
          content: { from: id, ...source.defaults },
          layout: starter.layout ?? block.defaultProps.layout,
        }),
    },
  ];
};

export const starters: Starter[] = [
  // Every block type whose items are written by hand, as it starts...
  ...blockDefinitions
    .filter((block) => (block as BlockDefinition).writable)
    .flatMap((block) => fromBlock(block.type)),
  // ...the blocks the site's content offers...
  ...sourceIds.flatMap(fromSource),
  // ...and a Section, to put blocks side by side inside another.
  {
    id: 'section',
    group: 'layout',
    label: 'Section',
    description: 'Its own heading and columns, inside this Section.',
    sketch: 'two-column',
    create: () => {
      const node = createNode('section');
      return { ...node, props: { ...node.props, columns: '1-1' } };
    },
  },
];
