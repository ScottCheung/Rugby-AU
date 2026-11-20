'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Button } from '@/components/primitives/Button';
import { Heading } from '@/components/primitives/Heading';
import { averageBottom, cardShade, toHex } from '@/lib/color';
import type { PropsOf } from '@/lib/components/registry';
import { resolveHref } from '@/lib/links';
import { Reveal } from './Reveal';

type Profile = PropsOf<'profileGrid'>['profiles'][number];

/**
 * One person: the cut-out rises out of a background photo, and the card's
 * colour (taken from the bottom of that photo) fades up over both, so the
 * figure blends into the card. Layers, back to front: background, person,
 * fade, text. Styles in app/globals.css (.profile-card).
 */
export function ProfileCard({
  profile,
  color,
  index,
  siteSlug,
  className = '',
}: {
  profile: Profile;
  /** From the server (lib/imageColor.ts); worked out here if missing. */
  color?: string;
  index: number;
  siteSlug: string;
  className?: string;
}) {
  const picked = usePickedColor(color ? undefined : profile.background.url);
  const shade = color ?? picked ?? '#1f2937';
  const href = profile.link && resolveHref(profile.link.href, siteSlug);

  return (
    <Reveal
      as="article"
      delay={Math.min(index * 0.15, 0.6)}
      className={`profile-card ${href ? 'card-link' : ''} ${className}`}
    >
      <div className="profile-card__panel" style={{ background: shade }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={profile.background.url} alt="" loading="lazy" />
        <div style={fade(shade, 22, 62)} />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="profile-card__person"
        src={profile.cutout.url}
        alt={profile.cutout.alt}
        loading="lazy"
      />
      <div className="profile-card__front">
        <div style={fade(shade, 16, 44)} />
      </div>
      <div className="profile-card__text">
        <p className="m-0 text-xs font-semibold tracking-wide uppercase opacity-80">
          {profile.role}
        </p>
        <Heading level={3}>{profile.name}</Heading>
        {profile.text && (
          <p className="m-0 text-sm leading-relaxed opacity-85">
            {profile.text}
          </p>
        )}
        {profile.link && href && (
          <div className="pt-1">
            <Button href={href} stretched>
              {profile.link.label}
            </Button>
          </div>
        )}
      </div>
    </Reveal>
  );
}

/** The card colour, solid at the bottom and fading out going up. */
const fade = (color: string, solid: number, clear: number): CSSProperties => ({
  position: 'absolute',
  inset: 0,
  background: `linear-gradient(to top, ${color} 0%, ${color} ${solid}%, transparent ${clear}%)`,
});

/**
 * In the editor, a background just picked has no server colour yet: read
 * it in the browser with the same rule (lib/color.ts).
 */
function usePickedColor(url: string | undefined) {
  const [picked, setPicked] = useState<{ url: string; color: string }>();
  useEffect(() => {
    if (!url) return;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const size = 32;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(image, 0, 0, size, size);
      const rgba = context.getImageData(0, 0, size, size).data;
      const rgb = new Uint8Array(size * size * 3);
      for (let i = 0; i < size * size; i++)
        rgb.set([rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]], i * 3);
      setPicked({
        url,
        color: toHex(cardShade(averageBottom(rgb, size, size))),
      });
    };
    image.src = url;
  }, [url]);
  return picked && picked.url === url ? picked.color : undefined;
}
