// Copies Draco + Basis (KTX2) decoders from three into /public so they are self-hosted.
import { cpSync, existsSync, mkdirSync } from "node:fs";
const pairs = [
  ["node_modules/three/examples/jsm/libs/draco/gltf", "public/draco"],
  ["node_modules/three/examples/jsm/libs/basis", "public/basis"],
];
for (const [from, to] of pairs) {
  if (!existsSync(from)) continue;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}
console.log("[decoders] draco + basis copied to /public");
