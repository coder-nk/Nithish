"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";
import { profile, stats, skills, experience, projects, education, certifications } from "@/data/resume";
import { PhysicsSkills } from "@/components/core/PhysicsSkills";
import { Terminal } from "./Terminal";
import { scroll, quality, whenLoaded } from "@/lib/signals";
import { sound } from "@/lib/audio";

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, useGSAP);

// --- compact block font for the ASCII hero -------------------------------------------------
const FONT: Record<string, string[]> = {
  N: ["█   █", "██  █", "█ █ █", "█  ██", "█   █"],
  I: ["█████", "  █  ", "  █  ", "  █  ", "█████"],
  T: ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
  H: ["█   █", "█   █", "█████", "█   █", "█   █"],
  S: [" ████", "█    ", " ███ ", "    █", "████ "],
  K: ["█   █", "█  █ ", "███  ", "█  █ ", "█   █"],
  U: ["█   █", "█   █", "█   █", "█   █", " ███ "],
  M: ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
  A: [" ███ ", "█   █", "█████", "█   █", "█   █"],
  R: ["████ ", "█   █", "████ ", "█  █ ", "█   █"],
  " ": ["  ", "  ", "  ", "  ", "  "],
};
const ascii = (word: string) =>
  [0, 1, 2, 3, 4].map((r) => word.split("").map((ch) => (FONT[ch] ?? FONT[" "])[r]).join(" ")).join("\n");

const services: [string, string, string][] = [
  ["22/tcp", "linux-admin", "Linux · Nginx"],
  ["80/tcp", "http-frontend", "React.js · Angular · HTML5 · CSS3"],
  ["443/tcp", "https-api", "REST APIs · Microservices · Node.js"],
  ["2379/tcp", "etcd", "ETCD cluster consensus"],
  ["5432/tcp", "postgresql", "PostgreSQL · Replication · Failover"],
  ["8008/tcp", "patroni", "Patroni HA orchestration"],
  ["8069/tcp", "odoo", "Odoo ERP · Python"],
  ["112/vrrp", "keepalived", "Keepalived virtual IP failover"],
  ["8080/tcp", "burp-proxy", "Burp Suite · AppScan · WebInspect · OWASP"],
];

/** Live system monitor — every number here is real, measured in your browser. */
function StatusBar() {
  const [m, setM] = useState({ fps: 0, heap: "", up: "00:00:00", pct: 0, time: "", res: "" });
  useEffect(() => {
    const t0 = performance.now();
    const id = window.setInterval(() => {
      const s = Math.floor((performance.now() - t0) / 1000);
      const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
      setM({
        fps: quality.fps,
        heap: mem ? `${(mem.usedJSHeapSize / 1048576).toFixed(0)}M` : "n/a",
        up: [s / 3600, (s / 60) % 60, s % 60].map((v) => String(Math.floor(v)).padStart(2, "0")).join(":"),
        pct: Math.round(scroll.progress * 100),
        time: new Date().toLocaleTimeString([], { hour12: false }),
        res: `${window.innerWidth}x${window.innerHeight}`,
      });
    }, 500);
    return () => clearInterval(id);
  }, []);
  const links = [
    ["top", "shell"],
    ["about", "whoami"],
    ["experience", "git-log"],
    ["work", "projects"],
    ["skills", "nmap"],
    ["contact", "contact"],
  ];
  return (
    <header className="hk-status">
      <span className="hk-status-session">[nk]</span>
      <nav aria-label="Primary" className="flex min-w-0 overflow-x-auto">
        {links.map(([id, l], i) => (
          <a key={id} href={`#${id}`} className="hk-status-win" onPointerEnter={() => sound?.hover()}>
            {i}:{l}
          </a>
        ))}
      </nav>
      <span className="ml-auto hidden gap-4 whitespace-nowrap lg:flex" aria-label="System monitor">
        <span>fps <b>{m.fps}</b></span>
        <span>heap <b>{m.heap}</b></span>
        <span>scroll <b>{String(m.pct).padStart(3, " ")}%</b></span>
        <span>up <b>{m.up}</b></span>
        <span>{m.res}</span>
        <span className="text-[#020604] bg-[#00ff9c] px-1.5">{m.time}</span>
      </span>
    </header>
  );
}

function Prompt({ cmd }: { cmd: string }) {
  return (
    <p className="hk-prompt">
      <span className="text-[#ff3b3b]">root@nk</span>:<span className="text-[#62d6ff]">~</span>#{" "}
      <span className="hk-typed" data-cmd={cmd}>
        {cmd}
      </span>
    </p>
  );
}

