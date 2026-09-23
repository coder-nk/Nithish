"use client";
/**
 * Asset pipeline helpers for Blender exports.
 *
 * Drop Draco-compressed .glb files (with KTX2/Basis textures) into /public/models
 * and load them with `useCompressedGLTF("/models/thing.glb")` inside any Scene.
 * Decoders are self-hosted in /public/draco and /public/basis (copied on `npm install`).
 *
 * Suggested export pipeline:
 *   npx @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-compress ktx2
 */
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import type { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { WebGLRenderer } from "three";

let ktx2: KTX2Loader | null = null;
function getKTX2(gl: WebGLRenderer) {
  if (!ktx2) ktx2 = new KTX2Loader().setTranscoderPath("/basis/").detectSupport(gl);
  return ktx2;
}

export function useCompressedGLTF(path: string) {
  const gl = useThree((s) => s.gl);
  return useGLTF(path, "/draco/", true, (loader) => {
    (loader as unknown as GLTFLoader).setKTX2Loader(getKTX2(gl));
  });
}

export const preloadModel = (path: string) => useGLTF.preload(path, "/draco/");
