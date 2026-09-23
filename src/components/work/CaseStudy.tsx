"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { projects, getProject } from "@/data/resume";
import { useTheme } from "@/components/core/ThemeProvider";
import type { ThemeId } from "@/lib/themes";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const copy: Record<ThemeId, { back: string; overview: string; challenge: string; approach: string; outcome: string; arch: string; stack: string; next: string }> = {
  gta: { back: "◂ BACK TO JOBS", overview: "THE JOB", challenge: "THE PROBLEM", approach: "THE PLAN", outcome: "THE PAYOUT", arch: "THE CREW", stack: "LOADOUT", next: "NEXT JOB ▸" },
  illusion: { back: "← return to reality", overview: "What it is", challenge: "The paradox", approach: "The method", outcome: "What changed", arch: "Structure", stack: "Materials", next: "Next portal →" },
  hacker: { back: "$ cd ..", overview: "## README", challenge: "## PROBLEM", approach: "## IMPLEMENTATION", outcome: "## RESULT", arch: "## TOPOLOGY", stack: "## DEPENDENCIES", next: "$ cd ../next →" },
  pro: { back: "← All case studies", overview: "Overview", challenge: "Challenge", approach: "Approach", outcome: "Outcome", arch: "Architecture", stack: "Technology", next: "Next case study →" },
};

/** Case-study layout; one semantic structure, re-skinned per universe via [data-universe]. */
export function CaseStudy({ slug }: { slug: string }) {
  const { theme, booted } = useTheme();
  const t: ThemeId = booted ? theme : "pro";
  const p = getProject(slug)!;
  const idx = projects.findIndex((x) => x.slug === slug);
  const next = projects[(idx + 1) % projects.length];
  const c = copy[t];
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".cs-hero > *", { y: 50, opacity: 0, duration: 1, stagger: 0.08, ease: "expo.out", delay: 0.1 });
      gsap.utils.toArray<HTMLElement>(".cs-block").forEach((el) =>
        gsap.from(el, { y: 40, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } }),
      );
      gsap.from(".cs-arch-node", {
        scale: 0.6,
        opacity: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: "back.out(2)",
        scrollTrigger: { trigger: ".cs-arch", start: "top 80%" },
      });
    },
    { scope: root, dependencies: [t] },
  );

  return (
    <div ref={root} key={t} className="cs universe" data-universe={t} style={{ ["--accent" as string]: p.accent[t] }}>
      <div className="cs-container">
        <Link href={`/#work`} className="cs-back">
          {c.back}
        </Link>
        <header className="cs-hero" data-section="hero">
          <p className="cs-eyebrow">
            {t === "hacker" ? `~/projects/${p.slug}` : p.category} · {p.year}
          </p>
          <h1 className="cs-title" data-text={p.title}>
            {t === "gta" ? p.title.toUpperCase() : p.title}
          </h1>
          <p className="cs-lede">{p.summary}</p>
          <dl className="cs-meta">
            <div>
              <dt>Role</dt>
              <dd>{p.role}</dd>
            </div>
            <div>
              <dt>Domain</dt>
              <dd>{p.category}</dd>
            </div>
            <div>
              <dt>Code</dt>
              <dd>{p.code}</dd>
            </div>
          </dl>
        </header>

        <section className="cs-grid" data-section="about">
          <div className="cs-block">
            <h2 className="cs-h2">{c.challenge}</h2>
            <p className="cs-p">{p.challenge}</p>
          </div>
          <div className="cs-block">
            <h2 className="cs-h2">{c.approach}</h2>
            <ol className="cs-list">
              {p.approach.map((a, i) => (
                <li key={a}>
                  <span className="cs-num">{String(i + 1).padStart(2, "0")}</span>
                  {a}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="cs-block cs-arch" data-section="work" aria-label={c.arch}>
          <h2 className="cs-h2">{c.arch}</h2>
          <div className="cs-arch-flow">
            {p.architecture.map((n, i) => (
              <div key={n.label} className="cs-arch-step">
                <div className="cs-arch-node">
                  <span className="cs-arch-label">{n.label}</span>
                  <span className="cs-arch-detail">{n.detail}</span>
                </div>
                {i < p.architecture.length - 1 && <span className="cs-arch-link" aria-hidden />}
              </div>
            ))}
          </div>
        </section>

        <section className="cs-grid" data-section="skills">
          <div className="cs-block">
            <h2 className="cs-h2">{c.outcome}</h2>
            <ul className="cs-list cs-list-check">
              {p.outcome.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
          <div className="cs-block">
            <h2 className="cs-h2">{c.stack}</h2>
            <div className="cs-stack">
              {p.stack.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>
        </section>

        <Link href={`/work/${next.slug}`} className="cs-next cs-block" data-section="contact" data-cursor="view" data-cursor-label="NEXT">
          <span className="cs-eyebrow">{c.next}</span>
          <span className="cs-next-title">{t === "gta" ? next.title.toUpperCase() : next.title}</span>
        </Link>
      </div>
    </div>
  );
}