export default function HackerView() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const intro = () => {
        if (reduced) return;
        gsap
          .timeline()
          .from(".hk-ascii", { clipPath: "inset(0 100% 0 0)", duration: 1.1, ease: "steps(24)" })
          .to(".hk-hero-role", { duration: 1.2, scrambleText: { text: `${profile.role} // ${profile.tagline}`, chars: "01<>/#$%&*", speed: 0.5 } }, "-=0.4")
          .from(".hk-hero-meta > *", { opacity: 0, duration: 0.01, stagger: 0.12 }, "-=0.6");
      };
      const offIntro = whenLoaded(contextSafe!(intro));
      if (reduced) return offIntro;

      // each prompt "types" when it enters the viewport; its output block decrypts afterwards
      gsap.utils.toArray<HTMLElement>(".hk-block").forEach((block) => {
        const typed = block.querySelector<HTMLElement>(".hk-typed");
        const outEls = block.querySelectorAll<HTMLElement>(".hk-out");
        const tl = gsap.timeline({ scrollTrigger: { trigger: block, start: "top 80%" } });
        if (typed) {
          const text = typed.dataset.cmd || "";
          typed.textContent = "";
          tl.to(typed, { duration: text.length * 0.035, scrambleText: { text, chars: "_", speed: 1 }, ease: "none" });
        }
        tl.from(outEls, { opacity: 0, y: 6, duration: 0.25, stagger: 0.05 }, "+=0.05");
      });
      gsap.utils.toArray<HTMLElement>(".hk-decrypt").forEach((el) => {
        const text = el.textContent || "";
        gsap.to(el, {
          duration: 1,
          scrambleText: { text, chars: "!<>-_\\/[]{}—=+*^?#01", revealDelay: 0.2, speed: 0.6 },
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
      return offIntro;
    },
    { scope: root },
  );

  return (
    <div ref={root} className="hk">
      <StatusBar />
      {/* HERO */}
      <section id="top" data-section="hero" className="hk-hero">
        <div className="hk-container relative z-10 grid min-h-[100svh] items-center gap-10 pb-20 pt-24 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="hk-hero-meta mb-4 flex flex-wrap gap-x-5 text-xs text-[#00ff9c]/70">
              <span>[ SECURE CHANNEL ]</span>
              <span>LOC: {profile.location.toUpperCase()}</span>
              <span>CLEARANCE: PUBLIC</span>
            </p>
            <h1 className="sr-only">{profile.name}</h1>
            <pre className="hk-ascii hk-glitch" aria-hidden data-text={`${ascii("NITHISH")}\n\n${ascii("KUMAR")}`}>
              {ascii("NITHISH")}
              {"\n\n"}
              {ascii("KUMAR")}
            </pre>
            <p className="hk-hero-role mt-6 text-lg text-[#b6ffe0] md:text-xl">{profile.role} // {profile.tagline}</p>
            <div className="hk-hero-meta mt-8 flex flex-wrap gap-3">
              <a href="#work" className="hk-btn" onClick={() => sound?.click()}>
                ./projects --list
              </a>
              <a href="#contact" className="hk-btn hk-btn-alt" onClick={() => sound?.click()}>
                ./contact --secure
              </a>
            </div>
          </div>
          <div className="relative h-[440px]">
            <Terminal />
          </div>
        </div>
      </section>

      {/* WHOAMI */}
      <section id="about" data-section="about" className="hk-section">
        <div className="hk-container hk-block">
          <Prompt cmd="cat ~/about.md" />
          <div className="hk-panel hk-out mt-4">
            <p className="hk-decrypt leading-relaxed text-[#c8ffe6]">{profile.summary}</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="hk-panel hk-out">
                <p className="text-[11px] uppercase tracking-widest text-[#00ff9c]/60">metric</p>
                <p className="font-[family-name:var(--font-vt)] text-5xl leading-none text-[#00ff9c]">{s.value}</p>
                <p className="mt-2 text-xs text-[#c8ffe6]/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GIT LOG */}
      <section id="experience" data-section="experience" className="hk-section">
        <div className="hk-container hk-block">
          <Prompt cmd="git log --graph --oneline career" />
          <div className="hk-panel hk-out mt-4 overflow-x-auto">
            {experience.map((e, i) => (
              <div key={e.id} className="hk-commit">
                <div className="hk-graph" aria-hidden>
                  <span>*</span>
                  <span className="hk-graph-line" />
                </div>
                <div className="pb-8">
                  <p>
                    <span className="text-[#ffcc00]">{(0xa1f3 + i * 4099).toString(16)}</span>{" "}
                    {i === 0 && <span className="text-[#62d6ff]">(HEAD -&gt; main) </span>}
                    <span className="font-bold text-white">{e.role}</span> <span className="text-[#00ff9c]">@ {e.org}</span>
                  </p>
                  <p className="text-xs text-[#c8ffe6]/50">
                    Date: {e.period} · {e.orgFull}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {e.points.map((p) => (
                      <li key={p} className="hk-out text-sm text-[#c8ffe6]/85">
                        <span className="text-[#00ff9c]">+ </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="work" data-section="work" className="hk-section">
        <div className="hk-container hk-block">
          <Prompt cmd="ls -la ~/projects" />
          <div className="hk-panel hk-out mt-4 overflow-x-auto p-0">
            <table className="hk-table">
              <thead>
                <tr>
                  <th>perm</th>
                  <th>name</th>
                  <th className="hidden md:table-cell">stack</th>
                  <th>domain</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.slug} onPointerEnter={() => sound?.hover()}>
                    <td className="text-[#00ff9c]/60">drwxr-xr-x</td>
                    <td>
                      <Link href={`/work/${p.slug}`} className="hk-row-link">
                        <span className="font-bold text-white">{p.slug}/</span>
                        <span className="block text-xs text-[#c8ffe6]/60">{p.title}</span>
                      </Link>
                    </td>
                    <td className="hidden text-xs text-[#c8ffe6]/70 md:table-cell">{p.stack.join(" · ")}</td>
                    <td className="text-xs text-[#62d6ff]">{p.category}</td>
                    <td className="text-right">
                      <Link href={`/work/${p.slug}`} className="hk-btn !py-1 text-xs" aria-label={`Open ${p.title}`}>
                        open ↵
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.slug} href={`/work/${p.slug}`} className="hk-panel hk-card hk-out group" data-cursor="view" data-cursor-label="EXEC">
                <p className="text-xs text-[#00ff9c]/60">$ file {p.slug}</p>
                <p className="hk-glitch-hover mt-2 font-[family-name:var(--font-vt)] text-4xl text-[#00ff9c]" data-text={p.code}>
                  {p.code}
                </p>
                <p className="mt-2 text-sm text-[#c8ffe6]/80">{p.summary}</p>
                <p className="mt-4 text-xs text-[#62d6ff] group-hover:underline">→ cat case-study.md</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NMAP */}
      <section id="skills" data-section="skills" className="hk-section">
        <div className="hk-container hk-block">
          <Prompt cmd="nmap -sV --top-ports nithish.local" />
          <div className="hk-panel hk-out mt-4 overflow-x-auto text-sm">
            <p className="text-[#c8ffe6]/60">Starting Nmap-style skill scan … host is up (0.0012s latency).</p>
            <table className="hk-table mt-3">
              <thead>
                <tr>
                  <th>PORT</th>
                  <th>STATE</th>
                  <th>SERVICE</th>
                  <th>VERSION / DETAIL</th>
                </tr>
              </thead>
              <tbody>
                {services.map(([port, svc, v]) => (
                  <tr key={port} className="hk-out">
                    <td>{port}</td>
                    <td className="text-[#00ff9c]">open</td>
                    <td className="text-white">{svc}</td>
                    <td className="text-[#c8ffe6]/70">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[#c8ffe6]/60">
              Languages detected: {skills[0].items.join(", ")} · Practices: {skills[skills.length - 1].items.join(", ")}
            </p>
          </div>
          <PhysicsSkills className="hk-physics mt-6" pillClassName="hk-pill" gravity={{ x: 0, y: 24 }} height={420} hint="// packets: drag to reroute" />
        </div>
      </section>

      {/* CERTS */}
      <section id="education" data-section="education" className="hk-section">
        <div className="hk-container hk-block">
          <Prompt cmd="cat ~/education ~/certifications" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="hk-panel hk-out">
              {education.map((e) => (
                <p key={e.degree} className="mb-3 text-sm">
                  <span className="text-[#ffcc00]">{e.period}</span> <span className="text-white">{e.degree}</span>
                  <br />
                  <span className="text-[#c8ffe6]/60">
                    └─ {e.school} [{e.score}]
                  </span>
                </p>
              ))}
            </div>
            <div className="hk-panel hk-out">
              {certifications.map((c) => (
                <p key={c.name} className="mb-2 text-sm">
                  <span className="text-[#00ff9c]">[ OK ]</span> <span className="text-white">{c.name}</span>{" "}
                  <span className="text-[#c8ffe6]/60">— {c.issuer}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" data-section="contact" className="hk-section pb-40">
        <div className="hk-container hk-block">
          <Prompt cmd="./contact.sh --encrypt" />
          <div className="hk-panel hk-out mt-4">
            <p className="text-[#c8ffe6]/70">&gt; handshake complete. channel open.</p>
            <p className="hk-glitch mt-4 font-[family-name:var(--font-vt)] text-[clamp(2.4rem,7vw,5.5rem)] leading-none text-[#00ff9c]" data-text="GET IN TOUCH_">
              GET IN TOUCH_
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`mailto:${profile.email}`} className="hk-btn" onClick={() => sound?.click()}>
                mail -s &quot;hello&quot; {profile.email}
              </a>
              {profile.showPhone && (
                <a href={`tel:${profile.phone}`} className="hk-btn hk-btn-alt">
                  dial {profile.phone}
                </a>
              )}
              <a href="/resume.pdf" download className="hk-btn hk-btn-alt">
                wget resume.pdf
              </a>
            </div>
          </div>
          <p className="mt-10 text-xs text-[#00ff9c]/40">
            {profile.name} · {profile.location} · hint: type `theme pro` in the terminal · Alt+1–4
          </p>
        </div>
      </section>
    </div>
  );
}
