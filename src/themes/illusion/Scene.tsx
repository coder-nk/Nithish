"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, ChromaticAberration, DepthOfField, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import type { ChromaticAberrationEffect } from "postprocessing";
import { noiseGLSL } from "@/lib/glsl";
import { pointer, scroll } from "@/lib/signals";
import type { SceneProps } from "@/components/core/SceneHost";

/*
  THE IMPOSSIBLE ROOM
  · a raymarched, infinitely recursive corridor (domain repetition) that twists with scroll
  · a Penrose triangle that only "closes" from one viewpoint — move the mouse and it breaks
  · recursive nested cubes, and a liquid iridescent form that recoils from the cursor
*/

const u = {
  time: { value: 0 },
  scroll: { value: 0 },
  vel: { value: 0 },
  mouse: { value: new THREE.Vector2() },
  res: { value: new THREE.Vector2(1, 1) },
};

// ---------------------------------------------------------------- Raymarched infinite corridor
function Corridor({ steps }: { steps: number }) {
  const { size, viewport } = useThree();
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        depthWrite: false,
        depthTest: false,
        uniforms: { uTime: u.time, uScroll: u.scroll, uVel: u.vel, uMouse: u.mouse, uRes: u.res },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.); }`,
        fragmentShader: /* glsl */ `
          precision highp float;
          uniform float uTime, uScroll, uVel; uniform vec2 uMouse, uRes; varying vec2 vUv;
          #define STEPS ${steps}
          mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
          float sdBoxFrame(vec3 p, vec3 b, float e){
            p = abs(p)-b; vec3 q = abs(p+e)-e;
            return min(min(
              length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
              length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
              length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0));
          }
          float map(vec3 p, out float id){
            float tw = uScroll*3.14159 + sin(uTime*0.1)*0.3;
            p.xy *= rot(p.z*0.06*(0.5+uScroll) + tw);
            vec3 c = vec3(6.0);
            id = dot(floor((p + c*0.5)/c), vec3(1.0, 7.0, 13.0));
            vec3 q = mod(p + c*0.5, c) - c*0.5;
            // recursion: frames inside frames
            float d = sdBoxFrame(q, vec3(1.2), 0.06);
            q.xy *= rot(0.785); q.yz *= rot(0.615);
            d = min(d, sdBoxFrame(q, vec3(0.6), 0.04));
            d = min(d, sdBoxFrame(q*2.2, vec3(0.6), 0.05)/2.2);
            return d;
          }
          void main(){
            vec2 uv = (vUv - 0.5) * vec2(uRes.x/uRes.y, 1.0);
            // liquid lens distortion around the cursor
            vec2 m = uMouse * vec2(uRes.x/uRes.y, 1.0) * 0.5;
            float md = length(uv - m);
            uv += (uv - m) * 0.18 * exp(-md*md*14.0);
            vec3 ro = vec3(3.0, 3.0, uTime*1.2 + uScroll*40.0);
            vec3 rd = normalize(vec3(uv, 1.1 - uVel*0.004));
            rd.xy *= rot(uMouse.x*0.25);
            rd.yz *= rot(-uMouse.y*0.2);
            float t = 0.0, id = 0.0, glow = 0.0;
            for(int i=0;i<STEPS;i++){
              vec3 p = ro + rd*t;
              float d = map(p, id);
              glow += 0.012/(0.02 + d*d*40.0);
              if(d<0.002 || t>40.0) break;
              t += d*0.8;
            }
            float fog = exp(-t*0.11);
            vec3 pal = 0.5 + 0.5*cos(6.2831*(vec3(0.0,0.33,0.67) + id*0.07 + uTime*0.03 + t*0.02));
            vec3 col = pal * pal * fog * 0.42;
            col += glow * vec3(0.48,0.36,1.0) * 0.025;
            col = mix(vec3(0.027,0.024,0.05), col, 0.9);
            // radial vignette
            col *= 1.0 - dot(vUv-0.5, vUv-0.5)*1.4;
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [steps],
  );
  u.res.value.set(size.width, size.height);
  void viewport;
  return (
    <mesh frustumCulled={false} renderOrder={-10} material={mat}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

// ---------------------------------------------------------------- Penrose triangle
function Penrose() {
  const group = useRef<THREE.Group>(null);
  const { geo, mat } = useMemo(() => {
    const L = 5;
    const cubes: [number, number, number][] = [];
    for (let i = 0; i < L; i++) cubes.push([i, 0, 0]);
    for (let i = 1; i < L; i++) cubes.push([L - 1, i, 0]);
    for (let i = 1; i < L - 1; i++) cubes.push([L - 1, L - 1, i]);
    const box = new THREE.BoxGeometry(1, 1, 1);
    const geos = cubes.map(([x, y, z]) => box.clone().translate(x - (L - 1) / 2, y - (L - 1) / 2, z - (L - 1) / 2));
    // merge manually
    const merged = new THREE.BufferGeometry();
    const pos: number[] = [],
      nor: number[] = [];
    geos.forEach((g) => {
      const ng = g.toNonIndexed();
      pos.push(...(ng.getAttribute("position").array as Float32Array));
      nor.push(...(ng.getAttribute("normal").array as Float32Array));
    });
    merged.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    merged.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: u.time },
      vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vP; void main(){ vN = normal; vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.);} `,
      fragmentShader: /* glsl */ `
        uniform float uTime; varying vec3 vN; varying vec3 vP;
        void main(){
          vec3 n = abs(vN);
          vec3 a = vec3(0.49,0.36,1.0), b = vec3(1.0,0.36,0.66), c = vec3(0.0,0.83,0.78);
          vec3 col = a*n.x + b*n.y + c*n.z;
          col *= 0.55 + 0.45*step(0., dot(vN, vec3(1.)));
          // edge lines
          vec3 f = abs(fract(vP+0.5)-0.5);
          float e = smoothstep(0.47, 0.5, max(max(f.x*n.y+f.x*n.z, f.y*n.x+f.y*n.z), f.z*n.x+f.z*n.y));
          col = mix(col, vec3(1.), e*0.6);
          gl_FragColor = vec4(col*0.8, 1.);
        }`,
    });
    return { geo: merged, mat };
  }, []);
  // Align (1,1,1) with the view axis → the impossible closure appears.
  const base = useMemo(() => {
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), new THREE.Vector3(0, 0, 1));
    return q;
  }, []);
  const tmp = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    e.set(-pointer.y * 0.6 + scroll.progress * 2.2, pointer.x * 0.9, 0);
    tmp.setFromEuler(e).multiply(base);
    g.quaternion.slerp(tmp, 1 - Math.exp(-dt * 3));
    g.position.y = 0.6 + Math.sin(state.clock.elapsedTime * 0.6) * 0.15 - scroll.progress * 3;
  });
  return (
    <group ref={group} position={[2.6, 0.6, -2]} scale={0.34}>
      <mesh geometry={geo} material={mat} />
    </group>
  );
}

// ---------------------------------------------------------------- Recursive nested cubes
function Recursion({ depth }: { depth: number }) {
  const refs = useRef<THREE.LineSegments[]>([]);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((l, i) => {
      if (!l) return;
      l.rotation.x = t * 0.2 * (i % 2 ? 1 : -1) + i * 0.2 + scroll.progress * 3;
      l.rotation.y = t * 0.3 + i * 0.35;
    });
  });
  return (
    <group position={[-3.2, -1.1, -3]}>
      {Array.from({ length: depth }).map((_, i) => (
        <lineSegments
          key={i}
          ref={(n) => {
            if (n) refs.current[i] = n;
          }}
          geometry={edges}
          scale={2.4 * Math.pow(0.72, i)}
        >
          <lineBasicMaterial color={new THREE.Color().setHSL(0.72 + i * 0.05, 0.9, 0.7)} transparent opacity={0.9 - i * 0.06} />
        </lineSegments>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- Liquid form
function Liquid({ detail, scale = 1 }: { detail: number; scale?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: u.time, uMouse: u.mouse, uVel: u.vel },
        vertexShader: /* glsl */ `
          uniform float uTime, uVel; uniform vec2 uMouse; varying vec3 vN; varying vec3 vV; varying float vD;
          ${noiseGLSL}
          void main(){
            vec3 p = position;
            float n = snoise(p*1.4 + vec3(uTime*0.25)) * 0.28 + snoise(p*3.0 - uTime*0.4)*0.07;
            float pull = dot(normalize(p), normalize(vec3(uMouse, 0.6)));
            n += smoothstep(0.4, 1.0, pull) * -0.22;
            n += abs(uVel)*0.004*sin(p.y*10. + uTime*5.);
            p += normal * n;
            vD = n;
            vec4 mv = modelViewMatrix*vec4(p,1.);
            vV = -mv.xyz;
            vN = normalMatrix*normal;
            gl_Position = projectionMatrix*mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vD;
          void main(){
            vec3 n = normalize(vN); vec3 v = normalize(vV);
            float fr = pow(1. - max(dot(n,v),0.), 2.5);
            vec3 iri = 0.5 + 0.5*cos(6.2831*(vec3(0.,0.33,0.67) + fr*0.9 + vD*1.5 + uTime*0.05));
            vec3 col = mix(vec3(0.02,0.015,0.05), iri, 0.08 + fr*0.75);
            gl_FragColor = vec4(col, 1.);
          }`,
      }),
    [],
  );
  useFrame((state, dt) => {
    const m = ref.current;
    if (!m) return;
    m.rotation.y += dt * 0.15;
    m.position.x = THREE.MathUtils.damp(m.position.x, 0.2 + pointer.x * 0.4, 2, dt);
    m.position.y = THREE.MathUtils.damp(m.position.y, -0.2 + pointer.y * 0.3 + scroll.progress * 4, 2, dt);
  });
  return (
    <mesh ref={ref} position={[0.2, -0.2, -1]} scale={scale} material={mat}>
      <icosahedronGeometry args={[1.05, detail]} />
    </mesh>
  );
}

function Rig() {
  const { camera } = useThree();
  useFrame((state, dt) => {
    u.time.value = state.clock.elapsedTime;
    u.scroll.value = THREE.MathUtils.damp(u.scroll.value, scroll.progress, 2, dt);
    u.vel.value = THREE.MathUtils.damp(u.vel.value, scroll.velocity, 5, dt);
    u.mouse.value.x = THREE.MathUtils.damp(u.mouse.value.x, pointer.x, 3, dt);
    u.mouse.value.y = THREE.MathUtils.damp(u.mouse.value.y, pointer.y, 3, dt);
    // dolly-zoom (vertigo) driven by scroll velocity
    const cam = camera as THREE.PerspectiveCamera;
    const targetFov = 45 + Math.max(-15, Math.min(25, u.vel.value * 0.6));
    cam.fov = THREE.MathUtils.damp(cam.fov, targetFov, 4, dt);
    cam.position.z = 6 * Math.tan(THREE.MathUtils.degToRad(22.5)) / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    cam.position.x = THREE.MathUtils.damp(cam.position.x, pointer.x * 0.5, 2, dt);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, pointer.y * 0.3, 2, dt);
    cam.lookAt(0, 0, -1);
    cam.updateProjectionMatrix();
  });
  return null;
}

function Post({ tier }: { tier: number }) {
  const ca = useRef<ChromaticAberrationEffect>(null);
  const off = useMemo(() => new THREE.Vector2(0.001, 0.001), []);
  useFrame(() => {
    const v = 0.0012 + Math.min(0.02, Math.abs(u.vel.value) * 0.0006 + Math.hypot(pointer.vx, pointer.vy) * 0.00008);
    off.set(v, -v);
    if (ca.current) ca.current.offset = off;
  });
  if (tier === 0) return null;
  if (tier === 2)
    return (
      <EffectComposer multisampling={0}>
        <DepthOfField focusDistance={0.012} focalLength={0.03} bokehScale={3.2} />
        <Bloom mipmapBlur intensity={0.8} luminanceThreshold={0.4} radius={0.7} />
        <ChromaticAberration ref={ca} offset={off} radialModulation={false} modulationOffset={0} />
        <Noise opacity={0.05} blendFunction={BlendFunction.SOFT_LIGHT} />
      </EffectComposer>
    );
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur intensity={0.8} luminanceThreshold={0.4} radius={0.7} />
      <ChromaticAberration ref={ca} offset={off} radialModulation={false} modulationOffset={0} />
      <Noise opacity={0.05} blendFunction={BlendFunction.SOFT_LIGHT} />
    </EffectComposer>
  );
}

export default function IllusionScene({ tier, mobile }: SceneProps) {
  return (
    <>
      <color attach="background" args={["#07060d"]} />
      <Rig />
      <Corridor steps={tier === 2 ? 72 : tier === 1 ? 48 : 28} />
      <Liquid detail={tier === 2 ? 48 : mobile ? 12 : 24} scale={mobile ? 0.62 : 1} />
      <Penrose />
      <Recursion depth={tier === 0 ? 5 : 9} />
      <Post tier={tier} />
    </>
  );
}
