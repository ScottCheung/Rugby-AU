/**
 * Editors paste image addresses from any host, so this is a plain <img>
 * rather than next/image (which needs every remote host allow-listed).
 * With no address yet (while editing) it shows an empty placeholder.
 */
export function Image({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  if (!src)
    return (
      <div
        className={`h-full w-full bg-surface-light ${className}`}
        aria-hidden
      />
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`block h-full w-full object-cover ${className}`}
    />
  );
}
