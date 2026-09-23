"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_THEME, STORAGE_KEY, THEMES, THEME_IDS, isThemeId, type ThemeId } from "@/lib/themes";
import { detectCapabilities, type Capabilities } from "@/lib/capabilities";
import { installPointer } from "@/lib/signals";
import { sound } from "@/lib/audio";
import { prefetchTheme } from "@/lib/prefetch";

export type TransitionPhase = "idle" | "cover" | "swap" | "reveal";

type Ctx = {
  theme: ThemeId;
  /** true once the stored theme has been applied on the client */
  booted: boolean;
  caps: Capabilities | null;
  /** WebGL enabled (capable + user hasn't opted into lite mode) */
  gl: boolean;
  lite: boolean;
  setLite: (v: boolean) => void;
  phase: TransitionPhase;
  target: ThemeId | null;
  requestTheme: (t: ThemeId, origin?: { x: number; y: number }) => void;
  origin: { x: number; y: number };
  /** called by ThemeTransition when the screen is fully covered */
  commitSwap: () => void;
  /** called by ThemeTransition when reveal finished */
  finishTransition: () => void;
  soundOn: boolean;
  toggleSound: () => void;
};

const ThemeCtx = createContext<Ctx | null>(null);

export const useTheme = () => {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error("useTheme outside ThemeProvider");
  return c;
};

function persist(t: ThemeId) {
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch {}
  document.cookie = `${STORAGE_KEY}=${t}; path=/; max-age=31536000; samesite=lax`;
}

/** Remember which section is in view so the new universe opens on the same content. */
function currentSectionId(): string | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
  const mid = window.innerHeight * 0.4;
  let best: string | null = null;
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) best = el.dataset.section || null;
  }
  return best;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [booted, setBooted] = useState(false);
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [lite, setLiteState] = useState(false);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [target, setTarget] = useState<ThemeId | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const originRef = useRef({ x: 0.5, y: 0.5 });
  const anchorRef = useRef<string | null>(null);

  // Boot: read what the inline head script decided, detect GPU capabilities.
  useEffect(() => {
    installPointer();
    const c = detectCapabilities();
    setCaps(c);
    let l = false;
    try {
      l = localStorage.getItem("nk-lite") === "1";
    } catch {}
    setLiteState(l || c.reducedMotion);
    const attr = document.documentElement.dataset.theme;
    const t = isThemeId(attr) ? attr : DEFAULT_THEME;
    prefetchTheme(t).finally(() => {
      setTheme(t);
      sound?.setTheme(t);
      setBooted(true);
    });
    // warm the other universes when the browser is idle
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 2500));
    idle(() => THEME_IDS.forEach((id) => id !== t && prefetchTheme(id)));
  }, []);

  // Keep <html data-theme> in sync (drives CSS universes, cursor, scrollbars…)
  useEffect(() => {
    if (!booted) return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.backgroundColor = THEMES[theme].bg;
  }, [theme, booted]);

  const requestTheme = useCallback(
    (t: ThemeId, origin?: { x: number; y: number }) => {
      if (t === theme || phase !== "idle") return;
      originRef.current = origin ?? { x: 0.5, y: 0.5 };
      anchorRef.current = currentSectionId();
      prefetchTheme(t);
      setTarget(t);
      setPhase("cover");
      sound?.transition(t);
    },
    [theme, phase],
  );

  const commitSwap = useCallback(() => {
    if (!target) return;
    setPhase("swap");
    persist(target);
    // Wait for the new universe to mount, then restore section and reveal.
    let frames = 0;
    const next = target;
    const wait = () => {
      frames++;
      if (frames < 4) return requestAnimationFrame(wait);
      const id = anchorRef.current;
      const el = id ? document.querySelector<HTMLElement>(`[data-section="${id}"]`) : null;
      const lenis = (window as unknown as { __lenis?: { scrollTo: (v: number | HTMLElement, o?: object) => void } }).__lenis;
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        lenis ? lenis.scrollTo(top, { immediate: true, force: true }) : window.scrollTo(0, top);
      } else {
        lenis ? lenis.scrollTo(0, { immediate: true, force: true }) : window.scrollTo(0, 0);
      }
      window.setTimeout(() => setPhase("reveal"), 260);
    };
    // make sure the destination universe's code is loaded before counting frames
    Promise.race([prefetchTheme(next), new Promise((r) => setTimeout(r, 4000))]).then(() => {
      document.documentElement.dataset.theme = next;
      setTheme(next);
      sound?.setTheme(next);
      requestAnimationFrame(wait);
    });
  }, [target]);

  const finishTransition = useCallback(() => {
    setPhase("idle");
    setTarget(null);
  }, []);

  // Keyboard: Alt+1..4 switch universes from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const n = Number(e.code.replace("Digit", ""));
      if (n >= 1 && n <= 4) {
        e.preventDefault();
        requestTheme(THEME_IDS[n - 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestTheme]);

  const toggleSound = useCallback(() => {
    setSoundOn((s) => {
      const n = !s;
      sound?.setEnabled(n);
      return n;
    });
  }, []);

  const setLite = useCallback((v: boolean) => {
    setLiteState(v);
    try {
      localStorage.setItem("nk-lite", v ? "1" : "0");
    } catch {}
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      theme,
      booted,
      caps,
      gl: !!caps?.webgl && !lite,
      lite,
      setLite,
      phase,
      target,
      requestTheme,
      origin: originRef.current,
      commitSwap,
      finishTransition,
      soundOn,
      toggleSound,
    }),
    [theme, booted, caps, lite, setLite, phase, target, requestTheme, commitSwap, finishTransition, soundOn, toggleSound],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
