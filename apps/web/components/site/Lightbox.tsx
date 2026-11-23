'use client';

import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from 'motion/react';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { ease } from '@scottcheung/ui/motion';

type Photo = { url: string; alt: string; caption: string };

type LightboxContextValue = { group: string; open: (index: number) => void };
type Box = { left: number; top: number; width: number; height: number };
/** Where a closing photo lands: its gallery spot, and that card's corners. */
type Landing = Box & { radius: number };
/** What the toolbar and keyboard can ask of the photo on screen. */
type StageApi = { zoomBy: (factor: number) => void; reset: () => void };

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
 * The zoom: a spring, like iOS. It starts with the finger's momentum and
 * settles without a bounce, so it feels physical rather than timed.
 */
const zoomSpring = {
  type: 'spring',
  visualDuration: 0.4,
  bounce: 0.1,
} as const;
/** Snapping back after a gesture: quick, no bounce. */
const snap = { type: 'spring', visualDuration: 0.3, bounce: 0 } as const;
/** Quick fades for the backdrop and for switching photos. */
const fade = { duration: 0.25, ease } as const;

const MAX_ZOOM = 5;
/** Corner radius of the open photo, in screen pixels. */
const RADIUS = 12;
/** How far a photo slides when switching to the next one. */
const SLIDE = 120;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * The range a zoomed photo may be panned along one axis: its edges may not
 * come inside the window. A photo smaller than the window stays centred.
 */
const panLimit = (centre: number, size: number, view: number) =>
  [
    Math.min(0, view - centre - size / 2),
    Math.max(0, size / 2 - centre),
  ] as const;

/** Past the edge, the photo follows the finger at a third of the pace. */
const rubber = (value: number, [min, max]: readonly [number, number]) =>
  value < min
    ? min + (value - min) / 3
    : value > max
      ? max + (value - max) / 3
      : value;

/**
 * A full-size photo viewer for a gallery. Gallery photos are rendered with
 * <LightboxThumb>; opening one grows it from its place in the gallery into
 * the viewer (a Motion `layoutId` shared between the two), and closing
 * shrinks it back. The photo zooms (pinch, wheel, double-tap, toolbar),
 * pans, swipes to the next photo, and drags down to close: the backdrop
 * clears and the controls slide away as it is pulled, and letting go past
 * the threshold flies it back to its gallery spot.
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
  // spot by layoutId; after switching, opening animations are crossfades.
  const [linked, setLinked] = useState<number | null>(null);
  // While closing: where the photo's gallery spot is. The photo flies
  // there itself (a layout animation on the top layer, so nothing in the
  // page clips it), and is removed only once it has landed.
  const [landing, setLanding] = useState<Landing | null>(null);
  // Which way the last switch went: the photos slide that way.
  const [direction, setDirection] = useState(0);
  const [zoom, setZoom] = useState(1);
  // How far the photo has been pulled down to close, 0 to 1. The backdrop
  // and the controls fade with it.
  const progress = useMotionValue(0);
  const stage = useRef<StageApi | null>(null);
  const count = photos.length;
  // The viewer is portalled to <body>, which only exists in the browser.
  const inBrowser = useInBrowser();

  const open = (next: number) => {
    progress.jump(0);
    setDirection(0);
    setZoom(1);
    setIndex(next);
    setLinked(next);
  };
  const close = () => {
    if (index === null || landing) return;
    setDirection(0);
    // Fly back to the gallery spot of the photo on screen, whether or not
    // it was switched to. Only a photo with no spot fades out.
    const spot = document.querySelector<HTMLElement>(
      `[data-lightbox-group="${group}"][data-lightbox-index="${index}"]`,
    );
    if (!spot?.parentElement) {
      setIndex(null);
      return;
    }
    // Measure the card, not the gallery photo: Motion may be transforming
    // the photo itself to match the viewer at this moment.
    const card = spot.parentElement;
    const box = card.getBoundingClientRect();
    setLanding({
      left: box.left,
      top: box.top,
      width: spot.offsetWidth,
      height: spot.offsetHeight,
      radius: parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0,
    });
  };
  const landed = () => {
    if (!landing) return;
    setLanding(null);
    setIndex(null);
  };
  const go = (next: number, towards: number) => {
    if (index === null || landing || count < 2) return;
    setDirection(towards);
    setZoom(1);
    setIndex((next + count) % count);
    setLinked(null);
  };

  useEffect(() => {
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowRight') go(index + 1, 1);
      else if (event.key === 'ArrowLeft') go(index - 1, -1);
      else if (event.key === '+' || event.key === '=')
        stage.current?.zoomBy(1.5);
      else if (event.key === '-') stage.current?.zoomBy(1 / 1.5);
      else if (event.key === '0') stage.current?.reset();
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
          // The photo is its own child here, on a layer between the
          // backdrop and the controls. Keyed by index, so switching slides
          // one photo out and the next in.
          <AnimatePresence custom={direction}>
            {index !== null && (
              <Viewer
                key="viewer"
                photos={photos}
                index={index}
                closing={landing !== null}
                zoom={zoom}
                progress={progress}
                onClose={close}
                onGo={go}
                onZoomBy={(factor) => stage.current?.zoomBy(factor)}
                onZoomReset={() => stage.current?.reset()}
              />
            )}
            {index !== null && (
              <Stage
                key={`photo-${index}`}
                photo={photos[index]}
                layoutId={index === linked ? photoId(group, index) : undefined}
                direction={direction}
                landing={landing}
                zoomed={zoom > 1.01}
                progress={progress}
                canSwipe={count > 1}
                apiRef={stage}
                onZoom={setZoom}
                onClose={close}
                onSwipe={(towards) => go(index + towards, towards)}
                onLanded={landed}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </LightboxContext.Provider>
  );
}

/**
 * The photo on screen, and every gesture on it. All movement is four
 * motion values: `x`/`y` (pan, or the pull while dragging to close),
 * `zoom` (the user's zoom) and `pull` (the shrink while dragging to close).
 */
