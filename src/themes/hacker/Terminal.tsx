"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, useDragControls } from "motion/react";
import { profile, skills, experience, projects, education, certifications } from "@/data/resume";
import { useTheme } from "@/components/core/ThemeProvider";
import { isThemeId, THEME_IDS } from "@/lib/themes";
import { sound } from "@/lib/audio";

type Line = { k: "in" | "out" | "err" | "ok"; t: string };

const banner: Line[] = [
  { k: "ok", t: `nk-shell v2.0 — connected as guest@${profile.initials.toLowerCase()}-portfolio` },
  { k: "out", t: "type `help` for commands. try `projects`, `open apacs`, `theme gta`." },
];

export function Terminal() {
  const [lines, setLines] = useState<Line[]>(banner);
  const [value, setValue] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const [min, setMin] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const constraints = useRef<HTMLDivElement>(null);
  const drag = useDragControls();
  const router = useRouter();
  const { requestTheme } = useTheme();

  useEffect(() => {
    body.current?.scrollTo({ top: body.current.scrollHeight });
  }, [lines]);

  const out = (...l: Line[]) => setLines((s) => [...s, ...l]);
  const o = (t: string): Line => ({ k: "out", t });

  const run = (raw: string) => {
    const cmd = raw.trim();
    out({ k: "in", t: cmd });
    if (!cmd) return;
    setHist((h) => [cmd, ...h].slice(0, 50));
    const [c, ...args] = cmd.split(/\s+/);
    const a = args.join(" ").toLowerCase();
    switch (c.toLowerCase()) {
      case "help":
        out(
          o("  whoami            who is this"),
          o("  about             executive summary"),
          o("  skills            installed packages"),
          o("  experience        git log of career"),
          o("  projects          ls ~/projects"),
          o("  open <project>    open a case study (apacs | tb-xray | school-erp)"),
          o("  education         cat ~/education"),
          o("  contact           establish contact"),
          o("  resume            download résumé (pdf)"),
          o(`  theme <name>      switch universe (${THEME_IDS.join(" | ")})`),
          o("  clear             clear the screen"),
        );
        break;
      case "whoami":
        out(o(`${profile.name} — ${profile.role}`), o(`${profile.tagline} · ${profile.location}`));
        break;
      case "about":
        out(o(profile.summary));
        break;
      case "skills":
        skills.forEach((g) => out(o(`[${g.group.padEnd(14)}] ${g.items.join(", ")}`)));
        break;
      case "experience":
      case "git":
        experience.forEach((e, i) => out({ k: "ok", t: `* ${i === 0 ? "(HEAD -> main) " : ""}${e.period} ${e.role} @ ${e.org}` }, ...e.points.slice(0, 3).map((p) => o(`|   ${p}`))));
        break;
      case "ls":
      case "projects":
        projects.forEach((p) => out(o(`drwxr-xr-x  nk  ${p.slug.padEnd(12)} ${p.title}`)));
        break;
      case "open":
      case "cd": {
        const p = projects.find((x) => x.slug === a || x.code.toLowerCase() === a);
        if (!p) out({ k: "err", t: `open: no such project: ${a || "(none)"}` });
        else {
          out({ k: "ok", t: `opening ${p.slug} …` });
          setTimeout(() => router.push(`/work/${p.slug}`), 400);
        }
        break;
      }
      case "education":
      case "cat":
        education.forEach((e) => out(o(`${e.period}  ${e.degree} — ${e.school} (${e.score})`)));
        certifications.forEach((c) => out({ k: "ok", t: `[cert] ${c.name} — ${c.issuer}` }));
        break;
      case "contact":
      case "mail":
        out({ k: "ok", t: `mail -> ${profile.email}` }, o("opening your mail client …"));
        setTimeout(() => (window.location.href = `mailto:${profile.email}`), 500);
        break;
      case "resume":
        out({ k: "ok", t: "downloading resume.pdf …" });
        window.open("/resume.pdf", "_blank");
        break;
      case "theme":
        if (isThemeId(a)) {
          out({ k: "ok", t: `switching universe -> ${a}` });
          setTimeout(() => requestTheme(a), 300);
        } else out({ k: "err", t: `theme: unknown universe '${a}'. options: ${THEME_IDS.join(", ")}` });
        break;
      case "clear":
        setLines([]);
        break;
      case "sudo":
        out({ k: "err", t: "guest is not in the sudoers file. This incident will be reported. (kidding)" });
        break;
      case "date":
        out(o(new Date().toString()));
        break;
      case "history":
        hist.forEach((h, i) => out(o(`${String(i + 1).padStart(4)}  ${h}`)));
        break;
      case "echo":
        out(o(args.join(" ")));
        break;
      case "exit":
        setMin(true);
        break;
      default:
        out({ k: "err", t: `${c}: command not found. try 'help'` });
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(value);
      setValue("");
      setHi(-1);
      sound?.click();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const n = Math.min(hist.length - 1, hi + 1);
      if (hist[n]) {
        setHi(n);
        setValue(hist[n]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const n = hi - 1;
      setHi(n);
      setValue(n >= 0 ? hist[n] : "");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const cmds = ["help", "whoami", "about", "skills", "experience", "projects", "open ", "education", "contact", "resume", "theme ", "clear"];
      const m = cmds.find((c) => c.startsWith(value));
      if (m) setValue(m);
    } else sound?.type();
  };

  return (
    <div ref={constraints} className="pointer-events-none absolute inset-0">
      <motion.div
        className="hk-term pointer-events-auto"
        drag
        dragListener={false}
        dragControls={drag}
        dragConstraints={constraints}
        dragMomentum={false}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0, height: min ? 38 : "auto" }}
        transition={{ duration: 0.4 }}
      >
        <div className="hk-term-bar" onPointerDown={(e) => drag.start(e)} data-cursor="grab" data-cursor-label="DRAG">
          <div className="flex gap-1.5" aria-hidden>
            <i className="bg-[#ff3b3b]" />
            <i className="bg-[#ffcc00]" />
            <i className="bg-[#00ff9c]" />
          </div>
          <span>guest@nk: ~ — nk-shell</span>
          <button onClick={() => setMin((m) => !m)} aria-label={min ? "Expand terminal" : "Minimise terminal"}>
            {min ? "▢" : "—"}
          </button>
        </div>
        {!min && (
          <div ref={body} className="hk-term-body" onClick={() => input.current?.focus()}>
            {lines.map((l, i) => (
              <div key={i} className={`hk-l-${l.k}`}>
                {l.k === "in" ? (
                  <>
                    <span className="text-[#ff3b3b]">guest</span>@<span className="text-[#62d6ff]">nk</span>:~$ {l.t}
                  </>
                ) : (
                  l.t
                )}
              </div>
            ))}
            <label className="flex items-center gap-2">
              <span className="shrink-0">
                <span className="text-[#ff3b3b]">guest</span>@<span className="text-[#62d6ff]">nk</span>:~$
              </span>
              <input
                ref={input}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKey}
                spellCheck={false}
                autoComplete="off"
                aria-label="Terminal command input"
                className="hk-term-input"
              />
            </label>
          </div>
        )}
      </motion.div>
    </div>
  );
}
