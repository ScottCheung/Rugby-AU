/**
 * Editors paste images from anywhere, so we use a plain <img> rather than
 * next/image (which needs every remote host allow-listed up front).
 */
export function Image({ src, alt }: { src: string; alt: string }) {
  if (!src)
    return <div className="block-image block-image-empty" aria-hidden />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="block-image" src={src} alt={alt} loading="lazy" />
  );
}
