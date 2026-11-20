'use client';

import { useState } from 'react';

const sizes = {
  sm: { height: 36, maxWidth: 110 },
  md: { height: 44, maxWidth: 140 },
  lg: { height: 64, maxWidth: 200 },
} as const;

/**
 * A site's logo on a white rounded plate, so logos of any colour stay
 * readable on any theme. Logos are hotlinked from their owners, so if one
 * fails to load the site's initials are shown instead of a broken image.
 *
 * Sizes are inline styles on purpose: a logo must never render at its
 * natural size, even if a stylesheet is late or stale.
 */
export function SiteLogo({
  src,
  name,
  size = 'md',
}: {
  src?: string;
  name: string;
  size?: keyof typeof sizes;
}) {
  const [failed, setFailed] = useState(false);
  const { height, maxWidth } = sizes[size];
  const initials = name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  if (!src || failed) {
    return (
      <span
        aria-hidden
        style={{ height, minWidth: height }}
        className="grid shrink-0 place-items-center rounded-xl bg-white px-2 text-xs font-black text-black/80"
      >
        {initials}
      </span>
    );
  }
  return (
    <span
      style={{ height, padding: Math.round(height / 8) }}
      className="flex shrink-0 items-center rounded-xl bg-white"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        style={{
          display: 'block',
          height: '100%',
          width: 'auto',
          maxWidth,
          objectFit: 'contain',
        }}
      />
    </span>
  );
}
