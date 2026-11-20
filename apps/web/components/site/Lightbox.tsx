'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { ease, timing } from '@/lib/motion';

type Photo = { url: string; alt: string; caption: string };

type LightboxContextValue = { group: string; open: (index: number) => void };
const LightboxContext = createContext<LightboxContextValue | null>(null);

/** True in the browser, false while rendering on the server. */
const useInBrowser = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

/** The shared-element name linking a gallery photo to its full-size view. */
const photoId = (group: string, index: number) => `${group}-photo-${index}`;

/**
 * A full-size photo viewer for a gallery. Gallery photos are rendered with
 * <LightboxThumb>; opening one grows it from its place in the gallery into
 * the viewer (a Motion `layoutId` shared between the two), and closing
 * shrinks it back. Switching photos crossfades, so only one photo ever
 * moves across the screen.
 */
export function Lightbox({
  photos,
  children,
}: {
  photos: Photo[];
  children: ReactNode;
}) {
  const group = useId();
  const [index, setIndex] = useState<number | null>(null);
  // The photo that was clicked. It is the only one linked to its gallery
  // spot; after switching, closing fades out instead of flying back.
  const [linked, setLinked] = useState<number | null>(null);
  const count = photos.length;
  // The viewer is portalled to <body>, which only exists in the browser.
  const inBrowser = useInBrowser();

  const open = (next: number) => {
    setIndex(next);
    setLinked(next);
  };
  const close = () => setIndex(null);
  const go = (next: number) => {
    setIndex((next + count) % count);
    setLinked(null);
  };

  useEffect(() => {
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowRight') go(index + 1);
      else if (event.key === 'ArrowLeft') go(index - 1);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  });

  return (
    <LightboxContext.Provider value={{ group, open }}>
      {children}
      {inBrowser &&
        createPortal(
          <AnimatePresence>
            {index !== null && (
              <Viewer
                key="viewer"
                photos={photos}
                index={index}
                layoutId={index === linked ? photoId(group, index) : undefined}
                onClose={close}
                onGo={go}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </LightboxContext.Provider>
  );
}

function Viewer({
  photos,
  index,
  layoutId,
  onClose,
  onGo,
}: {
  photos: Photo[];
  index: number;
  layoutId?: string;
  onClose: () => void;
  onGo: (index: number) => void;
}) {
  const photo = photos[index];
  const strip = useRef<HTMLDivElement>(null);

  // Keep the current thumbnail in view as the photo changes.
  useEffect(() => {
    strip.current
      ?.querySelector<HTMLElement>(`[data-thumb="${index}"]`)
      ?.scrollIntoView({
        inline: 'center',
        block: 'nearest',
        behavior: 'smooth',
      });
  }, [index]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption}
      initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
      animate={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
      exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
      transition={{ duration: timing.backdrop, ease }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '1rem',
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          display: 'grid',
          placeItems: 'center',
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        {/* popLayout: the outgoing photo leaves the layout at once, so the
            two never stack while they crossfade. */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={index}
            src={photo.url}
            alt={photo.alt}
            layoutId={layoutId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // `layout` is the photo growing out of the gallery and back.
            transition={{
              duration: timing.crossfade,
              ease,
              layout: { duration: timing.photo, ease },
            }}
            style={{
              maxWidth: '100%',
              // Leave room for the caption and thumbnail strip below; a
              // percentage would not resolve inside this flexible layout.
              maxHeight: 'calc(100dvh - 11rem)',
              objectFit: 'contain',
              borderRadius: '0.5rem',
            }}
          />
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: timing.backdrop, ease }}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <p style={{ color: 'white', margin: 0, textAlign: 'center' }}>
          {photo.caption}{' '}
          <span style={{ opacity: 0.6 }}>
            {index + 1} / {photos.length}
          </span>
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            maxWidth: '100%',
          }}
        >
          <ViewerButton label="Previous photo" onClick={() => onGo(index - 1)}>
            ←
          </ViewerButton>
          {/* Thumbnails: click one to jump to it. */}
          <div
            ref={strip}
            aria-label="All photos"
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              maxWidth: 'min(70vw, 640px)',
              padding: 4,
              scrollbarWidth: 'none',
            }}
          >
            {photos.map((item, thumb) => (
              <button
                key={thumb}
                type="button"
                aria-current={thumb === index || undefined}
                aria-label={`Show photo ${thumb + 1}: ${item.caption}`}
                data-thumb={thumb}
                onClick={() => onGo(thumb)}
                style={{
                  flex: '0 0 auto',
                  width: 64,
                  height: 44,
                  padding: 0,
                  border: 0,
                  borderRadius: 6,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  outline: thumb === index ? '2px solid white' : 'none',
                  outlineOffset: 2,
                  opacity: thumb === index ? 1 : 0.5,
                  transition: 'opacity 0.2s',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
            ))}
          </div>
          <ViewerButton label="Next photo" onClick={() => onGo(index + 1)}>
            →
          </ViewerButton>
        </div>
      </motion.div>

      <ViewerButton
        label="Close"
        onClick={onClose}
        style={{ position: 'absolute', top: 16, right: 16 }}
      >
        ✕
      </ViewerButton>
    </motion.div>
  );
}

/**
 * A gallery photo that opens the viewer. Shares its `layoutId` with the
 * full-size photo, which is what makes the photo grow out of the gallery.
 * In the editor canvas the click is cancelled (preventDefault), so it only
 * selects the block.
 */
export function LightboxThumb({
  index,
  label,
  children,
}: {
  index: number;
  label: string;
  children: ReactNode;
}) {
  const context = useContext(LightboxContext);
  return (
    <motion.button
      type="button"
      layoutId={context ? photoId(context.group, index) : undefined}
      transition={{ layout: { duration: timing.photo, ease } }}
      data-lightbox-index={index}
      aria-label={label}
      className="zoomable block w-full cursor-zoom-in overflow-hidden"
      onClick={(event) => {
        if (!event.defaultPrevented) context?.open(index);
      }}
    >
      {children}
    </motion.button>
  );
}

function ViewerButton({
  label,
  onClick,
  children,
  style,
}: {
  label: string;
  onClick: () => void;
  children: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        flex: '0 0 auto',
        width: 44,
        height: 44,
        borderRadius: 999,
        border: 0,
        background: 'rgb(255 255 255 / 0.9)',
        color: 'black',
        fontSize: 18,
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
