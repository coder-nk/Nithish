"use client";

import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { gsap } from "gsap";
import { MobileMenu } from "./MobileMenu";
import { useTheme } from "./ThemeProvider";
import { THEMES, THEME_IDS, type ThemeId } from "@/lib/themes";
import { sound } from "@/lib/audio";

/** Persistent universe switcher — a radiogroup with full keyboard support. */
export function ThemeSwitcher() {
  const { theme, target, requestTheme, phase, soundOn, toggleSound, lite, setLite, caps } = useTheme();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const lens = useRef<HTMLSpanElement>(null);
  const lensAt = useRef<number | null>(null);

  // Liquid lens: a glass droplet that slides to the active universe, stretching in flight
  const dest = target ?? theme;
  useLayoutEffect(() => {
    const place = (animate: boolean) => {
      const i = THEME_IDS.indexOf(dest);
      const b = refs.current[i];
      const l = lens.current;
      if (!b || !l) return;
      const x = b.offsetLeft,
        w = b.offsetWidth;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!animate || reduced || lensAt.current === null) {
        gsap.set(l, { x, width: w, scaleX: 1, scaleY: 1 });
      } else {
        const dist = Math.abs(x - lensAt.current);
        gsap
          .timeline()
          .to(l, { x, width: w, duration: 0.6, ease: "elastic.out(1, 0.6)" }, 0)
          .to(l, { scaleX: 1 + Math.min(0.5, dist / 300), scaleY: 0.82, duration: 0.18, ease: "power2.out" }, 0)
          .to(l, { scaleX: 1, scaleY: 1, duration: 0.5, ease: "elastic.out(1.2, 0.4)" }, 0.18);
      }
      lensAt.current = x;
    };
    place(true);
    const onResize = () => place(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [dest]);

  const pick = (id: ThemeId, el?: HTMLElement | null) => {
    sound?.click();
    const r = el?.getBoundingClientRect();
    requestTheme(
      id,
      r ? { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight } : undefined,
    );
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = THEME_IDS.indexOf(theme);
    let n = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % 4;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i + 3) % 4;
    if (n >= 0) {
      e.preventDefault();
      refs.current[n]?.focus();
      pick(THEME_IDS[n], refs.current[n]);
    }
  };

  return (
    <nav className="switcher lg lg-refract" aria-label="Visual theme">
      <div className="switcher-label" aria-hidden>
        Universe
      </div>
      <MobileMenu />
      <div role="radiogroup" aria-label="Choose theme" className="switcher-group" onKeyDown={onKey}>
        <span ref={lens} className="switcher-lens" aria-hidden />
        {THEME_IDS.map((id, i) => {
          const m = THEMES[id];
          const active = id === theme;
          return (
            <button
              key={id}
              ref={(n) => {
                refs.current[i] = n;
              }}
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              disabled={phase !== "idle"}
              data-active={active || undefined}
              data-id={id}
              className="switcher-item"
              title={`${m.label} — ${m.hint} (Alt+${m.key})`}
              onClick={(e) => pick(id, e.currentTarget)}
              onPointerEnter={() => sound?.hover()}
            >
              <span className="switcher-swatch" aria-hidden>
                {m.swatch.map((c) => (
                  <i key={c} style={{ background: c }} />
                ))}
              </span>
              <span className="switcher-name">{m.label}</span>
            </button>
          );
        })}
      </div>
      <div className="switcher-tools">
        <button
          className="switcher-tool"
          aria-pressed={soundOn}
          aria-label={soundOn ? "Mute sound" : "Enable ambient sound"}
          title={soundOn ? "Sound on" : "Sound off"}
          onClick={toggleSound}
        >
          <span className="eq" data-on={soundOn || undefined} aria-hidden>
            <i />
            <i />
            <i />
            <i />
          </span>
        </button>
        {caps?.webgl && (
          <button
            className="switcher-tool"
            aria-pressed={!lite}
            aria-label={lite ? "Enable 3D effects" : "Switch to lite mode (disable 3D)"}
            title={lite ? "3D off" : "3D on"}
            onClick={() => setLite(!lite)}
          >
            <span className="text-[10px] font-bold tracking-wider">{lite ? "2D" : "3D"}</span>
          </button>
        )}
      </div>
    </nav>
  );
}
