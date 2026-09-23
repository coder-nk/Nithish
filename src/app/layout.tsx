import type { Metadata, Viewport } from "next";
// Self-hosted fonts (no runtime calls to third-party font CDNs)
import "@fontsource/anton/400.css";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource-variable/syne/index.css";
import "@fontsource-variable/space-grotesk/index.css";
import "@fontsource-variable/jetbrains-mono/index.css";
import "@fontsource/vt323/400.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/inter/index.css";
import "./globals.css";

import { themeBootScript } from "@/lib/themes";
import { profile } from "@/data/resume";
import { ThemeProvider } from "@/components/core/ThemeProvider";
import { Shell } from "@/components/core/Shell";

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role}`,
  description: profile.shortSummary,
  keywords: ["Full Stack Developer", "Python", "PostgreSQL", "Odoo ERP", "Node.js", "React", "Patroni", "Chennai"],
  authors: [{ name: profile.name }],
  openGraph: {
    title: `${profile.name} — ${profile.role}`,
    description: profile.shortSummary,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0b10",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="pro" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider>
          <Shell>{children}</Shell>
        </ThemeProvider>
      </body>
    </html>
  );
}
