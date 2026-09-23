"use client";

import { Suspense, useEffect, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, Preload } from "@react-three/drei";
import { useTheme } from "./ThemeProvider";
import { quality } from "@/lib/signals";
import type { ThemeId } from "@/lib/themes";

export type SceneProps = { tier: 0 | 1 | 2; mobile: boolean };

// Each universe's WebGL world is code-split and only downloaded when needed.
const scenes: Record<ThemeId, ComponentType<SceneProps>> = {
  gta: dynamic(() => import("@/themes/gta/Scene"), { ssr: false }),
  illusion: dynamic(() => import("@/themes/illusion/Scene"), { ssr: false }),
  hacker: dynamic(() => import("@/themes/hacker/Scene"), { ssr: false }),
  pro: dynamic(() => import("@/themes/pro/Scene"), { ssr: false }),
};

export function SceneHost() {
  const { theme, gl, caps, booted } = useTheme();
  const [tier, setTier] = useState<0 | 1 | 2>(2);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!caps) return;
    const t = caps.mobile ? 0 : caps.lowPower ? 1 : 2;
    setTier(t);
    quality.tier = t;
  }, [caps]);

  // Pause rendering in background tabs.
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  const Scene = scenes[theme];
  const show = booted && gl;

  return (
    <div className="scene-host" aria-hidden data-theme-scene={theme}>
      <div className="scene-fallback" />
      {show && (
        <Canvas
          key={theme}
          className="scene-canvas"
          frameloop={visible ? "always" : "never"}
          dpr={tier === 2 ? [1, 1.75] : tier === 1 ? [1, 1.25] : [0.75, 1]}
          gl={{ antialias: theme === "pro", powerPreference: "high-performance", alpha: false, stencil: false }}
          shadows={theme === "pro"}
          camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 200 }}
          onCreated={({ gl: r }) => r.setClearColor(0x000000, 1)}
        >
          <PerformanceMonitor
            onIncline={() => {
              setTier((t) => {
                const n = Math.min(2, t + 1) as 0 | 1 | 2;
                quality.tier = n;
                return caps?.mobile ? t : n;
              });
            }}
            onDecline={() => {
              setTier((t) => {
                const n = Math.max(0, t - 1) as 0 | 1 | 2;
                quality.tier = n;
                return n;
              });
            }}
            flipflops={3}
          />
          <AdaptiveDpr pixelated={false} />
          <Suspense fallback={null}>
            <Scene tier={tier} mobile={!!caps?.mobile} />
            <Preload all />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
