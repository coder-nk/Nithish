"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import type { ChromaticAberrationEffect } from "postprocessing";
import { noiseGLSL } from "@/lib/glsl";
import { pointer, scroll } from "@/lib/signals";
import type { SceneProps } from "@/components/core/SceneHost";

/*
  NEON COAST — an original synth-noir coastline at dusk.
  Scroll = time of day: the sun sinks, the sky deepens and the city lights up.
  Everything is procedural: no external models, textures or brand assets.
*/

const shared = { dusk: { value: 0 }, time: { value: 0 } };

// ---------------------------------------------------------------- Sky
function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        depthWrite: false,
        uniforms: { uTime: shared.time, uDusk: shared.dusk },
        vertexShader: /* glsl */ `
          varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uDusk; varying vec3 vPos;
          ${noiseGLSL}
          void main(){
            float h = clamp((vPos.y + 10.) / 70., 0., 1.);
            vec3 horizon = mix(vec3(1.0,0.45,0.2), vec3(0.95,0.18,0.45), uDusk);
            vec3 mid     = mix(vec3(0.93,0.2,0.52), vec3(0.42,0.07,0.55), uDusk);
            vec3 top     = mix(vec3(0.24,0.06,0.42), vec3(0.03,0.01,0.1), uDusk);
            vec3 col = mix(horizon, mid, smoothstep(0.0, 0.28, h));
            col = mix(col, top, smoothstep(0.22, 0.85, h));
            // drifting cloud bands
            float n = snoise(vec3(vPos.x*0.02 + uTime*0.01, vPos.y*0.09, uTime*0.02));
            float band = smoothstep(0.35, 0.9, n) * smoothstep(0.05, 0.25, h) * (1. - smoothstep(0.35, 0.6, h));
            col = mix(col, col*0.55 + vec3(0.25,0.02,0.2), band*0.6);
            // stars
            vec2 g = floor(vPos.xy*1.4);
            float s = hash21(g);
            float tw = 0.5 + 0.5*sin(uTime*2. + s*40.);
            col += vec3(step(0.996, s)) * tw * smoothstep(0.35, 0.9, h) * (0.3 + uDusk);
            gl_FragColor = vec4(col, 1.);
          }`,
      }),
    [],
  );
  return (
    <mesh position={[0, 20, -90]} material={mat}>
      <planeGeometry args={[420, 140, 1, 1]} />
    </mesh>
  );
}

// ---------------------------------------------------------------- Sun
function Sun() {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: shared.time, uDusk: shared.dusk },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);} `,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uDusk; varying vec2 vUv;
          void main(){
            vec2 p = (vUv*2.-1.)*1.7;
            float d = length(p);
            float disc = smoothstep(1.0, 0.985, d);
            vec3 col = mix(vec3(1.0,0.93,0.35), vec3(1.0,0.18,0.55), smoothstep(0.7,-0.8,p.y));
            // retro slat cut-outs that thicken toward the bottom
            float y = p.y + uTime*0.04;
            float stripes = step(0.5 + 0.45*smoothstep(0.2,-1.,p.y), fract(y*7.));
            float cut = p.y < 0.15 ? stripes : 1.0;
            float glow = exp(-d*2.2)*0.8*(1. - smoothstep(1.2, 1.7, d));
            float a = disc*cut + glow*(1.-disc)*0.8;
            gl_FragColor = vec4(col*(1.4 - uDusk*0.3) + glow*vec3(1.,0.3,0.5), a);
          }`,
      }),
    [],
  );
  useFrame(() => {
    if (ref.current) ref.current.position.y = 11 - shared.dusk.value * 12;
  });
  return (
    <mesh ref={ref} position={[0, 11, -85]} material={mat}>
      <planeGeometry args={[58, 58]} />
    </mesh>
  );
}

