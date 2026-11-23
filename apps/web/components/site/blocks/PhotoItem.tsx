import { Image } from '@/components/primitives/Image';
import { resolveHref } from '@/lib/links';
import { LightboxThumb } from '../Lightbox';
import type { ItemProps } from './types';

const captionAligns = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

/**
 * A photo at its own shape, with a caption. Without a link it opens full
 * size (PhotosFrame puts the viewer around the block).
 */
export function PhotoItem({
  item,
  style,
  index,
  siteSlug,
}: ItemProps<'photos'>) {
  const image = item.image ?? { url: '', alt: '' };
  const href = item.link && resolveHref(item.link.href, siteSlug);
  const photo = <Image src={image.url} alt={image.alt} fit="natural" />;
  return (
    <figure className="m-0 flex flex-col gap-site-xs">
      <div className="overflow-hidden rounded-[var(--radius-card)] bg-surface-light">
        {href ? (
          <a href={href} className="zoomable block">
            {photo}
          </a>
        ) : (
          <LightboxThumb index={index} label={`View photo: ${item.title}`}>
            {photo}
          </LightboxThumb>
        )}
      </div>
      {style.caption && item.title && (
        <figcaption
          className={`text-sm opacity-75 ${captionAligns[style.captionAlign ?? 'left']}`}
        >
          {item.title}
        </figcaption>
      )}
    </figure>
  );
}
