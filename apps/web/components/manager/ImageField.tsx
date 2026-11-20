'use client';

import { ImageIcon } from 'lucide-react';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { Button, Dialog } from '@scottcheung/ui/client';
import type { LibraryImage } from '@/lib/media';

/** The images an editor can pick from: those already used on the site. */
const MediaLibraryContext = createContext<LibraryImage[]>([]);

export function MediaLibraryProvider({
  images,
  children,
}: {
  images: LibraryImage[];
  children: ReactNode;
}) {
  return (
    <MediaLibraryContext.Provider value={images}>
      {children}
    </MediaLibraryContext.Provider>
  );
}

/**
 * The extra controls for an { url, alt } field marked `widget: 'image'`:
 * a preview of the current image and a picker of the site's images. The
 * address and description inputs are still drawn by SchemaForm below it.
 */
export function ImagePreviewPicker({
  value,
  onChange,
}: {
  value: Partial<LibraryImage>;
  onChange: (value: LibraryImage) => void;
}) {
  const library = useContext(MediaLibraryContext);
  const [open, setOpen] = useState(false);
  const url = value.url && /^https?:\/\//.test(value.url) ? value.url : '';

  return (
    <div className="flex items-center gap-3">
      <span
        className="grid shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 text-slate-400"
        style={{ width: 96, height: 60 }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <ImageIcon className="size-5" />
        )}
      </span>
      {library.length > 0 && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setOpen(true)}
        >
          {url ? 'Change image' : 'Choose image'}
        </Button>
      )}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Choose an image"
        description="Images already used on this site. You can also paste any https:// address in the field below."
        style={{ width: 'min(48rem, 100%)' }}
      >
        <ul
          className="m-0 grid list-none gap-2 p-0"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))',
          }}
        >
          {library.map((image) => (
            <li key={image.url}>
              <button
                type="button"
                title={image.alt}
                aria-label={image.alt}
                aria-pressed={image.url === value.url}
                onClick={() => {
                  // The description travels with the photo; editors can still change it.
                  onChange({ url: image.url, alt: image.alt });
                  setOpen(false);
                }}
                className={`block w-full overflow-hidden rounded-xl ring-offset-2 transition hover:ring-2 hover:ring-[var(--ui-primary)] ${
                  image.url === value.url
                    ? 'ring-2 ring-[var(--ui-primary)]'
                    : ''
                }`}
                style={{ aspectRatio: '16 / 10' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt=""
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
            </li>
          ))}
        </ul>
      </Dialog>
    </div>
  );
}
