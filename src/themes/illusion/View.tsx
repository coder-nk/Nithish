"use client";

import { useEffect, useRef, type PointerEvent as RPE } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Observer } from "gsap/Observer";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { whenLoaded } from "@/lib/signals";
import { profile, stats, skills, experience, projects, education, certifications } from "@/data/resume";
import { PhysicsSkills } from "@/components/core/PhysicsSkills";
import { Magnetic } from "@/components/core/Magnetic";
import { sound } from "@/lib/audio";

gsap.registerPlugin(ScrollTrigger, Observer, SplitText, useGSAP);

const nav = [
  ["about", "Perception"],
  ["experience", "Timeline"],
  ["work", "Portals"],
  ["skills", "Matter"],
  ["contact", "Signal"],
] as const;

/** Letters that thicken, lean and swell as the cursor approaches (variable-font morphing). */
function MorphWord({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const chars = Array.from(el.querySelectorAll<HTMLSpanElement>("[data-c]"));
    let raf = 0;
    let mx = -1e4,
      my = -1e4;
    const move = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const tick = () => {
      chars.forEach((c) => {
        const r = c.getBoundingClientRect();
        const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
        const k = Math.max(0, 1 - d / 420);
        const w = 400 + k * 400;
        c.style.fontVariationSettings = `"wght" ${w.toFixed(0)}`;
        c.style.transform = `translateY(${(-k * 14).toFixed(1)}px) skewX(${((mx - (r.left + r.width / 2)) * -0.02 * k).toFixed(2)}deg) scaleY(${(1 + k * 0.18).toFixed(3)})`;
      });
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <span ref={ref} className={className} aria-label={text}>
      {text.split("").map((c, i) => (
        <span key={i} data-c aria-hidden className="ill-char">
          {c === " " ? " " : c}
        </span>
      ))}
    </span>
  );
}

/** 3D tilt that follows the pointer, plus a liquid highlight. */
function tilt(e: RPE<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  gsap.to(el, { rotateY: x * 18, rotateX: -y * 18, duration: 0.6, ease: "power3.out", transformPerspective: 900 });
  el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
  el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
}
function untilt(e: RPE<HTMLElement>) {
  gsap.to(e.currentTarget, { rotateY: 0, rotateX: 0, duration: 1, ease: "elastic.out(1,0.4)" });
}

export default function IllusionView() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const intro = () => {
        if (reduced) return;
        gsap
          .timeline()
          .from(".ill-echo", { scale: 0.2, opacity: 0, duration: 1.8, stagger: 0.08, ease: "expo.out" })
          .from(".ill-title > span", { yPercent: 60, opacity: 0, rotateX: -80, filter: "blur(20px)", duration: 1.4, stagger: 0.15, ease: "expo.out", transformPerspective: 800 }, 0.2)
          .from(".ill-hero-sub > *", { opacity: 0, y: 20, filter: "blur(10px)", duration: 1, stagger: 0.1 }, 0.8)
          .from(".ill-orbit", { scale: 0, rotate: -180, duration: 1.4, ease: "expo.out" }, 0.4);
      };
      const offIntro = whenLoaded(contextSafe!(intro));
      if (reduced) return offIntro;

      // Reality-bending scroll: wheel/touch velocity skews and stretches the world (GSAP Observer)
      const content = root.current!.querySelector<HTMLElement>(".ill-content")!;
      const skewTo = gsap.quickTo(content, "skewY", { duration: 0.8, ease: "power3" });
      const scaleTo = gsap.quickTo(content, "scaleY", { duration: 0.8, ease: "power3" });
      const obs = Observer.create({
        target: window,
        type: "wheel,touch",
        onChange: (self) => {
          const v = gsap.utils.clamp(-1, 1, self.deltaY / 120);
          skewTo(v * 2.2);
          scaleTo(1 + Math.abs(v) * 0.02);
        },
        onStop: () => {
          skewTo(0);
          scaleTo(1);
        },
        onStopDelay: 0.12,
      });

      // Paragraph folds up from a steep perspective as it enters
      gsap.utils.toArray<HTMLElement>(".ill-fold").forEach((el) =>
        gsap.fromTo(
          el,
          { rotateX: 65, opacity: 0.1, transformPerspective: 900, transformOrigin: "50% 100%" },
          { rotateX: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 95%", end: "top 45%", scrub: true } },
        ),
      );
      // Isometric impossible stack resolves into readable cards
      gsap.fromTo(
        ".ill-stack",
        { rotateX: 58, rotateZ: -38, scale: 0.8 },
        {
          rotateX: 0,
          rotateZ: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: ".ill-stack-wrap", start: "top 90%", end: "top 20%", scrub: true },
        },
      );
      gsap.utils.toArray<HTMLElement>(".ill-stack-card").forEach((el, i) =>
        gsap.fromTo(
          el,
          { z: 120 * (i + 1), y: -40 * i },
          { z: 0, y: 0, ease: "none", scrollTrigger: { trigger: ".ill-stack-wrap", start: "top 90%", end: "top 20%", scrub: true } },
        ),
      );
      // Section titles: blur-morph letter-spacing in
      gsap.utils.toArray<HTMLElement>(".ill-h2").forEach((el) => {
        const s = SplitText.create(el, { type: "words,chars" });
        gsap.from(s.chars, {
          opacity: 0,
          filter: "blur(14px)",
          scale: 1.8,
          x: () => gsap.utils.random(-60, 60),
          duration: 1.2,
          stagger: { each: 0.03, from: "random" },
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
      // Droste frames spin with scroll
      gsap.to(".ill-droste-frame", {
        rotate: (i) => (i % 2 ? 1 : -1) * (20 + i * 12),
        ease: "none",
        scrollTrigger: { trigger: ".ill-droste", start: "top bottom", end: "bottom top", scrub: true },
      });
      gsap.to(".ill-orbit", { rotate: 360, repeat: -1, duration: 30, ease: "none" });
      return () => {
        obs.kill();
        offIntro();
      };
    },
    { scope: root },
  );

  // Contact: characters repelled by the cursor
  const repel = (e: RPE<HTMLElement>) => {
    const chars = e.currentTarget.querySelectorAll<HTMLSpanElement>("span");
    chars.forEach((c) => {
      const r = c.getBoundingClientRect();
      const dx = r.left + r.width / 2 - e.clientX,
        dy = r.top + r.height / 2 - e.clientY;
      const d = Math.hypot(dx, dy);
      const f = Math.max(0, 1 - d / 160);
      gsap.to(c, { x: (dx / (d || 1)) * f * 30, y: (dy / (d || 1)) * f * 30, rotate: f * dx * 0.2, duration: 0.4, ease: "power3.out" });
    });
  };
  const unrepel = (e: RPE<HTMLElement>) =>
    gsap.to(e.currentTarget.querySelectorAll("span"), { x: 0, y: 0, rotate: 0, duration: 1.2, ease: "elastic.out(1,0.3)" });

  return (
    <div ref={root} className="ill">
      {/* NAV */}
      <a href="#top" className="ill-orbit-wrap" aria-label="Back to top">
        <svg className="ill-orbit" viewBox="0 0 120 120" aria-hidden>
          <defs>
            <path id="ill-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
          </defs>
          <text>
            <textPath href="#ill-circle">NITHISHKUMAR · REALITY ENGINEER · FULL STACK ·</textPath>
          </text>
        </svg>
        <span className="ill-orbit-core">{profile.initials}</span>
      </a>
      <nav className="ill-nav" aria-label="Primary">
        {nav.map(([id, label], i) => (
          <a key={id} href={`#${id}`} onPointerEnter={() => sound?.hover()}>
            <sup>0{i + 1}</sup>
            <span data-text={label}>{label}</span>
          </a>
        ))}
      </nav>

      <div className="ill-content">
        {/* HERO */}
        <section id="top" data-section="hero" className="ill-hero">
          <div className="ill-echoes" aria-hidden>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="ill-echo" style={{ ["--i" as string]: i }}>
                {profile.firstName.toUpperCase()}
              </div>
            ))}
          </div>
          <div className="relative z-10 text-center">
            <p className="ill-hero-sub mb-6 font-[family-name:var(--font-grotesk)] text-xs uppercase tracking-[0.6em] text-white/60">
              <span>{profile.role}</span>
            </p>
            <div className="relative">
              <h1 className="ill-title">
                <MorphWord text={profile.firstName.toUpperCase()} className="block" />
                <MorphWord text={profile.lastName.toUpperCase()} className="block ill-title-alt" />
              </h1>
              <div className="ill-reflection" aria-hidden>
                {profile.firstName.toUpperCase()}
                <br />
                {profile.lastName.toUpperCase()}
              </div>
            </div>
            <div className="ill-hero-sub relative z-10 mx-auto mt-[clamp(4rem,12vw,9rem)] max-w-lg">
              <p className="font-[family-name:var(--font-grotesk)] text-lg text-white/75">
                Systems that look simple from one angle — and hold up from every other.
              </p>
            </div>
          </div>
          <div className="ill-scrollcue" aria-hidden>
            <span>SCROLL TO BEND</span>
          </div>
        </section>

        {/* PERCEPTION */}
        <section id="about" data-section="about" className="ill-section">
          <div className="ill-container">
            <p className="ill-kicker">01 / perception</p>
            <h2 className="ill-h2">Seen from here.</h2>
            <p className="ill-fold mt-10 max-w-4xl font-[family-name:var(--font-syne)] text-[clamp(1.5rem,3.2vw,2.8rem)] leading-[1.2]">
              {profile.summary}
            </p>
            <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
              {stats.map((s, i) => (
                <div key={s.label} className="ill-stat" style={{ ["--d" as string]: `${i * -3}s` }}>
                  <svg viewBox="0 0 100 100" aria-hidden className="ill-stat-ring">
                    <circle cx="50" cy="50" r="46" />
                    <circle cx="50" cy="50" r="38" />
                    <circle cx="50" cy="50" r="30" />
                  </svg>
                  <div className="relative text-center">
                    <div className="font-[family-name:var(--font-syne)] text-4xl font-bold">{s.value}</div>
                    <div className="mx-auto mt-1 max-w-[12ch] text-[11px] leading-tight text-white/60">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TIMELINE — impossible stack */}
        <section id="experience" data-section="experience" className="ill-section">
          <div className="ill-container">
            <p className="ill-kicker">02 / timeline</p>
            <h2 className="ill-h2">An impossible staircase.</h2>
            <div className="ill-stack-wrap mt-16">
              <div className="ill-stack">
                {experience.map((e) => (
                  <article key={e.id} className="ill-stack-card" onPointerMove={tilt} onPointerLeave={untilt}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-[family-name:var(--font-syne)] text-3xl font-bold">{e.org}</h3>
                      <span className="font-[family-name:var(--font-grotesk)] text-sm text-[#00d4c7]">{e.period}</span>
                    </div>
                    <p className="mt-1 text-[#ff5ca8]">{e.role}</p>
                    <p className="text-sm text-white/50">{e.orgFull}</p>
                    <ul className="mt-5 grid gap-2 md:grid-cols-2">
                      {e.points.map((p) => (
                        <li key={p} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-snug text-white/80">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PORTALS */}
        <section id="work" data-section="work" className="ill-section">
          <div className="ill-container">
            <p className="ill-kicker">03 / portals</p>
            <h2 className="ill-h2">Step through.</h2>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {projects.map((p) => (
                <Link
                  key={p.slug}
                  href={`/work/${p.slug}`}
                  className="ill-portal group"
                  style={{ ["--accent" as string]: p.accent.illusion }}
                  onPointerMove={tilt}
                  onPointerLeave={untilt}
                  onPointerEnter={() => sound?.hover()}
                  data-cursor="view"
                  data-cursor-label="ENTER"
                >
                  <div className="ill-portal-hole" aria-hidden>
                    <div className="ill-portal-rings">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <span key={i} style={{ ["--i" as string]: i }} />
                      ))}
                    </div>
                    <span className="ill-portal-code">{p.code}</span>
                  </div>
                  <div className="relative p-6" style={{ transform: "translateZ(40px)" }}>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--accent)]">{p.category}</p>
                    <h3 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold leading-tight">{p.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/65">{p.summary}</p>
                    <span className="mt-5 inline-block text-sm text-white/90 underline decoration-[var(--accent)] underline-offset-4">
                      Enter the portal →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* MATTER */}
        <section id="skills" data-section="skills" className="ill-section">
          <div className="ill-container">
            <p className="ill-kicker">04 / matter</p>
            <h2 className="ill-h2">Zero-gravity toolkit.</h2>
            <p className="mt-4 max-w-lg text-white/60">Every skill is a rigid body floating in a weightless chamber. Push them with your cursor; fling them across the room.</p>
            <PhysicsSkills className="ill-physics mt-10" pillClassName="ill-pill" gravity={{ x: 0, y: 0 }} height={520} />
            <div className="mt-10 grid gap-x-10 gap-y-4 md:grid-cols-3">
              {skills.map((g) => (
                <div key={g.group} className="border-t border-white/10 pt-3">
                  <p className="font-[family-name:var(--font-syne)] font-bold">{g.group}</p>
                  <p className="mt-1 text-sm text-white/55">{g.items.join(", ")}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RECURSION */}
        <section id="education" data-section="education" className="ill-section">
          <div className="ill-container grid items-center gap-16 lg:grid-cols-2">
            <div className="ill-droste" aria-hidden>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="ill-droste-frame" style={{ ["--i" as string]: i }} />
              ))}
              <span className="ill-droste-core">∞</span>
            </div>
            <div>
              <p className="ill-kicker">05 / recursion</p>
              <h2 className="ill-h2">Learning, nested.</h2>
              <ul className="mt-8 space-y-5">
                {education.map((e) => (
                  <li key={e.degree}>
                    <p className="font-[family-name:var(--font-syne)] text-xl font-bold">{e.degree}</p>
                    <p className="text-sm text-white/55">
                      {e.school} · {e.period} · {e.score}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-2">
                {certifications.map((c) => (
                  <span key={c.name} className="ill-cert">
                    {c.name} <em>— {c.issuer}</em>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SIGNAL */}
        <section id="contact" data-section="contact" className="ill-section min-h-[90svh] pb-40">
          <div className="ill-container text-center">
            <p className="ill-kicker">06 / signal</p>
            <h2 className="ill-h2">Break the fourth wall.</h2>
            <a
              href={`mailto:${profile.email}`}
              className="ill-email"
              onPointerMove={repel}
              onPointerLeave={unrepel}
              onClick={() => sound?.click()}
              aria-label={`Email ${profile.email}`}
            >
              {profile.email.split("").map((c, i) => (
                <span key={i} aria-hidden>
                  {c}
                </span>
              ))}
            </a>
            <div className="mt-10 flex justify-center gap-4">
              <Magnetic>
                <a href="/resume.pdf" download className="ill-btn">
                  Download résumé
                </a>
              </Magnetic>
            </div>
            <p className="mt-16 text-xs text-white/40">
              {profile.name} · {profile.location} · Alt + 1–4 to shift universes
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
