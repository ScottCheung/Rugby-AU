'use client';

import type { CSSProperties } from 'react';
import { Button } from '@/components/primitives/Button';
import { Heading } from '@/components/primitives/Heading';
import { usePickedColor } from '@/lib/usePickedColor';
import { resolveHref } from '@/lib/links';

type Image = { url: string; alt: string };
type Profile = {
  name: string;
  role?: string;
  text?: string;
  cutout?: Image;
  background?: Image;
  link?: { label: string; href: string };
};

/**
 * One person. The background photo and the cut-out share one frame, so the
 * person stands exactly where they were in the photo; the photo is only
 * shown below the card's top edge, so the head rises out of it. The card's
 * colour (picked from the bottom of the photo) fades up over both and
 * carries the text. Styles in app/styles/site/cards.css (.profile-card).
 */
export function ProfileCard({
  profile,
  color,
  backgroundHeight = 70,
  siteSlug,
}: {
  profile: Profile;
  /** From the server (lib/imageColor.ts); worked out here if missing. */
  color?: string;
  /** Percent of the card's height the background takes, from the bottom. */
  backgroundHeight?: number;
  siteSlug: string;
}) {
  const picked = usePickedColor(
    color || !profile.background ? undefined : profile.background.url,
  );
  const shade = color ?? picked ?? '#1f2937';
  const href = profile.link && resolveHref(profile.link.href, siteSlug);
  const { cutout, background } = profile;
  const photo = cutout && background;
  const details = (
    <div className="profile-card__text">
      {/* The role line keeps its space when empty, so names line up across
          a row of cards. */}
      <p
        className="profile-card__line m-0 text-xs font-semibold tracking-wide uppercase opacity-80"
        aria-hidden={!profile.role || undefined}
      >
        {profile.role}
      </p>
      <Heading level={4}>{profile.name}</Heading>
      {profile.text && (
        <p className="m-0 max-w-[90%] text-left text-sm leading-relaxed text-pretty opacity-85">
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
  );

  return (
    <article
      className={`profile-card ${photo ? '' : 'profile-card--plain'} ${href ? 'card-link' : ''}`}
      style={{ '--headroom': `${100 - backgroundHeight}%` } as CSSProperties}
    >
      {cutout && background ? (
        <>
          <div className="profile-card__panel" style={{ background: shade }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={background.url} alt="" loading="lazy" />
            <div style={fade(shade, 20, 58)} />
          </div>
          <div className="profile-card__figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="profile-card__person"
              src={cutout.url}
              alt={cutout.alt}
              loading="lazy"
            />
          </div>
          <div className="profile-card__front">
            <div style={fade(shade, 14, 38)} />
          </div>
        </>
      ) : (
        // No photo: a silhouette and initials in the site's own colours.
        <div className="profile-card__panel" aria-hidden>
          <span className="profile-card__initials site-heading">
            {initials(profile.name)}
          </span>
          <svg viewBox="0 0 100 100" className="profile-card__silhouette">
            <circle cx="50" cy="36" r="17" />
            <path d="M14 100c2-24 17-37 36-37s34 13 36 37z" />
          </svg>
        </div>
      )}
      {details}
    </article>
  );
}

/** "Joseph-Aukuso Suaalii" -> "JS": first and last name. */
function initials(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** The card colour, solid at the bottom and fading out going up. */
const fade = (color: string, solid: number, clear: number): CSSProperties => ({
  position: 'absolute',
  inset: 0,
  background: `linear-gradient(to top, ${color} 0%, ${color} ${solid}%, transparent ${clear}%)`,
});
