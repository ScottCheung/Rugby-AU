import { z } from 'zod';
import { defineBlock } from './defineBlock';
import { optional, required } from './roles';

/** Photos at their own shape with a caption; they open full size. */
export const photos = defineBlock({
  type: 'photos',
  label: 'Photos',
  description:
    'Photos at their own shape, with a caption. They open full size.',
  itemLabel: 'Photo',
  itemsLabel: 'Photos',
  sketch: 'item-photo',
  roles: {
    image: required('Image'),
    title: required('Caption'),
    link: optional('Link', 'Without a link, the photo opens full size.'),
  },
  style: z.object({
    caption: z.boolean().meta({ label: 'Show the caption' }),
    captionAlign: z
      .enum(['left', 'center', 'right'])
      .default('left')
      .meta({
        label: 'Caption position',
        optionLabels: { left: 'Left', center: 'Centre', right: 'Right' },
      }),
  }),
  defaults: {
    layout: { arrange: 'wall' },
    style: { caption: false, captionAlign: 'left' },
  },
  cell: { min: '14rem', perView: 3 },
});
