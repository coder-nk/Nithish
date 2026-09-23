# Nithishkumar S — Multiverse Portfolio

A four-universe developer portfolio built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, React Three Fiber, GSAP and Lenis. It uses one set of résumé content with four complete presentation layers, and you can switch between them from inside the site.

| Universe | Look & feel | 3D world | Scroll | Cursor | Transition |
|---|---|---|---|---|---|
| **GTA** (Neon Stories) | Anton / Barlow Condensed, sunset gradients, poster cards, missions, trophies | Procedural neon coastline: shader sky and sun, displaced ocean, instanced skyline with lit windows, swaying instanced palm silhouettes, highway light trails. Scrolling moves the scene from sunset to night | Punchy (lerp 0.14), pinned horizontal "Jobs" reel, velocity speed-lines | Neon crosshair | Skewed sunset slabs + stars |
| **Illusion** | Syne variable font with letters that morph as the cursor approaches, recursive echoes, mirrored reflection | Raymarched corridor of nested frames that repeats forever, a Penrose triangle that only closes from one viewpoint, recursive cubes, an iridescent liquid form, DOF | Floaty (lerp 0.045), GSAP Observer skews the world by wheel velocity, dolly-zoom driven by scroll speed | Difference-blend liquid blob | Gooey SVG portal opening from the click point |
| **Hacker** | JetBrains Mono / VT323, tmux status bar with live browser metrics, ASCII hero, git-log timeline, nmap-style skills | Digital rain generated in the shader, network globe with packets travelling along arcs, HUD rings, scanlines, glitch | Close to native scrolling (lerp 0.35) | Blinking block caret + XY readout | Glitch tear + "ACCESS GRANTED" |
| **Professional** | Instrument Serif / Inter, editorial grid, KPI counters, GSAP Flip grid↔list case studies | "Strata": five precision layers that separate into an exploded view as you scroll, lit by procedural studio Lightformers | Smooth, elegant (lerp 0.085) | Dot + lagging ring | Architectural curtain + monogram |

## Run it

```bash
npm install        # also copies the Draco + Basis decoders into /public
npm run dev        # http://localhost:3000
npm run build && npm start
```

To build a static site for CDN hosting, run `npm run build:export`. It writes the site to `out/`.

## Features

- **Theme switcher**: a dock at the bottom of the screen in every universe. It's a keyboard radiogroup (arrow keys), and **Alt + 1–4** switches from anywhere. In the Hacker terminal you can also type `theme gta`.
- **Persistence**: the chosen theme is saved in `localStorage` and a cookie. An inline `<head>` script applies it before the first paint, so the wrong theme never flashes. The theme also carries over to the case-study pages (`/work/[slug]`).
- **Context-preserving switch**: the section you're reading is remembered, and the new universe opens on the same section.
- **Loading**: each universe has its own server-rendered loader, and CSS picks the right one before JavaScript runs.
- **Sound**: built entirely with the Web Audio API, so there are no audio files to download. Each universe has its own ambient bed (synthwave chords/arp + ocean, a shimmering drone, data blips, a warm pad) plus hover, click, typing and transition sounds. Sound is off until the visitor turns it on.
- **Physics**: Rapier 2D. The skills are rigid bodies you can drag and throw. GTA uses normal gravity, Illusion is zero-g and Hacker drops them like rain. The WASM engine only loads when that section scrolls into view.
- **Interactive terminal** (Hacker): `help`, `whoami`, `projects`, `open apacs`, `experience`, `skills`, `contact`, `resume`, `theme <name>`. It has command history (↑/↓) and Tab completion, and you can drag the window.
- **Performance**:
  - Each universe's view and WebGL scene is code-split, and the other universes are prefetched when the browser is idle.
  - Quality has three tiers (dpr, post-processing, instance and segment counts, raymarch steps), managed by drei's `PerformanceMonitor` and `AdaptiveDpr`.
  - Rendering pauses in background tabs.
  - The site checks WebGL support and falls back to CSS backgrounds when it's missing.
  - A **2D/3D** toggle gives a lite mode.
  - Add `?perf` to the URL to see an FPS/heap meter.
- **Accessibility**:
  - Skip link and semantic landmarks.
  - Visible focus styles.
  - `prefers-reduced-motion` turns off smooth scrolling, the intros, the physics and the WebGL scene.
  - The custom cursor is off on touch devices.
  - The Pro view is server-rendered, so crawlers and visitors without JavaScript get the full résumé.

## Liquid glass layer

Every universe also has a liquid-glass material (`src/components/core/LiquidGlass.tsx` + the *LIQUID GLASS* block in `globals.css`). Each universe tints the glass with its own colours: neon pink, iridescent, phosphor green or frosted white. It shows up most on mobile:

- **Dock**: a floating glass pill that respects the phone's safe areas. A glass lens slides to the active universe and stretches while it moves.
- **Mobile menu** (☰ in the dock): a glass sheet that opens upward from the dock. It has section links in each universe's own wording, plus Email, Résumé and Close. It supports focus trapping, Escape and tapping outside to close.
- **Top bars** become floating glass bars. **Cards, panels, the terminal, the physics playground and case-study blocks** become glass too, so the 3D scene shows through blurred.
- **Light**:
  - A light slowly travels around each glass edge.
  - The shine follows your finger or pointer.
  - On Android it also follows how the phone is tilted.
- **Refraction**: Chromium browsers bend the background through an SVG displacement filter. Other browsers get blur and saturation only. Browsers with no blur support get a solid tint, and so does anyone with *reduce transparency* turned on.

## Editing content

All content lives in `src/data/resume.ts`, and every universe reads from it. The phone number is hidden by default. Set `showPhone: true` to show it. The downloadable résumé is `public/resume.pdf`.

## 3D assets (Blender → web)

All current 3D is procedural (shaders and instancing), so the site ships with no model or texture files. For Blender models:

1. Export `.glb` and optimise it with `npx @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-compress ktx2`.
2. Put the file in `public/models/`.
3. Load it with `useCompressedGLTF()` from `src/lib/assets.ts`. Draco and KTX2 decoding are already configured with self-hosted decoders.

## Not included (yet)

- Lottie and Rive animations. No `.json` or `.riv` files are bundled. If you add some, install `lottie-react` or `@rive-app/react-canvas`.
- Howler.js. It isn't needed because every sound is synthesised live.
- True per-object motion blur. The site gets a similar effect from velocity-driven chromatic aberration, speed-lines and a dolly-zoom.

## Structure

```
src/
  app/                 layout (fonts, boot script), home, /work/[slug]
  data/resume.ts       single content source
  lib/                 themes, audio engine, signals, capabilities, GLSL, prefetch, assets
  components/core/     ThemeProvider, Switcher, Transition, Loader, Cursor, SmoothScroll,
                       SceneHost (R3F canvas), PhysicsSkills, Magnetic, FpsMeter
  components/work/     CaseStudy (one structure, four skins)
  themes/{gta,illusion,hacker,pro}/   View.tsx (DOM universe) + Scene.tsx (WebGL universe)
```

All visuals are original. The GTA universe is inspired by the neon/synthwave look in general and uses no Rockstar logos, fonts, characters or artwork.
