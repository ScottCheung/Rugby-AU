'use client';

import { useState } from 'react';

/**
 * A site's logo on a white rounded plate, so logos of any colour stay
 * readable on any theme. Logos are hotlinked from their owners, so if one
 * fails to load the site's initials are shown instead of a broken image.
 */
export function SiteLogo({
  src,
  name,
  size = 'md',
}: {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [failed, setFailed] = useState(false);
  const height = { sm: 'h-9', md: 'h-11', lg: 'h-14' }[size];
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
        className={`${height} grid min-w-9 place-items-center rounded-xl bg-white px-2 text-xs font-black text-black/80`}
      >
        {initials}
      </span>
    );
  }
  return (
    <span
      className={`${height} flex shrink-0 items-center rounded-xl bg-white px-2 py-1.5`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="h-full w-auto max-w-32 object-contain"
      />
    </span>
  );
}
