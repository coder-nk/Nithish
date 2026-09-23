// Frame-rate signals shared between DOM, GSAP and WebGL without React re-renders.
// Written by SmoothScroll / pointer listeners, read inside useFrame / rAF loops.

export const pointer = {
  x: 0, // normalised -1..1
  y: 0,
  px: 0, // pixels
  py: 0,
  vx: 0, // velocity px/frame (smoothed)
  vy: 0,
  down: false,
};

export const scroll = {
  y: 0,
  progress: 0, // 0..1 whole page
  velocity: 0, // lenis velocity
  direction: 1 as 1 | -1,
};

export const quality = {
  /** 0 = minimal, 1 = medium, 2 = high. Adjusted by PerformanceMonitor. */
  tier: 2 as 0 | 1 | 2,
  fps: 60,
};

let installed = false;
export function installPointer() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  let lx = 0,
    ly = 0;
  const onMove = (e: PointerEvent) => {
    pointer.px = e.clientX;
    pointer.py = e.clientY;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", () => (pointer.down = true));
  window.addEventListener("pointerup", () => (pointer.down = false));
  const tick = () => {
    pointer.vx += (pointer.px - lx - pointer.vx) * 0.25;
    pointer.vy += (pointer.py - ly - pointer.vy) * 0.25;
    lx = pointer.px;
    ly = pointer.py;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Run fn once the loader has finished (or now, if it already has). Returns an unsubscribe. */
export function whenLoaded(fn: () => void) {
  if (typeof document === "undefined") return () => {};
  if (!document.documentElement.dataset.booting) {
    fn();
    return () => {};
  }
  const h = () => fn();
  window.addEventListener("nk:loaded", h, { once: true });
  return () => window.removeEventListener("nk:loaded", h);
}
