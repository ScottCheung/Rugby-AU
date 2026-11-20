'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Heading } from '@/components/primitives/Heading';
import { Image } from '@/components/primitives/Image';
import type { PropsOf } from '@/lib/components/registry';
import { resolveHref } from '@/lib/links';

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
      <div className="grid aspect-[21/9] place-items-center rounded-site bg-surface-light text-muted-text">
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
        className="relative aspect-[4/5] overflow-hidden rounded-site bg-surface-light @md:aspect-[16/9] @3xl:aspect-[21/9]"
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
              {/* A dark fade at the bottom keeps the caption readable on any photo. */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex max-w-2xl flex-col items-start gap-3 p-site-md text-white">
                <Heading level={2}>{slide.heading}</Heading>
                {slide.text && (
                  <p className="text-base leading-relaxed text-white/85">
                    {slide.text}
                  </p>
                )}
                {slide.button && href && (
                  <Button href={href}>{slide.button.label}</Button>
                )}
              </div>
            </div>
          );
        })}

        {count > 1 && (
          <div className="absolute right-4 bottom-4 flex items-center gap-2 @md:right-site-md @md:bottom-site-md">
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
