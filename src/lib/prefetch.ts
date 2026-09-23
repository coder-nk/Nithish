import type { ThemeId } from "./themes";

// Warm the code-split chunks for a universe (view + WebGL scene) so the
// transition never reveals an empty stage.
const loaders: Record<ThemeId, () => Promise<unknown>> = {
  gta: () => Promise.all([import("@/themes/gta/View"), import("@/themes/gta/Scene")]),
  illusion: () => Promise.all([import("@/themes/illusion/View"), import("@/themes/illusion/Scene")]),
  hacker: () => Promise.all([import("@/themes/hacker/View"), import("@/themes/hacker/Scene")]),
  pro: () => Promise.all([import("@/themes/pro/View"), import("@/themes/pro/Scene")]),
};

const cache = new Map<ThemeId, Promise<unknown>>();

export function prefetchTheme(id: ThemeId) {
  if (!cache.has(id)) cache.set(id, loaders[id]().catch(() => cache.delete(id)));
  return cache.get(id)!;
}
