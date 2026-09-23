"use client";

import { useEffect, useRef, useState } from "react";
import { allSkills } from "@/data/resume";
import { sound } from "@/lib/audio";

type Props = {
  className?: string;
  pillClassName?: string;
  gravity?: { x: number; y: number };
  height?: number;
  hint?: string;
};

/**
 * Rapier 2D physics playground — every skill is a rigid body.
 * Drag & throw them (mouse or touch); hovering pushes them away.
 * The WASM physics engine is only downloaded when the section scrolls into view.
 * Falls back to a static, accessible tag list without JS/WASM or with reduced motion.
 */
export function PhysicsSkills({ className = "", pillClassName = "", gravity = { x: 0, y: 18 }, height = 460, hint }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const pills = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let disposed = false;
    let cleanup = () => {};

    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const RAPIER = (await import("@dimforge/rapier2d-compat")).default;
        await RAPIER.init();
        if (disposed) return;
        const S = 50; // px per metre
        const W = el.clientWidth,
          H = el.clientHeight;
        const world = new RAPIER.World(gravity);
        const wall = (x: number, y: number, hw: number, hh: number) =>
          world.createCollider(RAPIER.ColliderDesc.cuboid(hw / S, hh / S).setTranslation(x / S, y / S));
        wall(W / 2, H + 50, W, 50);
        wall(W / 2, -50 - 400, W, 50);
        wall(-50, H / 2, 50, H * 2);
        wall(W + 50, H / 2, 50, H * 2);

        const box0 = el.getBoundingClientRect();
        const bodies = pills.current.map((p, i) => {
          const w = p!.offsetWidth,
            h = p!.offsetHeight;
          const r = p!.getBoundingClientRect();
          // zero-g: start from the static layout (no overlaps); gravity: rain in from above
          const x = gravity.y > 0 ? 40 + Math.random() * (W - 80) : r.left - box0.left + w / 2;
          const y = gravity.y > 0 ? -60 - i * 26 : r.top - box0.top + h / 2;
          const body = world.createRigidBody(
            RAPIER.RigidBodyDesc.dynamic()
              .setTranslation(x / S, y / S)
              .setRotation(gravity.y === 0 ? 0 : (Math.random() - 0.5) * 0.8)
              .setLinearDamping(gravity.y === 0 ? 0.6 : 0.05)
              .setAngularDamping(gravity.y === 0 ? 0.8 : 0.2),
          );
          world.createCollider(
            RAPIER.ColliderDesc.roundCuboid(Math.max(0.01, w / 2 / S - 0.12), Math.max(0.01, h / 2 / S - 0.12), 0.12)
              .setRestitution(gravity.y === 0 ? 0.9 : 0.35)
              .setFriction(0.6),
            body,
          );
          if (gravity.y === 0) body.setLinvel({ x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 3 }, true);
          return { body, w, h };
        });
        setActive(true);

        // pointer interaction
        let drag: number | null = null;
        const ptr = { x: -9999, y: -9999, px: 0, py: 0 };
        const local = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          return { x: e.clientX - r.left, y: e.clientY - r.top };
        };
        const onDown = (e: PointerEvent) => {
          const t = (e.target as HTMLElement).closest<HTMLElement>("[data-pill]");
          if (!t) return;
          drag = Number(t.dataset.pill);
          el.setPointerCapture(e.pointerId);
          sound?.click();
          e.preventDefault();
        };
        const onMove = (e: PointerEvent) => {
          const l = local(e);
          ptr.px = ptr.x;
          ptr.py = ptr.y;
          ptr.x = l.x;
          ptr.y = l.y;
        };
        const onUp = () => (drag = null);
        const onLeave = () => {
          ptr.x = ptr.y = -9999;
        };
        el.addEventListener("pointerdown", onDown);
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerup", onUp);
        el.addEventListener("pointercancel", onUp);
        el.addEventListener("pointerleave", onLeave);

        let last = performance.now(),
          acc = 0;
        const step = () => {
          const now = performance.now();
          acc = Math.min(acc + (now - last) / 1000, 1 / 15);
          last = now;
          bodies.forEach(({ body }, i) => {
            const t = body.translation();
            const bx = t.x * S,
              by = t.y * S;
            if (drag === i) {
              body.setLinvel({ x: ((ptr.x - bx) / S) * 14, y: ((ptr.y - by) / S) * 14 }, true);
              body.setAngvel(body.angvel() * 0.9, true);
            } else if (drag === null) {
              const dx = bx - ptr.x,
                dy = by - ptr.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < 110 * 110 && d2 > 1) {
                const f = (1 - Math.sqrt(d2) / 110) * 0.35;
                body.applyImpulse({ x: (dx / Math.sqrt(d2)) * f, y: (dy / Math.sqrt(d2)) * f }, true);
              }
            }
            // keep inside if something escapes
            if (by > H + 200 || bx < -200 || bx > W + 200) body.setTranslation({ x: W / 2 / S, y: -2 }, true);
          });
          while (acc >= 1 / 60) {
            world.step();
            acc -= 1 / 60;
          }
          bodies.forEach(({ body, w, h }, i) => {
            const p = pills.current[i];
            if (!p) return;
            const t = body.translation();
            p.style.transform = `translate3d(${t.x * S - w / 2}px, ${t.y * S - h / 2}px, 0) rotate(${body.rotation()}rad)`;
          });
          raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        cleanup = () => {
          el.removeEventListener("pointerdown", onDown);
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerup", onUp);
          el.removeEventListener("pointercancel", onUp);
          el.removeEventListener("pointerleave", onLeave);
          world.free();
        };
      },
      { rootMargin: "100px" },
    );
    io.observe(el);
    return () => {
      disposed = true;
      io.disconnect();
      cancelAnimationFrame(raf);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={box}
      className={`physics-box relative touch-none select-none overflow-hidden ${className}`}
      style={{ height }}
      data-active={active || undefined}
      data-cursor="grab"
      data-cursor-label="DRAG"
      aria-label="Skills playground: drag and throw the skill tags"
    >
      {hint && <div className="pointer-events-none absolute left-4 top-3 z-10 text-xs opacity-60">{hint}</div>}
      <ul className="physics-static flex flex-wrap gap-2 p-4">
        {allSkills.map((s, i) => (
          <li key={s} className="contents">
            <span
              ref={(n) => {
                pills.current[i] = n;
              }}
              data-pill={i}
              className={`physics-pill ${pillClassName}`}
            >
              {s}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
