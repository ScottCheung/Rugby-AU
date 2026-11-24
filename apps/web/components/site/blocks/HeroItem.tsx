import { Button } from '@/components/primitives/Button';
import { Heading } from '@/components/primitives/Heading';
import { Image } from '@/components/primitives/Image';
import { resolveHref } from '@/lib/links';
import type { ItemProps } from './types';

/**
 * A large photo with its caption on it, in the flow at the bottom (the hero
 * grows with a long caption, media.css). The caption stays small and in
 * one corner so the photo has room; a dark scrim under that corner keeps
 * it readable, a theme-coloured fade blends the bottom into the page, and
 * the top fade keeps light photos readable under the site header.
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
      {/* A dark scrim under the caption's corner, so the text reads on any
          photo; the theme-coloured fade below it blends into the page. */}
      <div
        aria-hidden
        className="hero-scrim pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%]"
        style={{
          background:
            'linear-gradient(to top, var(--hero-fade, var(--color-deep)) 0%, var(--hero-fade, var(--color-deep)) 22%, color-mix(in oklch, var(--hero-fade, var(--color-deep)) 82%, transparent) 40%, color-mix(in oklch, var(--hero-fade, var(--color-deep)) 50%, transparent) 60%, color-mix(in oklch, var(--hero-fade, var(--color-deep)) 18%, transparent) 82%, transparent 100%)',
        }}
      />
      <div
        className="relative z-10"
        style={{ color: 'var(--hero-text, #fff)' }}
      >
        <div
          // Its lines stagger in when the hero is a slider's slide.
          data-stagger
          className="hero-copy mx-auto flex w-full max-w-6xl flex-col items-start gap-2.5 @3xl:gap-3.5"
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
          <Heading level={1} as="h2" className="hero-title">
            {item.title}
          </Heading>
          {item.text && (
            <p className="hero-text m-0 leading-relaxed text-white/90">
              {item.text}
            </p>
          )}
          {item.link && href && <Button href={href}>{item.link.label}</Button>}
        </div>
      </div>
    </div>
  );
}
