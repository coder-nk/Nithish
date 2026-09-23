"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { whenLoaded } from "@/lib/signals";
import { motion } from "motion/react";
import { profile, stats, skills, experience, projects, education, certifications } from "@/data/resume";
import { Magnetic } from "@/components/core/Magnetic";
import { PhysicsSkills } from "@/components/core/PhysicsSkills";
import { sound } from "@/lib/audio";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const nav = [
  ["about", "Profile"],
  ["experience", "Story"],
  ["work", "Jobs"],
  ["skills", "Arsenal"],
  ["contact", "Call"],
] as const;

export default function GtaView() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const intro = () => {
        if (reduced) return;
        const split = SplitText.create(".gta-title-line", { type: "chars" });
        gsap
          .timeline()
          .from(".gta-letterbox", { scaleY: 0, duration: 0.8, ease: "expo.out" })
          .from(split.chars, { yPercent: 130, rotate: 12, duration: 0.9, ease: "back.out(2.2)", stagger: 0.025 }, "-=0.4")
          .from(".gta-hero-tag", { x: -60, opacity: 0, skewX: -20, duration: 0.6, ease: "power4.out", stagger: 0.08 }, "-=0.5")
          .from(".gta-hero-cta > *", { y: 30, opacity: 0, duration: 0.5, stagger: 0.08, ease: "back.out(2)" }, "-=0.3")
          .from(".gta-nav", { y: -80, duration: 0.7, ease: "power4.out" }, 0.3);
      };
      const offIntro = whenLoaded(contextSafe!(intro));

      if (reduced) return offIntro;
      // punchy section title slams
      gsap.utils.toArray<HTMLElement>(".gta-h2").forEach((el) => {
        const s = SplitText.create(el, { type: "words,chars" });
        gsap.from(s.chars, {
          scale: 2.4,
          opacity: 0,
          filter: "blur(8px)",
          duration: 0.5,
          ease: "power4.out",
          stagger: 0.025,
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
      gsap.utils.toArray<HTMLElement>(".gta-pop").forEach((el) =>
        gsap.from(el, {
          y: 80,
          rotate: gsap.utils.random(-6, 6),
          opacity: 0,
          duration: 0.8,
          ease: "back.out(1.6)",
          scrollTrigger: { trigger: el, start: "top 88%" },
        }),
      );

      // pinned horizontal "Jobs" reel
      const track = document.querySelector<HTMLElement>(".gta-reel-track");
      if (track && window.innerWidth > 900) {
        const dist = () => track.scrollWidth - window.innerWidth + 80;
        gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: ".gta-reel",
            start: "top top",
            end: () => `+=${dist()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
      }
      // parallax sun-bleached hero title
      gsap.to(".gta-title", {
        yPercent: 40,
        ease: "none",
        scrollTrigger: { trigger: ".gta-hero", start: "top top", end: "bottom top", scrub: true },
      });
      return offIntro;
    },
    { scope: root },
  );

  return (
    <div ref={root} className="gta">
      <div className="gta-speedlines" aria-hidden />
      {/* NAV */}
      <header className="gta-nav">
        <a href="#top" className="gta-logo" aria-label="Back to top">
          <span>{profile.initials}</span>
          <small>NEON STORIES</small>
        </a>
        <nav aria-label="Primary" className="hidden gap-1 md:flex">
          {nav.map(([id, label], i) => (
            <a key={id} href={`#${id}`} className="gta-nav-link" onPointerEnter={() => sound?.hover()}>
              <i>0{i + 1}</i>
              {label}
            </a>
          ))}
        </nav>
        <div className="gta-wanted" aria-label="Experience level: 2+ years">
          {[0, 1, 2, 3, 4].map((i) => (
            <svg key={i} viewBox="0 0 24 24" data-on={i < 2 || undefined}>
              <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.1L12 17.6 5.7 21.3l1.7-7.1L2 9.5l7.1-.6z" />
            </svg>
          ))}
        </div>
      </header>

      {/* HERO */}
      <section id="top" data-section="hero" className="gta-hero">
        <div className="gta-letterbox top-0" aria-hidden />
        <div className="gta-letterbox bottom-0" aria-hidden />
        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1400px] flex-col justify-end px-5 pb-[14vh] md:px-10">
          <div className="gta-hero-tag gta-badge mb-4 w-fit">
            <span className="gta-live" /> NOW PLAYING · {profile.location.toUpperCase()}
          </div>
          <h1 className="gta-title" aria-label={profile.name}>
            <span className="gta-title-line block">{profile.firstName.toUpperCase()}</span>
            <span className="gta-title-line gta-title-outline block">{profile.lastName.toUpperCase()}</span>
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="gta-hero-tag gta-chip-hot">{profile.role.toUpperCase()}</span>
            <span className="gta-hero-tag gta-chip-cool">PYTHON</span>
            <span className="gta-hero-tag gta-chip-cool">POSTGRESQL</span>
            <span className="gta-hero-tag gta-chip-cool">ERP</span>
          </div>
          <div className="gta-hero-cta mt-10 flex flex-wrap gap-4">
            <Magnetic>
              <a href="#work" className="gta-btn gta-btn-primary" onClick={() => sound?.click()}>
                START MISSION ▸
              </a>
            </Magnetic>
            <Magnetic>
              <a href="#contact" className="gta-btn gta-btn-ghost" onClick={() => sound?.click()}>
                CONTACT
              </a>
            </Magnetic>
          </div>
        </div>
        <div className="gta-marquee" aria-hidden>
          <div>
            {Array.from({ length: 2 }).map((_, k) => (
              <span key={k}>
                ★ HIGH-AVAILABILITY POSTGRES ★ GOVERNMENT API INTEGRATIONS ★ ODOO ERP ★ MICROSERVICES ★ OWASP SECURITY ★ 99.9% UPTIME{" "}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PROFILE */}
      <section id="about" data-section="about" className="gta-section">
        <div className="gta-container grid items-start gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="gta-kicker">PLAYER PROFILE</p>
            <h2 className="gta-h2">THE DEVELOPER</h2>
            <p className="gta-pop mt-6 max-w-xl text-xl leading-relaxed text-white/85">{profile.summary}</p>
          </div>
          <div className="gta-pop gta-card gta-card-tilt p-6 md:p-8">
            <div className="flex items-center justify-between">
              <span className="gta-kicker !m-0">STATS</span>
              <span className="font-[family-name:var(--font-condensed)] text-sm text-[#ffd166]">LVL 02+</span>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-5">
              {stats.map((s) => (
                <div key={s.label}>
                  <dd className="gta-stat">{s.value}</dd>
                  <dt className="mt-1 text-[13px] uppercase leading-tight tracking-wide text-white/60">{s.label}</dt>
                </div>
              ))}
            </dl>
            <div className="mt-8 space-y-3">
              {skills.slice(0, 6).map((g) => (
                <div key={g.group}>
                  <div className="flex justify-between font-[family-name:var(--font-condensed)] text-sm tracking-wider">
                    <span>{g.group.toUpperCase()}</span>
                    <span className="text-white/50">{g.items.length} SKILLS</span>
                  </div>
                  <div className="gta-bar">
                    <i style={{ width: `${(g.items.length / 6) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STORY MODE */}
      <section id="experience" data-section="experience" className="gta-section">
        <div className="gta-container">
          <p className="gta-kicker">STORY MODE</p>
          <h2 className="gta-h2">MISSIONS</h2>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {experience.map((e, i) => (
              <article key={e.id} className="gta-pop gta-card gta-mission">
                <div className="gta-mission-head">
                  <span>MISSION 0{experience.length - i}</span>
                  <span className={e.end === "present" ? "text-[#00e5ff]" : "text-[#7CFF6B]"}>
                    {e.end === "present" ? "● IN PROGRESS" : "✔ PASSED"}
                  </span>
                </div>
                <div className="p-6 md:p-8">
                  <h3 className="font-[family-name:var(--font-anton)] text-4xl leading-none tracking-wide">{e.org.toUpperCase()}</h3>
                  <p className="mt-2 font-[family-name:var(--font-condensed)] text-lg tracking-wider text-[#ff9ac8]">
                    {e.role.toUpperCase()} · {e.period.toUpperCase()}
                  </p>
                  <p className="mt-1 text-sm text-white/50">{e.orgFull}</p>
                  <p className="mt-6 font-[family-name:var(--font-condensed)] text-sm tracking-[0.3em] text-white/60">OBJECTIVES</p>
                  <ul className="mt-3 space-y-2.5">
                    {e.points.map((p) => (
                      <li key={p} className="flex gap-3 text-[15px] leading-snug text-white/85">
                        <span className="gta-check" aria-hidden>
                          ✓
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* JOBS — pinned horizontal reel */}
      <section id="work" data-section="work" className="gta-reel">
        <div className="gta-container pt-24 md:pt-16">
          <p className="gta-kicker">AVAILABLE JOBS</p>
          <h2 className="gta-h2">THE BIG ONES</h2>
          <p className="mt-2 font-[family-name:var(--font-condensed)] tracking-widest text-white/50">DRAG THE CARDS · SCROLL TO ROLL</p>
        </div>
        <div className="gta-reel-track">
          {projects.map((p, i) => (
            <motion.article
              key={p.slug}
              className="gta-poster"
              style={{ ["--accent" as string]: p.accent.gta }}
              drag
              dragSnapToOrigin
              dragElastic={0.35}
              whileDrag={{ scale: 1.04, rotate: i % 2 ? 3 : -3 }}
              whileHover={{ y: -10, rotate: i % 2 ? 1.2 : -1.2 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              onPointerEnter={() => sound?.hover()}
            >
              <div className="gta-poster-art" aria-hidden>
                <div className="gta-poster-sun" />
                <div className="gta-poster-code">{p.code}</div>
                <div className="gta-poster-num">0{i + 1}</div>
              </div>
              <div className="relative p-6">
                <p className="font-[family-name:var(--font-condensed)] text-sm tracking-[0.3em] text-[var(--accent)]">{p.category.toUpperCase()}</p>
                <h3 className="mt-2 font-[family-name:var(--font-anton)] text-3xl leading-[1.02]">{p.title.toUpperCase()}</h3>
                <p className="mt-3 text-[15px] leading-snug text-white/75">{p.summary}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.stack.slice(0, 5).map((s) => (
                    <span key={s} className="gta-tag">
                      {s}
                    </span>
                  ))}
                </div>
                <Link href={`/work/${p.slug}`} className="gta-btn gta-btn-primary mt-6 inline-flex" onClick={() => sound?.click()}>
                  VIEW JOB ▸
                </Link>
              </div>
            </motion.article>
          ))}
          <div className="gta-poster gta-poster-end" aria-hidden>
            <span>MORE JOBS<br />COMING SOON</span>
          </div>
        </div>
      </section>

      {/* ARSENAL */}
      <section id="skills" data-section="skills" className="gta-section">
        <div className="gta-container">
          <p className="gta-kicker">WEAPON WHEEL</p>
          <h2 className="gta-h2">ARSENAL</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              {skills.map((g) => (
                <div key={g.group} className="gta-pop gta-card p-4">
                  <p className="font-[family-name:var(--font-condensed)] text-sm tracking-[0.25em] text-[#ffb000]">{g.group.toUpperCase()}</p>
                  <p className="mt-1 text-sm leading-snug text-white/80">{g.items.join(" · ")}</p>
                </div>
              ))}
            </div>
            <PhysicsSkills className="gta-physics" pillClassName="gta-pill" hint="GRAB · THROW · SMASH" height={520} />
          </div>
        </div>
      </section>

      {/* ACHIEVEMENTS */}
      <section id="education" data-section="education" className="gta-section">
        <div className="gta-container">
          <p className="gta-kicker">ACHIEVEMENTS UNLOCKED</p>
          <h2 className="gta-h2">TROPHIES</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...education.map((e) => ({ t: e.degree, s: `${e.school} · ${e.score}`, y: e.period })), ...certifications.map((c) => ({ t: c.name, s: c.issuer, y: "CERTIFIED" }))].map(
              (a, i) => (
                <div key={a.t} className="gta-pop gta-trophy">
                  <div className="gta-trophy-icon" data-tier={i < 3 ? "gold" : "silver"} aria-hidden>
                    ★
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-condensed)] text-xs tracking-[0.3em] text-white/50">{a.y}</p>
                    <p className="font-[family-name:var(--font-anton)] text-xl leading-tight">{a.t.toUpperCase()}</p>
                    <p className="mt-1 text-sm text-white/60">{a.s}</p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* CALL */}
      <section id="contact" data-section="contact" className="gta-section pb-40">
        <div className="gta-container grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="gta-kicker">INCOMING CALL</p>
            <h2 className="gta-h2 !text-[clamp(3.5rem,11vw,9rem)]">LET&apos;S RIDE.</h2>
            <p className="mt-4 max-w-md text-lg text-white/75">Got a system that needs to stay up, integrate everything and survive a pentest? Hit the line.</p>
          </div>
          <div className="gta-phone gta-pop">
            <div className="gta-phone-screen">
              <p className="font-[family-name:var(--font-condensed)] text-xs tracking-[0.35em] text-white/60">CONTACTS</p>
              <div className="gta-phone-avatar">{profile.initials}</div>
              <p className="font-[family-name:var(--font-anton)] text-3xl">{profile.name.toUpperCase()}</p>
              <p className="text-sm text-white/60">{profile.location}</p>
              <a href={`mailto:${profile.email}`} className="gta-btn gta-btn-primary mt-6 w-full justify-center" onClick={() => sound?.click()}>
                ✉ {profile.email}
              </a>
              {profile.showPhone && (
                <a href={`tel:${profile.phone}`} className="gta-btn gta-btn-ghost mt-3 w-full justify-center">
                  ☎ {profile.phone}
                </a>
              )}
              <a href="/resume.pdf" download className="gta-btn gta-btn-ghost mt-3 w-full justify-center">
                ⬇ DOWNLOAD DOSSIER
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
