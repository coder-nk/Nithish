"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { useTheme } from "./ThemeProvider";
import { profile } from "@/data/resume";
import type { ThemeId } from "@/lib/themes";
import { sound } from "@/lib/audio";

const SECTIONS = ["about", "experience", "work", "skills", "education", "contact"] as const;

// Same destinations, each universe's own vocabulary.
const LABELS: Record<ThemeId, { title: string; items: string[] }> = {
  gta: { title: "PAUSE MENU", items: ["Profile", "Story", "Jobs", "Arsenal", "Trophies", "Call"] },
  illusion: { title: "Navigate reality", items: ["Perception", "Timeline", "Portals", "Matter", "Recursion", "Signal"] },
  hacker: { title: "~/nav", items: ["whoami", "git-log", "projects", "nmap", "certs", "contact"] },
  pro: { title: "Menu", items: ["Profile", "Experience", "Case studies", "Capabilities", "Education", "Contact"] },
};

/**
 * Mobile navigation: a liquid-glass sheet that wells up out of the dock.
 * Thumb-reachable, focus-trapped, closes on Escape / scrim tap / link tap.
 */
export function MobileMenu() {
  const { theme, phase } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const L = LABELS[theme];

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (phase !== "idle") setOpen(false);
  }, [phase]);

  // open / close choreography — the sheet behaves like a drop of liquid
  useEffect(() => {
    const s = sheet.current,
      sc = scrim.current;
    if (!s || !sc) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    if (open) {
      lenis?.stop();
      gsap.set([s, sc], { display: "block" });
      if (reduced) gsap.set([s, sc], { opacity: 1 });
      else {
        gsap.fromTo(sc, { opacity: 0 }, { opacity: 1, duration: 0.35 });
        gsap.fromTo(
          s,
          { y: 60, scaleX: 0.55, scaleY: 0.3, opacity: 0, borderRadius: "60px", transformOrigin: "50% 100%" },
          { y: 0, scaleX: 1, scaleY: 1, opacity: 1, borderRadius: "30px", duration: 0.75, ease: "elastic.out(1, 0.72)" },
        );
        gsap.fromTo(s.querySelectorAll(".mm-item"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.04, delay: 0.1, ease: "power3.out" });
      }
      s.querySelector<HTMLElement>(".mm-item")?.focus({ preventScroll: true });
    } else {
      lenis?.start();
      if (s.style.display === "block") {
        gsap.to(sc, { opacity: 0, duration: 0.25 });
        gsap.to(s, {
          y: 50,
          scaleX: 0.6,
          scaleY: 0.4,
          opacity: 0,
          duration: reduced ? 0.01 : 0.3,
          ease: "power3.in",
          onComplete: () => {
            gsap.set([s, sc], { display: "none" });
          },
        });
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
      if (e.key === "Tab" && sheet.current) {
        const f = Array.from(sheet.current.querySelectorAll<HTMLElement>("a,button"));
        const first = f[0],
          last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const home = pathname === "/";
  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={btn}
        className="switcher-tool mm-trigger"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => {
          sound?.click();
          setOpen((o) => !o);
        }}
      >
        <span className="mm-burger" data-open={open || undefined} aria-hidden>
          <i />
          <i />
        </span>
      </button>
      {mounted &&
        createPortal(
          <>
            <div ref={scrim} className="mm-scrim" style={{ display: "none" }} onClick={close} aria-hidden />
            <div
              ref={sheet}
              id="mobile-menu"
              className="mm-sheet lg lg-refract"
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              style={{ display: "none" }}
            >
              <div className="mm-head">
                <span className="mm-title">{L.title}</span>
                <span className="mm-name">{profile.name}</span>
              </div>
              <ul className="mm-list">
                {SECTIONS.map((id, i) => (
                  <li key={id}>
                    {home ? (
                      <a href={`#${id}`} className="mm-item" onClick={close}>
                        <span className="mm-idx">0{i + 1}</span>
                        {L.items[i]}
                        <span className="mm-arrow" aria-hidden>
                          →
                        </span>
                      </a>
                    ) : (
                      <Link href={`/#${id}`} className="mm-item" onClick={close}>
                        <span className="mm-idx">0{i + 1}</span>
                        {L.items[i]}
                        <span className="mm-arrow" aria-hidden>
                          →
                        </span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mm-actions">
                <a href={`mailto:${profile.email}`} className="mm-chip lg" onClick={close}>
                  Email
                </a>
                <a href="/resume.pdf" download className="mm-chip lg" onClick={close}>
                  Résumé
                </a>
                <button className="mm-chip lg" onClick={close}>
                  Close
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
