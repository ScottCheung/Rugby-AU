'use client';

import { useEffect, useState } from 'react';
import { averageBottom, cardShade, toHex } from './color';

/**
 * In the editor, a photo just picked has no server colour yet
 * (lib/imageColor.ts): read it in the browser with the same rule
 * (lib/color.ts). Pass no address to skip it.
 */
export function usePickedColor(url: string | undefined) {
  const [picked, setPicked] = useState<{ url: string; color: string }>();
  useEffect(() => {
    if (!url) return;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const size = 32;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) return;
      try {
        context.drawImage(image, 0, 0, size, size);
        const rgba = context.getImageData(0, 0, size, size).data;
        const rgb = new Uint8Array(size * size * 3);
        for (let i = 0; i < size * size; i++)
          rgb.set([rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]], i * 3);
        setPicked({
          url,
          color: toHex(cardShade(averageBottom(rgb, size, size))),
        });
      } catch {
        // A photo from a server without CORS cannot be read: keep the default.
      }
    };
    image.src = url;
  }, [url]);
  return picked && picked.url === url ? picked.color : undefined;
}
