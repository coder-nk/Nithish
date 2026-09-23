"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "./ThemeProvider";
import { THEMES } from "@/lib/themes";
import { scroll } from "@/lib/signals";

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis smooth scrolling, re-tuned per universe:
 *  GTA → punchy & fast · Illusion → floaty & heavy · Hacker → near-raw · Pro → elegant.
 * Scroll velocity is published to CSS (--scroll-vel) and to WebGL via signals.
 */
export function SmoothScroll() {
  const { theme, booted, caps } = useTheme();
  const pathname = usePathname();

  // Route change: reset scroll and re-measure triggers.
  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    if (!location.hash) lenis ? lenis.scrollTo(0, { immediate: true, force: true }) : window.scrollTo(0, 0);
    else {
      const el = document.getElementById(location.hash.slice(1));
      if (el) setTimeout(() => (lenis ? lenis.scrollTo(el, { immediate: true, force: true }) : el.scrollIntoView()), 60);
    }
    const id = setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    if (!booted) return;
    const root = document.documentElement;
    const reduced = caps?.reducedMotion;
    const cfg = THEMES[theme].scroll;
    let lenis: Lenis | null = null;

    const publish = (y: number, vel: number) => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scroll.y = y;
      scroll.progress = Math.min(1, Math.max(0, y / max));
      scroll.velocity = vel;
      scroll.direction = vel >= 0 ? 1 : -1;
      root.style.setProperty("--scroll-vel", String(Math.max(-60, Math.min(60, vel)).toFixed(2)));
      root.style.setProperty("--scroll-progress", scroll.progress.toFixed(4));
    };

    if (!reduced) {
      lenis = new Lenis({
        lerp: cfg.lerp,
        wheelMultiplier: cfg.wheelMultiplier,
        smoothWheel: cfg.smooth,
        syncTouch: false,
      });
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
      lenis.on("scroll", (l: Lenis) => {
        publish(l.scroll, l.velocity);
        ScrollTrigger.update();
      });
      const raf = (time: number) => lenis!.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      // decay velocity to zero when idle
      const decay = () => {
        if (lenis && Math.abs(lenis.velocity) < 0.01) publish(lenis.scroll, 0);
      };
      gsap.ticker.add(decay);
      return () => {
        gsap.ticker.remove(raf);
        gsap.ticker.remove(decay);
        lenis?.destroy();
        (window as unknown as { __lenis?: Lenis }).__lenis = undefined;
      };
    } else {
      const onScroll = () => publish(window.scrollY, 0);
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }
  }, [theme, booted, caps]);

  // Anchor links go through Lenis
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
      if (lenis) lenis.scrollTo(el, { offset: -20, duration: 1.4 });
      else el.scrollIntoView({ behavior: "smooth" });
      el.focus?.({ preventScroll: true });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
