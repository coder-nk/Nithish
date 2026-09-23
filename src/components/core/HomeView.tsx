"use client";

import { useTheme } from "./ThemeProvider";
import dynamic from "next/dynamic";
import ProView from "@/themes/pro/View";

// Non-default universes are code-split: visitors only download the one they pick.
const GtaView = dynamic(() => import("@/themes/gta/View"), { ssr: false });
const IllusionView = dynamic(() => import("@/themes/illusion/View"), { ssr: false });
const HackerView = dynamic(() => import("@/themes/hacker/View"), { ssr: false });

/**
 * The same content, four universes. Each View is a complete presentation layer
 * (navigation, hero, sections, micro-interactions) over the shared resume data.
 * The Pro view is what gets server-rendered, so crawlers and no-JS visitors
 * always receive the full, semantic résumé.
 */
export function HomeView() {
  const { theme, booted } = useTheme();
  const t = booted ? theme : "pro";
  return (
    <div key={t} className="universe" data-universe={t}>
      {t === "gta" && <GtaView />}
      {t === "illusion" && <IllusionView />}
      {t === "hacker" && <HackerView />}
      {t === "pro" && <ProView />}
    </div>
  );
}
