/**
 * Editors paste image addresses from any host, so this is a plain <img>
 * rather than next/image (which needs every remote host allow-listed).
 * `fit="cover"` fills its box (cards, slides); `fit="natural"` keeps the
 * photo's own proportions (masonry). With no address yet it shows a placeholder.
 */
export function Image({
  src,
  alt,
  fit = 'cover',
  eager = false,
  className = '',
}: {
  src: string;
  alt: string;
  fit?: 'cover' | 'natural';
  /** Load straight away (for the first, largest image on a page). */
  eager?: boolean;
  className?: string;
}) {
  const size = fit === 'cover' ? 'h-full w-full object-cover' : 'h-auto w-full';
  if (!src)
    return (
      <div
        className={`media-card w-full bg-surface-light ${className}`}
        aria-hidden
      />
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      className={`block ${size} ${className}`}
    />
  );
}
