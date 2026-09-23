"use client";

import { SmoothScroll } from "./SmoothScroll";
import { Cursor } from "./Cursor";
import { Loader } from "./Loader";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { ThemeTransition } from "./ThemeTransition";
import { SceneHost } from "./SceneHost";
import { FpsMeter } from "./FpsMeter";
import { GlassDefs } from "./LiquidGlass";

/** Persistent chrome that survives route changes — so the theme, audio and 3D context persist across navigation. */
export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlassDefs />
      <SceneHost />
      <SmoothScroll />
      <div className="fx-overlay" aria-hidden />
      <main id="main" tabIndex={-1} className="relative z-10">
        {children}
      </main>
      <ThemeSwitcher />
      <Cursor />
      <ThemeTransition />
      <Loader />
      <FpsMeter />
    </>
  );
}
