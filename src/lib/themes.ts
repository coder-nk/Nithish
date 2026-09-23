export type ThemeId = "gta" | "illusion" | "hacker" | "pro";

export const THEME_IDS: ThemeId[] = ["gta", "illusion", "hacker", "pro"];
export const DEFAULT_THEME: ThemeId = "pro";
export const STORAGE_KEY = "nk-theme";

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  hint: string;
  key: string; // keyboard shortcut
  swatch: [string, string, string];
  /** Lenis tuning — each universe has its own scroll physics */
  scroll: { lerp: number; wheelMultiplier: number; smooth: boolean };
  /** Background colour painted before WebGL is ready */
  bg: string;
};

export const THEMES: Record<ThemeId, ThemeMeta> = {
  gta: {
    id: "gta",
    label: "GTA",
    hint: "Neon Vice nights",
    key: "1",
    swatch: ["#ff2e88", "#ff9a3c", "#00e5ff"],
    scroll: { lerp: 0.14, wheelMultiplier: 1.25, smooth: true },
    bg: "#140526",
  },
  illusion: {
    id: "illusion",
    label: "ILLUSION",
    hint: "Reality, bent",
    key: "2",
    swatch: ["#7c5cff", "#ff5ca8", "#00d4c7"],
    scroll: { lerp: 0.045, wheelMultiplier: 0.8, smooth: true },
    bg: "#07060d",
  },
  hacker: {
    id: "hacker",
    label: "HACKER",
    hint: "root@nk:~#",
    key: "3",
    swatch: ["#00ff9c", "#0a1a12", "#ff3b3b"],
    scroll: { lerp: 0.35, wheelMultiplier: 1, smooth: true },
    bg: "#020604",
  },
  pro: {
    id: "pro",
    label: "PROFESSIONAL",
    hint: "Executive brief",
    key: "4",
    swatch: ["#f5f3ee", "#1f3a5f", "#b08d57"],
    scroll: { lerp: 0.085, wheelMultiplier: 1, smooth: true },
    bg: "#f5f3ee",
  },
};

export const isThemeId = (v: unknown): v is ThemeId =>
  typeof v === "string" && (THEME_IDS as string[]).includes(v);

/**
 * Runs before React hydrates (inlined in <head>) so the correct universe
 * paints on the very first frame — no flash of the wrong theme.
 */
export const themeBootScript = `(function(){try{var k='${STORAGE_KEY}',v=null;try{v=localStorage.getItem(k)}catch(e){}if(!v){var m=document.cookie.match(/(?:^|; )${STORAGE_KEY}=([^;]+)/);if(m)v=m[1]}var ok=${JSON.stringify(
  THEME_IDS,
)};if(ok.indexOf(v)<0)v='${DEFAULT_THEME}';var d=document.documentElement;d.dataset.theme=v;d.dataset.booting='1';var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;if(rm)d.dataset.motion='reduced';if(window.matchMedia&&matchMedia('(pointer: coarse)').matches)d.dataset.pointer='coarse';}catch(e){}})();`;
