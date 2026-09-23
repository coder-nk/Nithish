"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { whenLoaded } from "@/lib/signals";
import { profile, stats, skills, experience, projects, education, certifications } from "@/data/resume";
import { Magnetic } from "@/components/core/Magnetic";

gsap.registerPlugin(ScrollTrigger, Flip, SplitText, useGSAP);

const nav = [
  ["about", "Profile"],
  ["experience", "Experience"],
  ["work", "Case Studies"],
  ["skills", "Capabilities"],
  ["contact", "Contact"],
] as const;

export default function ProView() {
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  useGSAP(
    (_ctx, contextSafe) => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      const start = () => {
        const split = SplitText.create(".pro-hero-title", { type: "lines,words", mask: "lines" });
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .from(split.words, { yPercent: 110, duration: 1.2, stagger: 0.04 })
          .from(".pro-hero-meta > *", { y: 16, opacity: 0, duration: 0.9, stagger: 0.08 }, "-=0.9")
          .from(".pro-kpi", { y: 24, opacity: 0, duration: 0.9, stagger: 0.08 }, "-=0.7")
          .from(".pro-nav", { y: -20, opacity: 0, duration: 0.8 }, 0.2);
      };
      const offIntro = whenLoaded(contextSafe!(start));

      gsap.utils.toArray<HTMLElement>(".pro-reveal").forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
      gsap.utils.toArray<HTMLElement>(".pro-rule").forEach((el) =>
        gsap.from(el, { scaleX: 0, transformOrigin: "left", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } }),
      );
      // count-up metrics
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const raw = el.dataset.count!;
        const num = parseFloat(raw);
        const suffix = raw.replace(/[0-9.]/g, "");
        const dec = raw.includes(".") ? 1 : 0;
        const o = { v: 0 };
        gsap.to(o, {
          v: num,
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
          onUpdate: () => (el.textContent = o.v.toFixed(dec) + suffix),
        });
      });
      // timeline progress line
      gsap.fromTo(
        ".pro-timeline-progress",
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".pro-timeline", start: "top 70%", end: "bottom 60%", scrub: true } },
      );
      return offIntro;
    },
    { scope: root },
  );

  const toggleLayout = (next: "grid" | "list") => {
    if (next === layout || !grid.current) return;
    const state = Flip.getState(grid.current.querySelectorAll(".pro-case, .pro-case *[data-flip]"));
    setLayout(next);
    requestAnimationFrame(() =>
      Flip.from(state, { duration: 0.8, ease: "power3.inOut", stagger: 0.04, absolute: false, nested: true, scale: false }),
    );
  };

  return (
    <div ref={root} className="pro">
      {/* NAV */}
      <header className="pro-nav">
        <div className="pro-container flex h-16 items-center justify-between">
          <a href="#top" className="flex items-baseline gap-3" aria-label="Back to top">
            <span className="font-[family-name:var(--font-serif)] text-2xl leading-none">{profile.initials}</span>
            <span className="hidden text-[11px] uppercase tracking-[0.28em] text-[var(--pro-muted)] sm:inline">{profile.name}</span>
          </a>
          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            {nav.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="pro-link text-[13px]">
                {label}
              </a>
            ))}
          </nav>
          <Magnetic strength={0.2}>
            <a href="/resume.pdf" className="pro-btn pro-btn-ghost" download>
              Résumé
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                <path d="M6 1v8m0 0L2.5 5.5M6 9l3.5-3.5M1 11h10" stroke="currentColor" fill="none" strokeWidth="1.2" />
              </svg>
            </a>
          </Magnetic>
        </div>
      </header>

      {/* HERO */}
      <section id="top" data-section="hero" className="pro-container relative flex min-h-[100svh] flex-col justify-center pb-16 pt-28">
        <div className="max-w-3xl">
          <div className="pro-hero-meta mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] uppercase tracking-[0.22em] text-[var(--pro-muted)]">
            <span className="flex items-center gap-2">
              <i className="pro-dot" /> Project Associate · C-DAC
            </span>
            <span>{profile.location}</span>
          </div>
          <h1 className="pro-hero-title font-[family-name:var(--font-serif)] text-[clamp(2.8rem,7vw,6.2rem)] leading-[0.98] tracking-[-0.02em]">
            Engineering government-grade systems that <em className="text-[var(--pro-accent)]">stay up.</em>
          </h1>
          <div className="pro-hero-meta mt-8 max-w-xl">
            <p className="text-lg leading-relaxed text-[var(--pro-body)]">
              {profile.name} — {profile.role}. {profile.shortSummary}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Magnetic>
                <a href="#work" className="pro-btn pro-btn-solid">
                  View case studies <span aria-hidden>→</span>
                </a>
              </Magnetic>
              <Magnetic>
                <a href={`mailto:${profile.email}`} className="pro-btn pro-btn-ghost">
                  Start a conversation
                </a>
              </Magnetic>
            </div>
          </div>
        </div>
        <dl className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-[var(--pro-line)] bg-[var(--pro-line)] md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="pro-kpi bg-[var(--pro-bg)]/90 p-6 backdrop-blur-sm">
              <dt className="order-2 mt-2 text-[12px] leading-snug text-[var(--pro-muted)]">{s.label}</dt>
              <dd className="font-[family-name:var(--font-serif)] text-4xl" data-count={s.value}>
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ABOUT */}
      <section id="about" data-section="about" className="pro-section">
        <div className="pro-container grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="pro-eyebrow">01 — Profile</p>
            <div className="pro-rule mt-4" />
          </div>
          <div className="md:col-span-8">
            <p className="pro-reveal font-[family-name:var(--font-serif)] text-[clamp(1.6rem,3vw,2.5rem)] leading-[1.25]">
              {profile.summary}
            </p>
            <div className="pro-reveal mt-12 grid gap-8 sm:grid-cols-3">
              {[
                ["Reliability", "HA PostgreSQL with Patroni, ETCD and Keepalived; replication and failover by design."],
                ["Integration", "Government APIs — ULIP, VAHAN, SBI Payment Gateway — wired into production workflows."],
                ["Security", "Vulnerability assessment with Burp Suite, AppScan and WebInspect; OWASP remediation."],
              ].map(([h, b]) => (
                <div key={h}>
                  <h3 className="text-sm font-semibold">{h}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--pro-muted)]">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section id="experience" data-section="experience" className="pro-section">
        <div className="pro-container grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="pro-eyebrow">02 — Experience</p>
            <div className="pro-rule mt-4" />
            <h2 className="pro-h2 mt-6">Public-sector engineering, end to end.</h2>
          </div>
          <ol className="pro-timeline relative md:col-span-8">
            <span className="pro-timeline-track" aria-hidden>
              <span className="pro-timeline-progress" />
            </span>
            {experience.map((e) => (
              <li key={e.id} className="pro-reveal relative pb-16 pl-10 last:pb-0">
                <span className="pro-timeline-node" aria-hidden />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-xl font-semibold">
                    {e.role} <span className="font-normal text-[var(--pro-muted)]">· {e.org}</span>
                  </h3>
                  <span className="text-[12px] uppercase tracking-[0.18em] text-[var(--pro-muted)]">{e.period}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--pro-muted)]">{e.orgFull}</p>
                <ul className="mt-5 space-y-3">
                  {e.points.map((p) => (
                    <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-[var(--pro-body)]">
                      <span className="mt-[0.7em] h-px w-3 shrink-0 bg-[var(--pro-gold)]" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* WORK */}
      <section id="work" data-section="work" className="pro-section">
        <div className="pro-container">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="pro-eyebrow">03 — Selected case studies</p>
              <h2 className="pro-h2 mt-4 max-w-xl">Systems where uptime, integrity and integration matter.</h2>
            </div>
            <div className="pro-toggle" role="group" aria-label="Layout">
              {(["grid", "list"] as const).map((l) => (
                <button key={l} aria-pressed={layout === l} onClick={() => toggleLayout(l)}>
                  {l === "grid" ? "Grid" : "List"}
                </button>
              ))}
            </div>
          </div>
          <div className="pro-rule mt-8" />
          <div ref={grid} className={`pro-cases mt-10 ${layout === "grid" ? "is-grid" : "is-list"}`}>
            {projects.map((p, i) => (
              <Link key={p.slug} href={`/work/${p.slug}`} className="pro-case group" data-cursor="view" data-cursor-label="Read">
                <div className="pro-case-visual" data-flip={`v-${p.slug}`} style={{ ["--accent" as string]: p.accent.pro }}>
                  <span className="pro-case-index">0{i + 1}</span>
                  <CaseGlyph index={i} />
                </div>
                <div className="pro-case-body" data-flip={`b-${p.slug}`}>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--pro-muted)]">{p.category}</p>
                  <h3 className="mt-2 font-[family-name:var(--font-serif)] text-2xl leading-tight">{p.title}</h3>
                  <p className="pro-case-summary mt-3 text-sm leading-relaxed text-[var(--pro-muted)]">{p.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.stack.slice(0, 4).map((s) => (
                      <span key={s} className="pro-chip">
                        {s}
                      </span>
                    ))}
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium">
                    Read case study <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills" data-section="skills" className="pro-section">
        <div className="pro-container grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="pro-eyebrow">04 — Capabilities</p>
            <div className="pro-rule mt-4" />
            <h2 className="pro-h2 mt-6">A full-stack toolkit, weighted toward reliability.</h2>
          </div>
          <div className="md:col-span-8">
            <dl className="divide-y divide-[var(--pro-line)] border-y border-[var(--pro-line)]">
              {skills.map((g) => (
                <div key={g.group} className="pro-reveal grid gap-3 py-5 sm:grid-cols-[180px_1fr]">
                  <dt className="text-sm font-semibold">{g.group}</dt>
                  <dd className="flex flex-wrap gap-2">
                    {g.items.map((s) => (
                      <span key={s} className="pro-chip pro-chip-lg">
                        {s}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* EDUCATION */}
      <section id="education" data-section="education" className="pro-section">
        <div className="pro-container grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="pro-eyebrow">05 — Education & certification</p>
            <div className="pro-rule mt-4" />
          </div>
          <div className="grid gap-12 sm:grid-cols-2 md:col-span-8">
            <ul className="space-y-6">
              {education.map((e) => (
                <li key={e.degree} className="pro-reveal">
                  <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--pro-muted)]">{e.period}</p>
                  <h3 className="mt-1 font-semibold">{e.degree}</h3>
                  <p className="text-sm text-[var(--pro-muted)]">
                    {e.school} · {e.score}
                  </p>
                </li>
              ))}
            </ul>
            <ul className="space-y-4">
              {certifications.map((c) => (
                <li key={c.name} className="pro-reveal flex items-center justify-between gap-4 border-b border-[var(--pro-line)] pb-4">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-sm text-[var(--pro-muted)]">{c.issuer}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" data-section="contact" className="pro-section pb-40">
        <div className="pro-container">
          <div className="pro-cta pro-reveal">
            <p className="pro-eyebrow text-[var(--pro-gold)]">06 — Contact</p>
            <h2 className="mt-6 max-w-3xl font-[family-name:var(--font-serif)] text-[clamp(2.2rem,5vw,4.5rem)] leading-[1.02]">
              Building something that has to work every single time?
            </h2>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Magnetic>
                <a href={`mailto:${profile.email}`} className="pro-btn pro-btn-light">
                  {profile.email}
                </a>
              </Magnetic>
              {profile.showPhone && <a href={`tel:${profile.phone}`} className="text-white/70 underline-offset-4 hover:underline">{profile.phone}</a>}
              <span className="text-sm text-white/60">{profile.location}</span>
            </div>
          </div>
          <footer className="mt-16 flex flex-wrap justify-between gap-4 text-[12px] text-[var(--pro-muted)]">
            <span>© {new Date().getFullYear()} {profile.name}</span>
            <span>Press Alt + 1–4 to explore other universes.</span>
          </footer>
        </div>
      </section>
    </div>
  );
}

/** Minimal line-art diagrams, one per case study. */
function CaseGlyph({ index }: { index: number }) {
  const common = { stroke: "currentColor", fill: "none", strokeWidth: 1 } as const;
  if (index === 0)
    return (
      <svg viewBox="0 0 200 120" className="pro-glyph" aria-hidden>
        <rect x="10" y="45" width="36" height="30" {...common} />
        <rect x="82" y="15" width="36" height="24" {...common} />
        <rect x="82" y="48" width="36" height="24" {...common} />
        <rect x="82" y="81" width="36" height="24" {...common} />
        <rect x="154" y="45" width="36" height="30" {...common} />
        <path d="M46 60h36M64 27v66M64 27h18M64 60h18M64 93h18M118 60h36" {...common} />
      </svg>
    );
  if (index === 1)
    return (
      <svg viewBox="0 0 200 120" className="pro-glyph" aria-hidden>
        <ellipse cx="100" cy="60" rx="32" ry="44" {...common} />
        <path d="M100 16v88M76 34c16 8 32 8 48 0M70 60c20 8 40 8 60 0M76 86c16-8 32-8 48 0" {...common} />
        <circle cx="118" cy="48" r="7" {...common} />
        <path d="M130 40l40-20M170 20h20" {...common} />
      </svg>
    );
  return (
    <svg viewBox="0 0 200 120" className="pro-glyph" aria-hidden>
      <ellipse cx="60" cy="30" rx="30" ry="9" {...common} />
      <path d="M30 30v50c0 5 13 9 30 9s30-4 30-9V30" {...common} />
      <ellipse cx="140" cy="30" rx="30" ry="9" {...common} />
      <path d="M110 30v50c0 5 13 9 30 9s30-4 30-9V30" {...common} />
      <path d="M92 55h16M104 51l4 4-4 4" {...common} />
    </svg>
  );
}
