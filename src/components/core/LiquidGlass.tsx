"use client";

import { useEffect } from "react";
import { detectCapabilities } from "@/lib/capabilities";

/**
 * LIQUID GLASS — shared material system.
 *
 * Mounts once in the Shell and provides:
 *  · an SVG refraction filter (#lg-refract) used as a backdrop-filter on engines that
 *    support url() filters (Chromium). Other engines get blur + saturation only.
 *  · <html data-glass="refract | blur | flat"> so CSS can pick the right recipe.
 *  · live specular highlights: --gx/--gy follow the finger/pointer over any .lg surface,
 *    and --tilt-x/--tilt-y follow device orientation (Android) so the glass "catches light"
 *    as the phone moves.
 */
/** Every element that renders as liquid glass (on mobile, cards join this list via CSS). */
const GLASS_SURFACES =
  ".lg, .switcher, .gta-card, .gta-trophy, .gta-poster, .ill-stack-card, .ill-portal, .hk-panel, .hk-term, .pro-case, .cs-grid .cs-block, .cs-arch-node";

export function GlassDefs() {
  useEffect(() => {
    const root = document.documentElement;
    const caps = detectCapabilities();
    const hasBackdrop =
      CSS.supports("backdrop-filter", "blur(2px)") || CSS.supports("-webkit-backdrop-filter", "blur(2px)");
    const isChromium = /Chrome\/|CriOS|Edg\//.test(navigator.userAgent) && !/Firefox/.test(navigator.userAgent);
    const refract = hasBackdrop && isChromium && CSS.supports("backdrop-filter", "url(#lg-refract)") && !caps.lowPower;
    root.dataset.glass = !hasBackdrop ? "flat" : refract ? "refract" : "blur";

    // Pointer / touch specular highlight on the surface under the finger.
    let raf = 0;
    let target: HTMLElement | null = null;
    let px = 0,
      py = 0;
    const apply = () => {
      raf = 0;
      if (!target) return;
      const r = target.getBoundingClientRect();
      target.style.setProperty("--gx", `${(((px - r.left) / r.width) * 100).toFixed(1)}%`);
      target.style.setProperty("--gy", `${(((py - r.top) / r.height) * 100).toFixed(1)}%`);
    };
    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.<HTMLElement>(GLASS_SURFACES);
      if (target && target !== el) {
        target.style.removeProperty("--gx");
        target.style.removeProperty("--gy");
      }
      target = el ?? null;
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });

    // Device tilt → light direction (no permission prompt; silently unavailable on iOS).
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      const tx = Math.max(-1, Math.min(1, e.gamma / 35));
      const ty = Math.max(-1, Math.min(1, (e.beta - 45) / 35));
      root.style.setProperty("--tilt-x", `${(tx * 30).toFixed(1)}%`);
      root.style.setProperty("--tilt-y", `${(ty * 30).toFixed(1)}%`);
    };
    if (caps.coarsePointer && !caps.reducedMotion) window.addEventListener("deviceorientation", onTilt, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("deviceorientation", onTilt);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute", width: 0, height: 0 }} focusable="false">
      <defs>
        {/* Soft, low-frequency displacement = the lensing wobble of thick liquid glass */}
        <filter id="lg-refract" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2.5" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale="42" xChannelSelector="R" yChannelSelector="G" result="bent" />
          <feGaussianBlur in="bent" stdDeviation="0.6" />
        </filter>
      </defs>
    </svg>
  );
}
