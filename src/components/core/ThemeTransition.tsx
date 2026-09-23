"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useTheme } from "./ThemeProvider";
import { THEMES, type ThemeId } from "@/lib/themes";
import { profile } from "@/data/resume";

/**
 * The switch between universes is itself a cinematic.
 * Each destination theme owns its own "portal":
 *  GTA → skewed sunset slabs + wanted-level stars
 *  Illusion → liquid gooey portal that blooms from the click point
 *  Hacker → glitch tear, scanlines, ACCESS GRANTED
 *  Pro → architectural curtain + monogram
 */
export function ThemeTransition() {
  const { phase, target, commitSwap, finishTransition, origin, caps } = useTheme();
  const root = useRef<HTMLDivElement>(null);
  const shown = useRef<ThemeId | null>(null);
  if (target) shown.current = target;
  const t = shown.current;
  const reduced = !!caps?.reducedMotion;

  useEffect(() => {
    const el = root.current;
    if (!el || !t) return;
    if (phase !== "cover" && phase !== "reveal") return;
    const q = gsap.utils.selector(el);
    let tl: gsap.core.Timeline | null = null;
    {
      tl = gsap.timeline({
        defaults: { ease: "power4.inOut" },
        onComplete: phase === "cover" ? commitSwap : finishTransition,
      });
      gsap.set(el, { autoAlpha: 1 });

      if (reduced) {
        if (phase === "cover") tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.25 });
        else tl.to(el, { opacity: 0, duration: 0.25 }).set(el, { autoAlpha: 0 });
        return;
      }

      if (t === "gta") {
        if (phase === "cover") {
          tl.fromTo(q(".tx-slab"), { xPercent: -130 }, { xPercent: 0, duration: 0.7, stagger: 0.06 })
            .fromTo(q(".tx-gta-title"), { yPercent: 120, skewY: 8 }, { yPercent: 0, skewY: 0, duration: 0.5, ease: "back.out(2)" }, "-=0.25")
            .fromTo(q(".tx-star"), { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, stagger: 0.07, duration: 0.3, ease: "back.out(3)" }, "-=0.2")
            .to({}, { duration: 0.15 });
        } else {
          tl.to(q(".tx-gta-title, .tx-stars"), { yPercent: -120, opacity: 0, duration: 0.35, ease: "power3.in" })
            .to(q(".tx-slab"), { xPercent: 130, duration: 0.7, stagger: 0.05 }, "-=0.1")
            .set(el, { autoAlpha: 0 });
        }
      } else if (t === "illusion") {
        const ox = origin.x * 100,
          oy = origin.y * 100;
        gsap.set(q(".tx-liquid"), { transformOrigin: `${ox}% ${oy}%` });
        if (phase === "cover") {
          tl.fromTo(
            q(".tx-blob"),
            { attr: { r: 0 } },
            { attr: { r: 160 }, duration: 1.1, ease: "power3.inOut" },
          )
            .fromTo(q(".tx-ill-rings circle"), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.05, duration: 0.8, transformOrigin: "50% 50%" }, 0.3)
            .fromTo(q(".tx-ill-word"), { opacity: 0, letterSpacing: "1.2em", filter: "blur(12px)" }, { opacity: 1, letterSpacing: "0.2em", filter: "blur(0px)", duration: 0.7 }, 0.5);
        } else {
          tl.to(q(".tx-ill-word"), { opacity: 0, scale: 1.6, filter: "blur(16px)", duration: 0.45 })
            .to(q(".tx-ill-rings circle"), { scale: 3, opacity: 0, stagger: 0.03, duration: 0.6 }, 0)
            .to(q(".tx-blob"), { attr: { r: 0 }, duration: 0.9, ease: "power3.inOut" }, 0.15)
            .set(el, { autoAlpha: 0 });
        }
      } else if (t === "hacker") {
        const rows = q(".tx-glitch-row");
        if (phase === "cover") {
          tl.set(q(".tx-hack-bg"), { opacity: 0 })
            .to(rows, {
              scaleX: 1,
              x: () => gsap.utils.random(-40, 40),
              duration: 0.08,
              stagger: { each: 0.012, from: "random" },
              ease: "steps(2)",
            })
            .to(q(".tx-hack-bg"), { opacity: 1, duration: 0.05 })
            .fromTo(q(".tx-hack-line"), { opacity: 0 }, { opacity: 1, stagger: 0.09, duration: 0.01 })
            .to(q(".tx-hack-granted"), { opacity: 1, duration: 0.01 }, "+=0.05")
            .to(q(".tx-hack-granted"), { opacity: 0.2, repeat: 3, yoyo: true, duration: 0.06 });
        } else {
          tl.to(q(".tx-hack-lines, .tx-hack-granted"), { opacity: 0, duration: 0.05 })
            .to(q(".tx-hack-bg"), { opacity: 0, duration: 0.05 })
            .to(rows, {
              scaleX: 0,
              x: () => gsap.utils.random(-120, 120),
              duration: 0.1,
              stagger: { each: 0.01, from: "random" },
              ease: "steps(3)",
            })
            .set(el, { autoAlpha: 0 });
        }
      } else {
        if (phase === "cover") {
          tl.fromTo(q(".tx-pro-panel"), { yPercent: 100 }, { yPercent: 0, duration: 0.9, stagger: 0.08, ease: "expo.inOut" })
            .fromTo(q(".tx-pro-mark"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, "-=0.3")
            .fromTo(q(".tx-pro-rule"), { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power3.out" }, "<");
        } else {
          tl.to(q(".tx-pro-mark"), { opacity: 0, y: -16, duration: 0.35, ease: "power2.in" })
            .to(q(".tx-pro-panel"), { yPercent: -100, duration: 0.9, stagger: 0.07, ease: "expo.inOut" }, "-=0.1")
            .set(el, { autoAlpha: 0 });
        }
      }
    }
    return () => {
      tl?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, t]);

  return (
    <div
      ref={root}
      className="theme-transition"
      data-to={t ?? ""}
      aria-hidden={phase === "idle"}
      role="status"
      aria-live="polite"
      style={{ visibility: "hidden" }}
    >
      <span className="sr-only">{t ? `Switching to ${THEMES[t].label} theme` : ""}</span>
      {t === "gta" && (
        <div className="absolute inset-0 overflow-hidden">
          {["#ff2e88", "#ff6a3d", "#ffb000", "#7b2cff", "#140526"].map((c, i) => (
            <div key={c} className="tx-slab" style={{ background: c, top: `${i * 20 - 10}%` }} />
          ))}
          <div className="absolute inset-0 grid place-items-center">
            <div className="overflow-hidden">
              <div className="tx-gta-title">NEON NIGHTS</div>
            </div>
            <div className="tx-stars absolute bottom-[22%] flex gap-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <svg key={i} className="tx-star" width="34" height="34" viewBox="0 0 24 24">
                  <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.1L12 17.6 5.7 21.3l1.7-7.1L2 9.5l7.1-.6z" fill="#fff" stroke="#140526" strokeWidth="1.5" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      )}
      {t === "illusion" && (
        <div className="absolute inset-0">
          <svg className="tx-liquid absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <filter id="tx-goo">
                <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4">
                  <animate attributeName="baseFrequency" dur="3s" values="0.03;0.06;0.03" repeatCount="indefinite" />
                </feTurbulence>
                <feDisplacementMap in="SourceGraphic" scale="9" />
              </filter>
              <radialGradient id="tx-ill-g">
                <stop offset="0" stopColor="#1a0f3d" />
                <stop offset="0.6" stopColor="#0b0818" />
                <stop offset="1" stopColor="#07060d" />
              </radialGradient>
            </defs>
            <circle className="tx-blob" cx={origin.x * 100} cy={origin.y * 100} r="0" fill="url(#tx-ill-g)" filter="url(#tx-goo)" />
            <g className="tx-ill-rings" fill="none" strokeWidth="0.25">
              {[8, 14, 20, 26, 32, 38].map((r, i) => (
                <circle key={r} cx="50" cy="50" r={r} stroke={i % 2 ? "#ff5ca8" : "#7c5cff"} strokeDasharray={`${1 + i} ${1 + i}`} />
              ))}
            </g>
          </svg>
          <div className="tx-ill-word absolute inset-0 grid place-items-center font-[family-name:var(--font-syne)] text-2xl text-white md:text-4xl">
            PERCEPTION&nbsp;SHIFT
          </div>
        </div>
      )}
      {t === "hacker" && (
        <div className="absolute inset-0 font-[family-name:var(--font-mono)]">
          <div className="absolute inset-0 flex flex-col">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="tx-glitch-row" style={{ background: i % 5 === 0 ? "#00ff9c" : i % 7 === 0 ? "#ff3b3b" : "#020604" }} />
            ))}
          </div>
          <div className="tx-hack-bg absolute inset-0 bg-[#020604]" />
          <div className="tx-hack-lines absolute left-[8%] top-[28%] space-y-1 text-sm text-[#00ff9c] md:text-base">
            {[
              "> establishing secure tunnel ........ OK",
              "> handshake TLS1.3 / x25519 ......... OK",
              `> loading profile: ${profile.initials.toLowerCase()}_sys.img ....... OK`,
              "> mounting /dev/portfolio ........... OK",
            ].map((l) => (
              <div key={l} className="tx-hack-line">
                {l}
              </div>
            ))}
          </div>
          <div className="tx-hack-granted absolute inset-x-0 top-[55%] text-center text-3xl tracking-[0.3em] text-[#00ff9c] opacity-0 md:text-5xl">
            [ ACCESS GRANTED ]
          </div>
          <div className="scanlines absolute inset-0" />
        </div>
      )}
      {t === "pro" && (
        <div className="absolute inset-0">
          <div className="tx-pro-panel absolute inset-0 bg-[#1f3a5f]" />
          <div className="tx-pro-panel absolute inset-0 bg-[#f5f3ee]" />
          <div className="tx-pro-mark absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="font-[family-name:var(--font-serif)] text-5xl text-[#14213d] md:text-7xl">{profile.initials}</div>
              <div className="tx-pro-rule mx-auto my-4 h-px w-24 origin-left bg-[#b08d57]" />
              <div className="text-xs uppercase tracking-[0.4em] text-[#5b6472]">{profile.name}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