// ---------------------------------------------------------------- Ocean
function Ocean({ seg }: { seg: number }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: shared.time, uDusk: shared.dusk },
        vertexShader: /* glsl */ `
          uniform float uTime; varying vec3 vW; varying float vH;
          ${noiseGLSL}
          void main(){
            vec3 p = position;
            float h = snoise(vec3(p.x*0.08, p.y*0.12 - uTime*0.25, uTime*0.15))*0.35
                    + snoise(vec3(p.x*0.35, p.y*0.4 - uTime*0.6, 1.))*0.08;
            p.z += h;
            vH = h;
            vec4 w = modelMatrix*vec4(p,1.);
            vW = w.xyz;
            gl_Position = projectionMatrix*viewMatrix*w;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uDusk; varying vec3 vW; varying float vH;
          void main(){
            float dist = clamp(-vW.z/90., 0., 1.);
            vec3 deep = mix(vec3(0.05,0.02,0.14), vec3(0.01,0.0,0.05), uDusk);
            vec3 hor  = mix(vec3(0.95,0.32,0.4), vec3(0.55,0.06,0.45), uDusk);
            vec3 col = mix(deep, hor, pow(dist, 2.2));
            // sun glitter column
            float column = exp(-abs(vW.x)*(0.18 + (1.-dist)*0.25)) * smoothstep(0.1, 0.35, vH+0.2);
            col += vec3(1.0,0.55,0.4) * column * (1.2 - uDusk*0.6) * (0.6 + 0.4*sin(vW.z*3. + uTime*4.));
            // neon grid shimmer on the water
            vec2 g = abs(fract(vec2(vW.x*0.25, vW.z*0.25 + uTime*0.3)) - 0.5);
            float line = smoothstep(0.03, 0.0, min(g.x, g.y)) * (1.-dist) * 0.35;
            col += vec3(1.0,0.2,0.6)*line*uDusk;
            col += vec3(0.0,0.9,1.0)*line*(1.-uDusk)*0.4;
            gl_FragColor = vec4(col, 1.);
          }`,
      }),
    [],
  );
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, -40]} material={mat}>
      <planeGeometry args={[260, 110, seg, seg]} />
    </mesh>
  );
}

// ---------------------------------------------------------------- Skyline
function Skyline({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { geo, mat, matrices } = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0);
    const seeds = new Float32Array(count);
    const matrices: THREE.Matrix4[] = [];
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * (9 + Math.pow(Math.random(), 0.8) * 70);
      const z = -58 - Math.random() * 12;
      const w = 1.5 + Math.random() * 3.5;
      const near = 1 - Math.min(1, Math.abs(x) / 80);
      const h = 2 + Math.random() * 10 + near * Math.random() * 14;
      m.compose(new THREE.Vector3(x, -0.2, z), new THREE.Quaternion(), new THREE.Vector3(w, h, w));
      matrices.push(m.clone());
      seeds[i] = Math.random();
    }
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: shared.time, uDusk: shared.dusk },
      vertexShader: /* glsl */ `
        attribute float aSeed; varying vec2 vUv; varying float vSeed; varying vec3 vScale; varying float vY;
        void main(){
          vUv = uv; vSeed = aSeed;
          vScale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), 1.);
          vY = position.y;
          gl_Position = projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uDusk; varying vec2 vUv; varying float vSeed; varying vec3 vScale; varying float vY;
        float h(vec2 p){ p=fract(p*vec2(233.34,851.73)); p+=dot(p,p+23.45); return fract(p.x*p.y); }
        void main(){
          vec2 cell = floor(vUv*vec2(vScale.x*2.2, vScale.y*2.6));
          vec2 f = fract(vUv*vec2(vScale.x*2.2, vScale.y*2.6));
          float win = step(0.25,f.x)*step(f.x,0.75)*step(0.3,f.y)*step(f.y,0.75);
          float on = step(0.62 - uDusk*0.3, h(cell + vSeed*17.));
          float flick = 0.75 + 0.25*sin(uTime*(1.+vSeed*3.) + cell.x*3.);
          vec3 wcol = mix(vec3(1.,0.75,0.45), vec3(0.3,0.9,1.), step(0.7,h(cell+3.1)));
          wcol = mix(wcol, vec3(1.,0.2,0.65), step(0.85,h(cell+7.7)));
          vec3 base = mix(vec3(0.09,0.02,0.14), vec3(0.03,0.0,0.06), uDusk);
          vec3 col = base + wcol*win*on*flick*(0.35 + uDusk*1.4);
          // neon rooftop trims
          col += vec3(1.,0.15,0.6)*smoothstep(0.985,1.,vY)*step(0.6,vSeed)*2.;
          gl_FragColor = vec4(col,1.);
        }`,
    });
    return { geo, mat, matrices };
  }, [count]);
  return (
    <instancedMesh
      ref={(n) => {
        (ref as React.MutableRefObject<THREE.InstancedMesh | null>).current = n;
        if (n) {
          matrices.forEach((mm, i) => n.setMatrixAt(i, mm));
          n.instanceMatrix.needsUpdate = true;
        }
      }}
      args={[geo, mat, count]}
      frustumCulled={false}
    />
  );
}

