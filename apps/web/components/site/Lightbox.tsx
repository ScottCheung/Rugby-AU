'use client';

import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';

type Photo = { url: string; alt: string; caption: string };

/**
 * Opens a full-size view when an element marked `data-lightbox-index` inside
 * it is clicked. The gallery itself stays server-rendered markup; this only
 * adds the overlay. The editor canvas cancels these clicks (preventDefault)
 * so selecting a block never opens the lightbox.
 */
export function Lightbox({
  photos,
  children,
}: {
  photos: Photo[];
  children: ReactNode;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const count = photos.length;
  const go = (step: number) =>
    setIndex((value) =>
      value === null ? null : (value + step + count) % count,
    );

  useEffect(() => {
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIndex(null);
      if (event.key === 'ArrowRight')
        setIndex((value) => (value === null ? null : (value + 1) % count));
      if (event.key === 'ArrowLeft')
        setIndex((value) =>
          value === null ? null : (value - 1 + count) % count,
        );
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [index, count]);

  const open = (event: MouseEvent) => {
    if (event.defaultPrevented) return;
    const target = (event.target as Element).closest('[data-lightbox-index]');
    if (target) setIndex(Number(target.getAttribute('data-lightbox-index')));
  };

  const photo = index === null ? undefined : photos[index];

  return (
    <div onClick={open}>
      {children}
      {photo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={photo.caption}
          onClick={(event) => {
            event.stopPropagation();
            if (event.target === event.currentTarget) setIndex(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgb(0 0 0 / 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '1rem',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={photo.alt}
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: '0.5rem',
            }}
          />
          <p style={{ color: 'white', margin: 0, textAlign: 'center' }}>
            {photo.caption}{' '}
            <span style={{ opacity: 0.6 }}>
              {index! + 1} / {count}
            </span>
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {count > 1 && (
              <LightboxButton label="Previous photo" onClick={() => go(-1)}>
                ←
              </LightboxButton>
            )}
            <LightboxButton label="Close" onClick={() => setIndex(null)}>
              ✕
            </LightboxButton>
            {count > 1 && (
              <LightboxButton label="Next photo" onClick={() => go(1)}>
                →
              </LightboxButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LightboxButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        border: 0,
        background: 'rgb(255 255 255 / 0.9)',
        color: 'black',
        fontSize: 18,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
