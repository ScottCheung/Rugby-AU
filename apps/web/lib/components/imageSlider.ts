import { z } from 'zod';
import { defineComponent } from './define';
import { imageSchema, linkSchema } from './fields';

const slideSchema = z.object({
  image: imageSchema,
  heading: z.string().trim().min(1, 'Add a heading').meta({ label: 'Heading' }),
  text: z
    .string()
    .trim()
    .min(1, 'Add some text or remove it')
    .optional()
    .meta({ label: 'Text', multiline: true }),
  button: linkSchema.optional().meta({ label: 'Button' }),
});

export const imageSliderSchema = z.object({
  slides: z.array(slideSchema).meta({ label: 'Slides', itemLabel: 'Slide' }),
  autoplay: z.boolean().default(false).meta({
    group: 'style',
    label: 'Change slides automatically',
    hint: 'Every 6 seconds. Pauses while a visitor points at or focuses the slider.',
  }),
});

export const imageSlider = defineComponent({
  type: 'imageSlider',
  label: 'Image Slider',
  description:
    'Large images that change one after another, each with a heading, text and a button.',
  schema: imageSliderSchema,
  defaultProps: { slides: [], autoplay: false },
  acceptsChildren: false,
});