// ---------------------------------------------------------------- Palms (instanced silhouettes)
function palmGeometry() {
  const shapes: THREE.Shape[] = [];
  const trunk = new THREE.Shape();
  const N = 14;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push(new THREE.Vector2(Math.sin(t * 1.4) * 0.9, t * 6));
  }
  const left = pts.map((p, i) => new THREE.Vector2(p.x - (0.22 - (i / N) * 0.11), p.y));
  const right = pts.map((p, i) => new THREE.Vector2(p.x + (0.22 - (i / N) * 0.11), p.y)).reverse();
  trunk.setFromPoints([...left, ...right]);
  shapes.push(trunk);
  const top = pts[N];
  const fronds = 9;
  for (let k = 0; k < fronds; k++) {
    const a = (k / fronds) * Math.PI * 2 + 0.3;
    const dir = new THREE.Vector2(Math.cos(a), Math.sin(a) * 0.45 + 0.25).normalize();
    const L = 2.2 + ((k * 37) % 10) / 10;
    const droop = 1.2 + (dir.y < 0 ? 0.6 : 0);
    const M = 12;
    const up: THREE.Vector2[] = [],
      dn: THREE.Vector2[] = [];
    for (let i = 0; i <= M; i++) {
      const t = i / M;
      const c = new THREE.Vector2(top.x + dir.x * t * L, top.y + dir.y * t * L - droop * t * t);
      const tan = new THREE.Vector2(dir.x, dir.y - 2 * droop * t / L).normalize();
      const nrm = new THREE.Vector2(-tan.y, tan.x);
      const w = Math.sin(Math.PI * Math.pow(t, 0.7)) * 0.32 * (1 - t * 0.3);
      // serrated edge for leaflets
      const serr = 1 + (i % 2 ? 0.35 : -0.2);
      up.push(c.clone().add(nrm.clone().multiplyScalar(w * serr)));
      dn.push(c.clone().add(nrm.clone().multiplyScalar(-w * 0.6)));
    }
    const s = new THREE.Shape();
    s.setFromPoints([...up, ...dn.reverse()]);
    shapes.push(s);
  }
  return new THREE.ShapeGeometry(shapes, 4);
}

function Palms({ count }: { count: number }) {
  const { geo, mat, matrices } = useMemo(() => {
    const geo = palmGeometry();
    const matrices: THREE.Matrix4[] = [];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const layout: [number, number, number, boolean][] = [];
    // hero palms framing the view
    layout.push([-7.5, -3, 1.25, false], [8.2, -5, 1.4, true], [-12, -10, 1.1, false], [13, -12, 1.2, true]);
    for (let i = layout.length; i < count; i++) {
      const side = i % 2 ? 1 : -1;
      layout.push([side * (10 + Math.random() * 30), -18 - Math.random() * 30, 0.8 + Math.random() * 0.8, side > 0]);
    }
    layout.slice(0, count).forEach(([x, z, s, flip]) => {
      m.compose(new THREE.Vector3(x, -0.3, z), q, new THREE.Vector3(flip ? -s : s, s, s));
      matrices.push(m.clone());
    });
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: { uTime: shared.time, uDusk: shared.dusk },
      vertexShader: /* glsl */ `
        uniform float uTime; varying float vY;
        void main(){
          vec3 p = position;
          float ph = instanceMatrix[3].x*0.7 + instanceMatrix[3].z*0.3;
          float bend = pow(max(p.y,0.)/6., 2.);
          p.x += sin(uTime*0.9 + ph)*0.28*bend + sin(uTime*2.3+ph)*0.05*bend;
          vY = p.y;
          gl_Position = projectionMatrix*modelViewMatrix*instanceMatrix*vec4(p,1.);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uDusk; varying float vY;
        void main(){
          vec3 c = mix(vec3(0.06,0.0,0.1), vec3(0.18,0.02,0.2), smoothstep(0.,8.,vY)*(1.-uDusk));
          gl_FragColor = vec4(c,1.);
        }`,
    });
    return { geo, mat, matrices };
  }, [count]);
  return (
    <instancedMesh
      ref={(n) => {
        if (n) {
          matrices.forEach((mm, i) => n.setMatrixAt(i, mm));
          n.instanceMatrix.needsUpdate = true;
        }
      }}
      args={[geo, mat, matrices.length]}
      frustumCulled={false}
    />
  );
}

