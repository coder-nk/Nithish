"use client";

import { useEffect, useState } from "react";
import { quality } from "@/lib/signals";

/**
 * Lightweight performance monitor. Append ?perf to the URL to show it.
 * Also feeds `quality.fps` for components that want to self-throttle.
 */
export function FpsMeter() {
  const [show, setShow] = useState(false);
  const [txt, setTxt] = useState("");
  useEffect(() => {
    setShow(new URLSearchParams(location.search).has("perf"));
    let frames = 0,
      last = performance.now(),
      raf = 0;
    const loop = (t: number) => {
      frames++;
      if (t - last >= 1000) {
        quality.fps = Math.round((frames * 1000) / (t - last));
        frames = 0;
        last = t;
        const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
        setTxt(`${quality.fps} fps · tier ${quality.tier}${mem ? ` · ${(mem.usedJSHeapSize / 1048576).toFixed(0)}MB` : ""}`);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed left-2 top-2 z-[200] rounded bg-black/80 px-2 py-1 font-mono text-[11px] text-lime-300">{txt}</div>
  );
}
