import type { ComponentType } from './model';

export type FieldDefinition = {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'cards';
  description?: string;
  options?: { label: string; value: string }[];
};

export type ComponentDefinition = {
  type: ComponentType;
  label: string;
  description: string;
  fields: FieldDefinition[];
  allowsChildren: boolean;
  defaults: Record<string, unknown>;
};

export const componentDefinitions: ComponentDefinition[] = [
  {
    type: 'section',
    label: 'Section',
    description:
      'A layout container. Sections can contain other sections or card grids.',
    allowsChildren: true,
    fields: [
      {
        name: 'layout',
        label: 'Layout',
        type: 'select',
        options: [
          { label: 'Full width', value: 'full' },
          { label: 'Two columns', value: 'two-column' },
        ],
      },
      {
        name: 'background',
        label: 'Background',
        type: 'select',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Light', value: 'light' },
          { label: 'Brand colour', value: 'brand' },
        ],
      },
    ],
    defaults: { layout: 'full', background: 'none' },
  },
  {
    type: 'card-grid',
    label: 'Card Grid',
    description: 'A heading and cards with image, title, and an optional link.',
    allowsChildren: false,
    fields: [
      { name: 'title', label: 'Section heading', type: 'text' },
      {
        name: 'cards',
        label: 'Cards',
        type: 'cards',
        description:
          'Add an image URL and alternative text for each card. Links are optional.',
      },
    ],
    defaults: { title: 'Meet the team', cards: [] },
  },
];

export function getDefinition(type: ComponentType) {
  return componentDefinitions.find((definition) => definition.type === type)!;
}