// ---------------------------------------------------------------- Highway light trails
function Traffic({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        dir: i % 2 ? 1 : -1,
        x: (Math.random() - 0.5) * 200,
        speed: 14 + Math.random() * 18,
        lane: (i % 2 ? 0.25 : -0.25) + (Math.random() - 0.5) * 0.1,
      })),
    [count],
  );
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const c = new THREE.Color();
    data.forEach((d, i) => {
      c.set(d.dir > 0 ? "#ff2b4a" : "#ffe9c4").multiplyScalar(3);
      c.toArray(arr, i * 3);
    });
    return arr;
  }, [data, count]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const s = useMemo(() => new THREE.Vector3(2.4, 0.06, 0.06), []);
  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const boost = 1 + Math.min(4, Math.abs(scroll.velocity) * 0.15);
    data.forEach((d, i) => {
      d.x += d.dir * d.speed * dt * boost;
      if (d.x > 110) d.x = -110;
      if (d.x < -110) d.x = 110;
      s.x = 2.4 * boost;
      mesh.setMatrixAt(i, m.compose(v.set(d.x, 1.3 + d.lane * 0.3, -46 + d.lane), q, s));
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      {/* bridge deck silhouette */}
      <mesh position={[0, 1.1, -46]}>
        <boxGeometry args={[240, 0.25, 1.4]} />
        <meshBasicMaterial color="#12021e" />
      </mesh>
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={i} position={[-112 + i * 15, 0.45, -46]}>
          <boxGeometry args={[0.5, 1.4, 0.5]} />
          <meshBasicMaterial color="#12021e" />
        </mesh>
      ))}
      <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]}>
          <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
        </boxGeometry>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------- Camera rig + timing
function Rig() {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 3, -60), []);
  useFrame((state, dt) => {
    shared.time.value = state.clock.elapsedTime;
    // scroll drives the time of day
    shared.dusk.value = THREE.MathUtils.damp(shared.dusk.value, Math.min(1, scroll.progress * 1.6), 3, dt);
    const p = scroll.progress;
    const cx = pointer.x * 1.4;
    const cy = 1.6 + pointer.y * 0.5 + p * 2.5;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, cx, 2.5, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, cy, 2.5, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, 9 - p * 14, 2.5, dt);
    target.x = pointer.x * 3;
    target.y = 3.2 - p * 1.5;
    camera.lookAt(target);
    // roll into turns with mouse velocity for kinetic energy
    camera.rotation.z = THREE.MathUtils.damp(camera.rotation.z, -pointer.vx * 0.0015, 4, dt);
  });
  return null;
}

function Post({ tier }: { tier: number }) {
  const ca = useRef<ChromaticAberrationEffect>(null);
  const off = useMemo(() => new THREE.Vector2(0.0008, 0.0008), []);
  useFrame(() => {
    const v = Math.min(0.012, 0.0008 + Math.abs(scroll.velocity) * 0.0004 + Math.hypot(pointer.vx, pointer.vy) * 0.00004);
    off.set(v, v * 0.6);
    if (ca.current) ca.current.offset = off;
  });
  if (tier === 0) return null;
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur intensity={tier === 2 ? 1.25 : 0.9} luminanceThreshold={0.55} luminanceSmoothing={0.3} radius={0.75} />
      <ChromaticAberration ref={ca} offset={off} radialModulation modulationOffset={0.3} />
      <Noise opacity={0.07} blendFunction={BlendFunction.OVERLAY} />
      <Vignette eskil={false} offset={0.2} darkness={0.75} />
    </EffectComposer>
  );
}

export default function GtaScene({ tier, mobile }: SceneProps) {
  return (
    <>
      <color attach="background" args={["#140526"]} />
      <fog attach="fog" args={["#3a0a3f", 40, 120]} />
      <Rig />
      <Sky />
      <Sun />
      <Ocean seg={tier === 2 ? 180 : tier === 1 ? 110 : 60} />
      <Skyline count={mobile ? 60 : tier === 2 ? 180 : 110} />
      <Traffic count={mobile ? 24 : 70} />
      <Palms count={mobile ? 6 : tier === 2 ? 22 : 12} />
      <Post tier={tier} />
    </>
  );
}
