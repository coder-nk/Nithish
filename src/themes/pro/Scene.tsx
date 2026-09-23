"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox, Float } from "@react-three/drei";
import { pointer, scroll } from "@/lib/signals";
import type { SceneProps } from "@/components/core/SceneHost";

/*
  STRATA — a restrained architectural sculpture.
  Five precision-machined layers (client · gateway · services · data · infra)
  that separate into an exploded "system view" as you scroll.
  Studio lighting is procedural (Lightformers) — no HDR download required.
*/

const LAYERS = [
  { color: "#f7f5f0", metal: 0, rough: 0.35, h: 0.16 },
  { color: "#1f3a5f", metal: 0.2, rough: 0.3, h: 0.12 },
  { color: "#f7f5f0", metal: 0, rough: 0.35, h: 0.16 },
  { color: "#b08d57", metal: 1, rough: 0.28, h: 0.06 },
  { color: "#14213d", metal: 0.1, rough: 0.4, h: 0.22 },
];

function Strata({ mobile }: { mobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const layers = useRef<THREE.Mesh[]>([]);
  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const p = scroll.progress;
    const explode = Math.min(1, p * 6);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, -0.6 + pointer.x * 0.25 + p * 1.2, 2, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.42 - pointer.y * 0.12, 2, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, (mobile ? -1.7 : 0.1) + p * 14, 2.5, dt);
    layers.current.forEach((m, i) => {
      if (!m) return;
      const base = (i - 2) * 0.3;
      m.position.y = THREE.MathUtils.damp(m.position.y, base * (1 + explode * 1.6), 3, dt);
      m.rotation.y = THREE.MathUtils.damp(m.rotation.y, (i - 2) * 0.12 * explode + Math.sin(state.clock.elapsedTime * 0.3 + i) * 0.02, 3, dt);
    });
  });
  return (
    <group ref={group} position={[mobile ? 0.8 : 2.5, 0.1, 0]} scale={mobile ? 0.5 : 0.74}>
      {LAYERS.map((l, i) => (
        <RoundedBox
          key={i}
          ref={(n: THREE.Mesh | null) => {
            if (n) layers.current[i] = n;
          }}
          args={[2.2, l.h, 2.2]}
          radius={Math.min(0.05, l.h / 2.2)}
          smoothness={4}
          castShadow
        >
          <meshPhysicalMaterial color={l.color} metalness={l.metal} roughness={l.rough} clearcoat={0.6} clearcoatRoughness={0.25} envMapIntensity={1.1} />
        </RoundedBox>
      ))}
    </group>
  );
}

/** Cheap analytic soft shadow (radial falloff) — no shadow-map render pass. */
function SoftShadow({ x }: { x: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const k = Math.max(0.001, 1 - Math.min(1, scroll.progress * 6));
    m.scale.setScalar(k);
    (m.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 0.22 * k;
  });
  return (
    <mesh ref={ref} position={[x, -1.55, 0]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[5, 5]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={{ uOpacity: { value: 0.22 } }}
        vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);} `}
        fragmentShader={`uniform float uOpacity; varying vec2 vUv; void main(){ float d=length(vUv-0.5)*2.; float a=smoothstep(1.,0.,d); gl_FragColor=vec4(0.08,0.13,0.24,a*a*uOpacity);} `}
      />
    </mesh>
  );
}

export default function ProScene({ tier, mobile }: SceneProps) {
  return (
    <>
      <color attach="background" args={["#f5f3ee"]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 6, 4]} intensity={1.1} />
      <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.25}>
        <Strata mobile={mobile} />
      </Float>
      {!mobile && <SoftShadow x={2.5} />}
      <Environment resolution={tier === 2 ? 256 : 128} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, -2]} scale={[10, 2, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.4} position={[-5, 1, 2]} scale={[2, 6, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.2} position={[5, 1, 1]} scale={[2, 6, 1]} rotation-y={-Math.PI / 2} color="#fff4e0" />
        <Lightformer form="ring" intensity={0.8} position={[0, 0, 6]} scale={3} />
      </Environment>
    </>
  );
}
