'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Heading } from '@/components/primitives/Heading';
import { Image } from '@/components/primitives/Image';
import type { PropsOf } from '@/lib/components/registry';
import { resolveHref } from '@/lib/links';
import { ease, entrance, timing } from '@scottcheung/ui/motion';

// The caption of the active slide comes in line by line: heading, text,
// then button.
const caption = {
  hidden: {},
  shown: {
    transition: { staggerChildren: timing.step, delayChildren: 0.2 },
  },
};
const captionLine = {
  hidden: entrance.hidden,
  shown: {
    ...entrance.shown,
    transition: { duration: timing.caption, ease },
  },
};

const INTERVAL_MS = 6000;

/**
 * Full-width slides with a caption. A client component because switching
 * slides is interactive; it still renders the first slide on the server.
 */
export function ImageSlider({
  slides,
  autoplay = false,
  siteSlug,
}: PropsOf<'imageSlider'> & { siteSlug: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const current = count > 0 ? index % count : 0;

  useEffect(() => {
    if (!autoplay || paused || count < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(
      () => setIndex((value) => (value + 1) % count),
      INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [autoplay, paused, count]);

  if (count === 0) {
    return (
      <div className="media-slider grid place-items-center rounded-site bg-surface-light text-muted-text">
        Add a slide to show it here.
      </div>
    );
  }

  const go = (next: number) => setIndex((next + count) % count);

  return (
    // The outer box is the container its own size queries refer to.
    <div className="@container">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="media-slider relative overflow-hidden rounded-site bg-surface-light"
      >
        {slides.map((slide, slideIndex) => {
          const active = slideIndex === current;
          const href = slide.button && resolveHref(slide.button.href, siteSlug);
          return (
            <div
              key={slideIndex}
              aria-hidden={!active}
              // Hidden slides must not be reachable with the keyboard either.
              inert={!active}
              className={`absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            >
              <Image
                src={slide.image.url}
                alt={slide.image.alt}
                eager={slideIndex === 0}
              />
              {/* Theme-coloured fades: the bottom carries the caption, the top
                  keeps light photos readable. */}
              <motion.div
                className="absolute inset-x-0 bottom-0 z-20"
                style={{ color: 'var(--hero-text, #fff)' }}
                variants={caption}
                // Start in place: the first caption is visible before
                // JavaScript runs; later slide changes animate.
                initial={false}
                animate={active ? 'shown' : 'hidden'}
              >
                {/* Full width and as tall as the caption, so the fill follows
                    the text. It runs past the bottom edge and is tilted:
                    higher on the left (the caption), lower on the right. */}
                <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-3 px-site-sm pt-site-lg pb-site-md">
                  <motion.div variants={captionLine}>
                    <Heading level={2}>{slide.heading}</Heading>
                  </motion.div>
                  {slide.text && (
                    <motion.p
                      variants={captionLine}
                      className="text-lg leading-relaxed text-white/85"
                    >
                      {slide.text}
                    </motion.p>
                  )}
                  {slide.button && href && (
                    <motion.div variants={captionLine}>
                      <Button href={href}>{slide.button.label}</Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}

        {/* Fixed across slides, so it does not cross-fade with the photos. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24" style={{ background: "linear-gradient(to bottom, var(--hero-top-tint, color-mix(in oklch, var(--hero-fade, var(--color-deep)) 35%, transparent)) var(--hero-top-hold, 0%), transparent)" }} />

        {/* Fixed across slides: the photos change under it, the fade does not. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-8 z-10 h-[50%]" style={{ background: "linear-gradient(to top, var(--hero-fade, var(--color-deep)) 0%, var(--hero-fade, var(--color-deep)) 18%, color-mix(in oklch, var(--hero-fade, var(--color-deep)) 85%, transparent) 35%, color-mix(in oklch, var(--hero-fade, var(--color-deep)) 45%, transparent) 60%, color-mix(in oklch, var(--hero-fade, var(--color-deep)) 15%, transparent) 85%, transparent 100%)", transform: 'skewY(2deg)', transformOrigin: 'left bottom' }} />

        {count > 1 && (
          // Same column as the caption, so the controls line up with the content.
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 mx-auto flex w-full max-w-6xl justify-end px-site-sm @md:bottom-site-md">
          <div className="pointer-events-auto flex items-center gap-2">
            <SliderButton
              label="Previous slide"
              onClick={() => go(current - 1)}
            >
              ←
            </SliderButton>
            <div className="flex gap-1.5 px-1">
              {slides.map((_, dot) => (
                <button
                  key={dot}
                  type="button"
                  aria-label={`Show slide ${dot + 1}`}
                  aria-current={dot === current || undefined}
                  onClick={() => go(dot)}
                  className={`h-2 rounded-full transition-all ${dot === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                />
              ))}
            </div>
            <SliderButton label="Next slide" onClick={() => go(current + 1)}>
              →
            </SliderButton>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SliderButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full bg-white/90 text-lg text-black shadow transition hover:bg-white"
    >
      {children}
    </button>
  );
}