function Stage({
  photo,
  layoutId,
  direction,
  landing,
  zoomed,
  progress,
  canSwipe,
  apiRef,
  onZoom,
  onClose,
  onSwipe,
  onLanded,
}: {
  photo: Photo;
  /** Set while this photo is linked to its gallery spot. */
  layoutId: string | undefined;
  direction: number;
  landing: Landing | null;
  zoomed: boolean;
  progress: MotionValue<number>;
  canSwipe: boolean;
  apiRef: RefObject<StageApi | null>;
  onZoom: (zoom: number) => void;
  onClose: () => void;
  onSwipe: (towards: number) => void;
  onLanded: () => void;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const present = useIsPresent();
  const active = present && !landing;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const zoom = useMotionValue(1);
  const pull = useMotionValue(1);
  // In screen pixels: divided by the scale below so it looks the same at
  // any zoom.
  const radius = useMotionValue(RADIUS);
  const scale = useTransform(() => zoom.get() * pull.get());
  const borderRadius = useTransform(
    () => radius.get() / (zoom.get() * pull.get()),
  );

  useMotionValueEvent(zoom, 'change', (value) => {
    if (present) onZoom(value);
  });

  /** The photo's untransformed centre and size, and the window's size. */
  const measure = () => {
    const element = ref.current!;
    const box = element.getBoundingClientRect();
    return {
      cx: box.left + box.width / 2 - x.get(),
      cy: box.top + box.height / 2 - y.get(),
      w: element.offsetWidth,
      h: element.offsetHeight,
      vw: window.innerWidth,
      vh: window.innerHeight,
    };
  };
  type Geometry = ReturnType<typeof measure>;
  const limits = (g: Geometry, s: number) => ({
    x: panLimit(g.cx, g.w * s, g.vw),
    y: panLimit(g.cy, g.h * s, g.vh),
  });
  /** Pan so that screen point (px, py) stays put while zooming s0 → s1. */
  const pinned = (
    g: Geometry,
    px: number,
    py: number,
    s0: number,
    s1: number,
    tx: number,
    ty: number,
  ) => ({
    x: px - g.cx - (px - g.cx - tx) * (s1 / s0),
    y: py - g.cy - (py - g.cy - ty) * (s1 / s0),
  });

  const stopAll = () => [x, y, zoom, pull, radius].forEach((v) => v.stop());

  const zoomTo = (target: number, px: number, py: number) => {
    const g = measure();
    const s1 = clamp(target, 1, MAX_ZOOM);
    const at = pinned(g, px, py, zoom.get(), s1, x.get(), y.get());
    const range = limits(g, s1);
    stopAll();
    animate(zoom, s1, snap);
    animate(x, clamp(at.x, ...range.x), snap);
    animate(y, clamp(at.y, ...range.y), snap);
  };
  const reset = () => {
    stopAll();
    animate(zoom, 1, snap);
    animate(x, 0, snap);
    animate(y, 0, snap);
  };
  /** After a drag to close that was let go too early: back into place. */
  const relax = () => {
    animate(x, 0, snap);
    animate(y, 0, snap);
    animate(pull, 1, snap);
    animate(radius, RADIUS, snap);
    animate(progress, 0, snap);
  };

  // Toolbar and keyboard reach the photo on screen through this.
  useEffect(() => {
    if (!active) return;
    const api: StageApi = {
      zoomBy: (factor) =>
        zoomTo(
          zoom.get() * factor,
          window.innerWidth / 2,
          window.innerHeight / 2,
        ),
      reset,
    };
    apiRef.current = api;
    return () => {
      if (apiRef.current === api) apiRef.current = null;
    };
  });

  // Closing: the layout animation carries the photo's box to its gallery
  // spot; these carry the zoom, pan and pull back to rest alongside it.
  useLayoutEffect(() => {
    if (!landing) return;
    stopAll();
    const springs = [
      animate(x, 0, zoomSpring),
      animate(y, 0, zoomSpring),
      animate(zoom, 1, zoomSpring),
      animate(pull, 1, zoomSpring),
      animate(radius, landing.radius, zoomSpring),
    ];
    return () => springs.forEach((spring) => spring.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landing]);

  // Wheel and trackpad pinch zoom around the pointer, anywhere on screen.
  useEffect(() => {
    if (!active) return;
    const zoomAround = (s1: number, px: number, py: number) => {
      const g = measure();
      const next = clamp(s1, 1, MAX_ZOOM);
      const at = pinned(g, px, py, zoom.get(), next, x.get(), y.get());
      const range = limits(g, next);
      stopAll();
      zoom.set(next);
      x.set(clamp(at.x, ...range.x));
      y.set(clamp(at.y, ...range.y));
    };
    const onWheel = (event: WheelEvent) => {
      // Let the thumbnail strip scroll sideways.
      if ((event.target as Element).closest?.('[data-lightbox-strip]')) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : 1);
      // A trackpad pinch arrives as a wheel with ctrlKey and small steps.
      const factor = Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.002));
      zoomAround(zoom.get() * factor, event.clientX, event.clientY);
    };
    // Safari reports trackpad pinches as gesture events instead.
    let gestureStart = 1;
    const onGestureStart = (event: Event) => {
      event.preventDefault();
      gestureStart = zoom.get();
    };
    const onGestureChange = (event: Event) => {
      event.preventDefault();
      const gesture = event as Event & {
        scale: number;
        clientX: number;
        clientY: number;
      };
      zoomAround(
        gestureStart * gesture.scale,
        gesture.clientX,
        gesture.clientY,
      );
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('gesturestart', onGestureStart);
    window.addEventListener('gesturechange', onGestureChange);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('gesturestart', onGestureStart);
      window.removeEventListener('gesturechange', onGestureChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Pointer gestures. One finger: pan when zoomed; otherwise sideways
  // swipes to the next photo and any other drag pulls the photo to close.
  // Two fingers: pinch zoom around their midpoint.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({
    mode: 'idle' as
      'idle' | 'pending' | 'pan' | 'swipe' | 'dismiss' | 'pinch' | 'after',
    startX: 0,
    startY: 0,
    startTime: 0,
    tx: 0,
    ty: 0,
    zoom: 1,
    distance: 1,
    midX: 0,
    midY: 0,
    geometry: null as Geometry | null,
  });
  const lastTap = useRef({ time: 0, x: 0, y: 0 });

  const beginSingle = (point: { x: number; y: number }) => {
    Object.assign(gesture.current, {
      mode: 'pending',
      startX: point.x,
      startY: point.y,
      startTime: performance.now(),
      tx: x.get(),
      ty: y.get(),
      geometry: measure(),
    });
  };
  const beginPinch = () => {
    const [a, b] = [...pointers.current.values()];
    // A pinch interrupts a pull to close.
    if (pull.get() < 1) {
      pull.jump(1);
      radius.jump(RADIUS);
      animate(progress, 0, snap);
      x.jump(0);
      y.jump(0);
    }
    Object.assign(gesture.current, {
      mode: 'pinch',
      distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2,
      zoom: zoom.get(),
      tx: x.get(),
      ty: y.get(),
      geometry: measure(),
    });
  };
  const settleZoom = () => {
    const s = zoom.get();
    if (s <= 1) return reset();
    if (s > MAX_ZOOM)
      return zoomTo(MAX_ZOOM, gesture.current.midX, gesture.current.midY);
    const range = limits(measure(), s);
    animate(x, clamp(x.get(), ...range.x), snap);
    animate(y, clamp(y.get(), ...range.y), snap);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLImageElement>) => {
    if (!active || (event.pointerType === 'mouse' && event.button !== 0))
      return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The pointer is already gone (e.g. lifted mid-dispatch).
    }
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    stopAll();
    if (pointers.current.size === 2) beginPinch();
    else if (pointers.current.size === 1)
      beginSingle({ x: event.clientX, y: event.clientY });
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLImageElement>) => {
    if (!active || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    const state = gesture.current;
    const g = state.geometry;
    if (!g) return;

    if (state.mode === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const raw =
        (state.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / state.distance;
      // Resist past the limits, then spring back on release.
      const s1 =
        raw < 1
          ? 1 - (1 - raw) / 3
          : raw > MAX_ZOOM
            ? MAX_ZOOM + (raw - MAX_ZOOM) / 3
            : raw;
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      // The point under the fingers when the pinch began stays under them.
      x.set(midX - g.cx - (state.midX - g.cx - state.tx) * (s1 / state.zoom));
      y.set(midY - g.cy - (state.midY - g.cy - state.ty) * (s1 / state.zoom));
      zoom.set(s1);
      return;
    }
    if (pointers.current.size !== 1) return;

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (state.mode === 'pending') {
      if (Math.hypot(dx, dy) < 6) return;
      // Nearly unzoomed (a reset still settling) counts as unzoomed.
      if (zoom.get() > 1.05) state.mode = 'pan';
      else if (canSwipe && Math.abs(dx) > Math.abs(dy)) state.mode = 'swipe';
      else state.mode = 'dismiss';
      if (state.mode !== 'pan') zoom.jump(1);
    }
    if (state.mode === 'pan') {
      const range = limits(g, zoom.get());
      x.set(rubber(state.tx + dx, range.x));
      y.set(rubber(state.ty + dy, range.y));
    } else if (state.mode === 'swipe') {
      x.set(dx);
    } else if (state.mode === 'dismiss') {
      const p = clamp(dy / (g.vh * 0.45), 0, 1);
      progress.set(p);
      x.set(dx);
      // Upwards it barely moves: only down closes.
      y.set(dy > 0 ? dy : dy / 4);
      pull.set(1 - 0.35 * p);
      radius.set(RADIUS + 20 * p);
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLImageElement>) => {
    if (!pointers.current.delete(event.pointerId)) return;
    const state = gesture.current;
    if (!active) return;
    if (state.mode === 'pinch') {
      // One finger left the pinch: settle, and ignore the other finger.
      state.mode = pointers.current.size ? 'after' : 'idle';
      return settleZoom();
    }
    if (pointers.current.size) return;
    const mode = state.mode;
    state.mode = 'idle';

    if (mode === 'pending' && event.type === 'pointerup') {
      // A tap. Two in quick succession toggle the zoom.
      const now = performance.now();
      if (now - state.startTime > 300) return;
      const last = lastTap.current;
      if (
        now - last.time < 320 &&
        Math.hypot(event.clientX - last.x, event.clientY - last.y) < 30
      ) {
        lastTap.current.time = 0;
        if (zoom.get() > 1.01) reset();
        else zoomTo(2.5, event.clientX, event.clientY);
      } else {
        lastTap.current = { time: now, x: event.clientX, y: event.clientY };
      }
    } else if (mode === 'pan') {
      // Keep the momentum, and bounce back from the edges.
      const range = limits(measure(), zoom.get());
      const glide = {
        type: 'inertia',
        power: 0.3,
        timeConstant: 280,
        bounceStiffness: 400,
        bounceDamping: 40,
      } as const;
      animate(x, x.get(), {
        ...glide,
        velocity: x.getVelocity(),
        min: range.x[0],
        max: range.x[1],
      });
      animate(y, y.get(), {
        ...glide,
        velocity: y.getVelocity(),
        min: range.y[0],
        max: range.y[1],
      });
    } else if (mode === 'swipe') {
      const dx = x.get();
      const vx = x.getVelocity();
      if (
        Math.abs(dx) > 90 ||
        (Math.abs(vx) > 500 && Math.sign(vx) === Math.sign(dx))
      )
        onSwipe(dx < 0 ? 1 : -1);
      else animate(x, 0, snap);
    } else if (mode === 'dismiss') {
      const dy = y.get();
      if (dy > 110 || (y.getVelocity() > 700 && dy > 24)) onClose();
      else relax();
    }
  };

  return (
    <motion.img
      ref={ref}
      src={photo.url}
      alt={photo.alt}
      draggable={false}
      className="lightbox-photo"
      // Opening: grows out of its gallery spot (shared layoutId).
      layoutId={layoutId}
      // One photo moving, never two crossfading copies.
      layoutCrossfade={false}
      // Closing: `layout` animates the move to `landing` below.
      layout
      onLayoutAnimationComplete={onLanded}
      // Linked: fully visible from the moment it leaves the gallery.
      // Switched to: slides in from the side it came from.
      initial={layoutId ? { opacity: 1 } : { opacity: 0, x: direction * SLIDE }}
      animate={{ opacity: 1, x: 0 }}
      variants={{
        // Custom: the direction of the switch that removed this photo.
        out: (towards: number) =>
          landing
            ? // Landed exactly on its spot: it can go at once.
              { opacity: 0, transition: { duration: 0 } }
            : { opacity: 0, x: x.get() - towards * SLIDE },
      }}
      exit="out"
      transition={{ opacity: fade, x: zoomSpring, layout: zoomSpring }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        x,
        y,
        scale,
        borderRadius,
        cursor: zoomed ? 'grab' : 'zoom-in',
        ...(landing && {
          // Closing: the photo's box becomes its gallery spot.
          left: landing.left,
          top: landing.top,
          width: landing.width,
          height: landing.height,
          right: 'auto',
          bottom: 'auto',
          margin: 0,
          maxWidth: 'none',
          maxHeight: 'none',
          objectFit: 'cover',
        }),
      }}
    />
  );
}

/** The backdrop and the controls around the photo. */
function Viewer({
  photos,
  index,
  closing,
  zoom,
  progress,
  onClose,
  onGo,
  onZoomBy,
  onZoomReset,
}: {
  photos: Photo[];
  index: number;
  /** The photo is flying back: fade out alongside it. */
  closing: boolean;
  zoom: number;
  progress: MotionValue<number>;
  onClose: () => void;
  onGo: (index: number, towards: number) => void;
  onZoomBy: (factor: number) => void;
  onZoomReset: () => void;
}) {
  const photo = photos[index];
  const count = photos.length;
  const zoomed = zoom > 1.01;
  const strip = useRef<HTMLDivElement>(null);
  // Pulling the photo down clears the backdrop and moves the controls away.
  const backdrop = useTransform(progress, [0, 1], [1, 0]);
  const controls = useTransform(progress, [0, 0.3], [1, 0]);
  const topY = useTransform(progress, [0, 0.3], [0, -24]);
  const bottomY = useTransform(progress, [0, 0.3], [0, 32]);
  const [fullscreen, setFullscreen] = useState(false);
  const canFullscreen = document.fullscreenEnabled;

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

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

  const shown = { opacity: closing ? 0 : 1 };

  return (
    <>
      <motion.div
        className="lightbox-backdrop"
        initial={{ opacity: 0 }}
        animate={shown}
        exit={{ opacity: 0 }}
        transition={fade}
        onClick={onClose}
      >
        <motion.div
          className="lightbox-backdrop__fill"
          style={{ opacity: backdrop }}
        />
      </motion.div>

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={photo.caption || photo.alt || 'Photo viewer'}
        className="lightbox-chrome"
        initial={{ opacity: 0 }}
        animate={shown}
        exit={{ opacity: 0 }}
        transition={fade}
      >
        <motion.div
          className="lightbox-top"
          style={{ opacity: controls, y: topY }}
        >
          <span className="lightbox-pill">
            {index + 1} / {count}
          </span>
          <div className="lightbox-toolbar">
            <ViewerButton
              label="Zoom out"
              disabled={!zoomed}
              onClick={() => onZoomBy(1 / 1.5)}
            >
              <ZoomOut size={18} />
            </ViewerButton>
            <button
              type="button"
              className="lightbox-zoom"
              aria-label="Reset zoom"
              onClick={onZoomReset}
            >
              {Math.round(zoom * 100)}%
            </button>
            <ViewerButton
              label="Zoom in"
              disabled={zoom >= MAX_ZOOM - 0.01}
              onClick={() => onZoomBy(1.5)}
            >
              <ZoomIn size={18} />
            </ViewerButton>
            <span className="lightbox-divider" aria-hidden />
            <a
              className="lightbox-btn"
              href={photo.url}
              download
              target="_blank"
              rel="noreferrer"
              aria-label="Download photo"
              title="Download photo"
            >
              <Download size={18} />
            </a>
            {canFullscreen && (
              <ViewerButton
                label={fullscreen ? 'Exit full screen' : 'Full screen'}
                onClick={() =>
                  fullscreen
                    ? document.exitFullscreen()
                    : document.documentElement.requestFullscreen()
                }
              >
                {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </ViewerButton>
            )}
            <ViewerButton label="Close" onClick={onClose}>
              <X size={20} />
            </ViewerButton>
          </div>
        </motion.div>

        {count > 1 && (
          <motion.div className="lightbox-arrows" style={{ opacity: controls }}>
            <ViewerButton
              label="Previous photo"
              className="lightbox-arrow"
              onClick={() => onGo(index - 1, -1)}
            >
              <ChevronLeft size={24} />
            </ViewerButton>
            <ViewerButton
              label="Next photo"
              className="lightbox-arrow"
              onClick={() => onGo(index + 1, 1)}
            >
              <ChevronRight size={24} />
            </ViewerButton>
          </motion.div>
        )}

        {/* Out of the way while zoomed in. */}
        <motion.div
          className="lightbox-bottom"
          animate={{ opacity: zoomed ? 0 : 1, y: zoomed ? 16 : 0 }}
          transition={fade}
          style={{ pointerEvents: zoomed ? 'none' : undefined }}
        >
          <motion.div
            className="lightbox-bottom__inner"
            style={{ opacity: controls, y: bottomY }}
          >
            {photo.caption && (
              <p className="lightbox-caption">{photo.caption}</p>
            )}
            {count > 1 && (
              <div
                ref={strip}
                className="lightbox-strip"
                aria-label="All photos"
                data-lightbox-strip
              >
                {photos.map((item, thumb) => (
                  <button
                    key={thumb}
                    type="button"
                    className="lightbox-thumb"
                    aria-current={thumb === index || undefined}
                    aria-label={`Show photo ${thumb + 1}${item.caption ? `: ${item.caption}` : ''}`}
                    data-thumb={thumb}
                    onClick={() => onGo(thumb, Math.sign(thumb - index))}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt="" draggable={false} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </>
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
      layoutCrossfade={false}
      data-lightbox-group={context?.group}
      transition={{ layout: zoomSpring }}
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
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`lightbox-btn${className ? ` ${className}` : ''}`}
    >
      {children}
    </button>
  );
}
