import { Button } from '@/components/primitives/Button';
import { Heading } from '@/components/primitives/Heading';
import { Image } from '@/components/primitives/Image';
import { resolveHref } from '@/lib/links';
import type { ItemProps } from './types';

/**
 * A large photo with its caption on it. Theme-coloured fades keep the text
 * readable: the bottom one carries the caption, the top one keeps light
 * photos readable under the site header.
 */
export function HeroItem({ item, style, index, siteSlug }: ItemProps<'hero'>) {
  const href = item.link && resolveHref(item.link.href, siteSlug);
  return (
    <div
      className={`media-slider relative overflow-hidden rounded-site bg-surface-light ${style.height === 'short' ? 'media-banner' : ''}`}
    >
      {item.image && (
        <Image src={item.image.url} alt={item.image.alt} eager={index === 0} />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{
          background:
            'linear-gradient(to bottom, var(--hero-top-tint, color-mix(in oklch, var(--hero-fade, var(--color-deep)) 35%, transparent)) var(--hero-top-hold, 0%), transparent)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-8 h-[50%]"
        style={{
          background:
            'linear-gradient(to top, var(--hero-fade, var(--color-deep)) 0%, var(--hero-fade, var(--color-deep)) 18%, color-mix(in oklch, var(--hero-fade, var(--color-deep)) 85%, transparent) 35%, color-mix(in oklch, var(--hero-fade, var(--color-deep)) 45%, transparent) 60%, color-mix(in oklch, var(--hero-fade, var(--color-deep)) 15%, transparent) 85%, transparent 100%)',
          transform: 'skewY(2deg)',
          transformOrigin: 'left bottom',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ color: 'var(--hero-text, #fff)' }}
      >
        <div
          // Its lines stagger in when the hero is a slider's slide.
          data-stagger
          className="mx-auto flex w-full max-w-6xl flex-col items-start gap-3 pt-site-lg"
          // The same distance from the side and the bottom edge (--hero-pad,
          // app/styles/site/media.css). A slider's controls on the left or centre get
          // a row of their own.
          style={{
            paddingInline: 'var(--hero-pad)',
            paddingBottom:
              'calc(var(--hero-pad) + var(--slider-controls-room, 0px))',
          }}
        >
          {item.eyebrow && (
            <p className="m-0 text-sm font-semibold tracking-wide uppercase opacity-80">
              {item.eyebrow}
            </p>
          )}
          <Heading level={1} as="h2">
            {item.title}
          </Heading>
          {item.text && (
            <p className="m-0 max-w-2xl text-base leading-relaxed text-white/85 @xl/page:text-lg">
              {item.text}
            </p>
          )}
          {item.link && href && <Button href={href}>{item.link.label}</Button>}
        </div>
      </div>
    </div>
  );
}
