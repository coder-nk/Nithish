"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useTheme } from "./ThemeProvider";
import { pointer } from "@/lib/signals";

/**
 * One cursor engine, four personalities (styled in globals.css via [data-theme]):
 *  GTA      → neon crosshair ring with trailing glow
 *  Illusion → difference-blend liquid blob that stretches with velocity
 *  Hacker   → block caret + live XY readout
 *  Pro      → refined dot + lagging ring
 */
export function Cursor() {
  const { theme, caps } = useTheme();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const coords = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!caps || caps.coarsePointer) return;
    document.documentElement.classList.add("has-cursor");
    const d = dot.current!,
      r = ring.current!;
    const lag = { gta: 0.18, illusion: 0.55, hacker: 0.05, pro: 0.35 }[theme];
    const dx = gsap.quickTo(d, "x", { duration: 0.05, ease: "none" });
    const dy = gsap.quickTo(d, "y", { duration: 0.05, ease: "none" });
    const rx = gsap.quickTo(r, "x", { duration: lag, ease: "power3.out" });
    const ry = gsap.quickTo(r, "y", { duration: lag, ease: "power3.out" });

    let shown = false;
    gsap.set([d, r], { opacity: 0 });
    const move = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.set([d, r], { x: e.clientX, y: e.clientY });
        gsap.to([d, r], { opacity: 1, duration: 0.3 });
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      if (coords.current && theme === "hacker")
        coords.current.textContent = `${String(Math.round(e.clientX)).padStart(4, "0")}:${String(Math.round(e.clientY)).padStart(4, "0")}`;
    };

    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("a,button,[data-cursor],input,textarea,[role=radio]");
      r.dataset.state = t ? (t.dataset.cursor || (t.matches("input,textarea") ? "text" : "hover")) : "";
      if (label.current) label.current.textContent = t?.dataset.cursorLabel || "";
    };
    const down = () => r.classList.add("is-down");
    const up = () => r.classList.remove("is-down");
    const leave = () => gsap.to([d, r], { opacity: 0, duration: 0.2 });
    const enter = () => shown && gsap.to([d, r], { opacity: 1, duration: 0.2 });

    // velocity-reactive stretch (strongest in Illusion)
    const stretch = () => {
      const v = Math.hypot(pointer.vx, pointer.vy);
      const ang = (Math.atan2(pointer.vy, pointer.vx) * 180) / Math.PI;
      const k = theme === "illusion" ? 0.02 : theme === "gta" ? 0.008 : 0;
      const s = Math.min(1.8, 1 + v * k);
      if (k) gsap.set(r, { rotate: ang, scaleX: s, scaleY: 1 / Math.sqrt(s) });
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.addEventListener("pointerleave", leave);
    document.addEventListener("pointerenter", enter);
    gsap.ticker.add(stretch);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("pointerenter", enter);
      gsap.ticker.remove(stretch);
      gsap.set(r, { rotate: 0, scaleX: 1, scaleY: 1 });
    };
  }, [theme, caps]);

  if (caps?.coarsePointer) return null;
  return (
    <div aria-hidden className="cursor-root">
      <div ref={ring} className="cursor-ring">
        <span ref={label} className="cursor-label" />
        <span ref={coords} className="cursor-coords" />
      </div>
      <div ref={dot} className="cursor-dot" />
    </div>
  );
}
