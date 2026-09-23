"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useTheme } from "./ThemeProvider";
import { profile } from "@/data/resume";

const bootLines = [
  "[    0.000000] nk-kernel 6.9.0-portfolio #1 SMP PREEMPT",
  "[    0.013370] Mounting /home/nithish ................ [ OK ]",
  "[    0.042000] Starting postgresql@16-main (patroni) .. [ OK ]",
  "[    0.077777] etcd cluster quorum 3/3 ................ [ OK ]",
  "[    0.099900] keepalived VRRP: MASTER state .......... [ OK ]",
  "[    0.120000] Loading OWASP ruleset .................. [ OK ]",
  "[    0.160000] Rendering interface ....................",
];

/**
 * First-load experience. Server-rendered with all four variants;
 * CSS reveals only the one matching <html data-theme> so the correct
 * universe loads even before JavaScript runs.
 */
export function Loader() {
  const { booted, caps } = useTheme();
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const count = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    if (!booted) return;
    let repeat = false;
    try {
      repeat = sessionStorage.getItem("nk-loaded") === "1";
      sessionStorage.setItem("nk-loaded", "1");
    } catch {}
    const min = caps?.reducedMotion ? 300 : repeat ? 900 : 2200;
    const el = root.current!;
    const state = { p: 0 };
    const fontsReady = (document as Document & { fonts?: FontFaceSet }).fonts?.ready ?? Promise.resolve();
    const loaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((r) => window.addEventListener("load", () => r(), { once: true }));

    const tw = gsap.to(state, {
      p: 0.85,
      duration: min / 1000,
      ease: "power2.out",
      onUpdate: () => {
        el.style.setProperty("--load", state.p.toFixed(3));
        const v = String(Math.round(state.p * 100)).padStart(3, "0");
        count.current.forEach((c) => c && (c.textContent = v));
      },
    });
    let cancelled = false;
    Promise.all([fontsReady, loaded, new Promise((r) => setTimeout(r, min))]).then(() => {
      if (cancelled) return;
      tw.kill();
      gsap
        .timeline({
          onComplete: () => {
            setDone(true);
            delete document.documentElement.dataset.booting;
            window.dispatchEvent(new Event("nk:loaded"));
          },
        })
        .to(state, {
          p: 1,
          duration: 0.35,
          onUpdate: () => {
            el.style.setProperty("--load", state.p.toFixed(3));
            count.current.forEach((c) => c && (c.textContent = String(Math.round(state.p * 100)).padStart(3, "0")));
          },
        })
        .to(el, { clipPath: "inset(0 0 100% 0)", duration: caps?.reducedMotion ? 0.2 : 0.9, ease: "expo.inOut" }, "+=0.15");
    });
    return () => {
      cancelled = true;
      tw.kill();
    };
  }, [booted, caps]);

  if (done) return null;
  const setCount = (i: number) => (n: HTMLSpanElement | null) => {
    if (n) count.current[i] = n;
  };

  return (
    <div ref={root} className="loader" role="progressbar" aria-label="Loading portfolio" style={{ clipPath: "inset(0 0 0 0)" }}>
      {/* GTA */}
      <div className="loader-v loader-gta">
        <div className="loader-gta-sun" />
        <div className="loader-gta-grid" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center">
          <div className="loader-gta-mark">{profile.initials}</div>
          <div className="mt-2 font-[family-name:var(--font-condensed)] text-lg tracking-[0.5em] text-white/90">
            NEON · STORIES
          </div>
          <div className="loader-gta-bar mt-10">
            <i />
          </div>
          <div className="mt-3 font-[family-name:var(--font-condensed)] text-sm tracking-[0.3em] text-[#ffd6ec]">
            LOADING <span ref={setCount(0)}>000</span>%
          </div>
          <p className="absolute bottom-8 max-w-md px-6 text-center font-[family-name:var(--font-condensed)] text-xs tracking-widest text-white/60">
            TIP: HIT <b>ALT + 1-4</b> ANYTIME TO JUMP BETWEEN UNIVERSES.
          </p>
        </div>
      </div>
      {/* ILLUSION */}
      <div className="loader-v loader-illusion">
        <div className="loader-ill-tunnel">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} style={{ ["--i" as string]: i }} />
          ))}
        </div>
        <div className="relative z-10 grid h-full place-items-center">
          <div className="text-center">
            <span ref={setCount(1)} className="loader-ill-count">000</span>
            <div className="mt-2 font-[family-name:var(--font-syne)] text-xs tracking-[0.6em] text-white/60">
              CALIBRATING PERCEPTION
            </div>
          </div>
        </div>
      </div>
      {/* HACKER */}
      <div className="loader-v loader-hacker">
        <div className="mx-auto h-full max-w-4xl px-6 py-16 font-[family-name:var(--font-mono)] text-[12px] leading-6 text-[#00ff9c] md:text-sm">
          {bootLines.map((l, i) => (
            <div key={l} className="loader-hack-line" style={{ animationDelay: `${i * 0.18}s` }}>
              {l}
            </div>
          ))}
          <div className="loader-hack-line mt-6" style={{ animationDelay: "1.3s" }}>
            <span className="text-[#ff3b3b]">root@nk</span>:<span className="text-[#62d6ff]">~</span># ./portfolio --render{" "}
            [<span className="loader-hack-bar" />] <span ref={setCount(2)}>000</span>%
            <span className="caret" />
          </div>
        </div>
        <div className="scanlines absolute inset-0" />
      </div>
      {/* PRO */}
      <div className="loader-v loader-pro">
        <div className="grid h-full place-items-center">
          <div className="w-[min(80vw,420px)]">
            <div className="flex items-end justify-between">
              <div>
                <div className="font-[family-name:var(--font-serif)] text-3xl text-[#14213d]">{profile.name}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.3em] text-[#5b6472]">{profile.role}</div>
              </div>
              <span ref={setCount(3)} className="tabular-nums text-sm text-[#5b6472]">
                000
              </span>
            </div>
            <div className="loader-pro-line mt-6">
              <i />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
