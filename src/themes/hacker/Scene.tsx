"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Glitch, Noise, Scanline, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import { BlendFunction, GlitchMode } from "postprocessing";
import { pointer, scroll } from "@/lib/signals";
import type { SceneProps } from "@/components/core/SceneHost";

/*
  SIGNAL // NOISE
  · procedural digital rain (glyphs generated in-shader from hashed bit patterns)
  · a rotating network globe: instanced nodes + live packet arcs
  · HUD orbit rings, CRT scanlines and sporadic glitch bursts
*/

const U = { time: { value: 0 }, scroll: { value: 0 }, mouse: { value: new THREE.Vector2() }, res: { value: new THREE.Vector2(1, 1) } };

function Rain({ density }: { density: number }) {
  const { size } = useThree();
  U.res.value.set(size.width, size.height);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        depthWrite: false,
        depthTest: false,
        uniforms: { uTime: U.time, uRes: U.res, uMouse: U.mouse, uScroll: U.scroll },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.999,1.);} `,
        fragmentShader: /* glsl */ `
          precision highp float;
          uniform float uTime, uScroll; uniform vec2 uRes, uMouse; varying vec2 vUv;
          float h1(float n){ return fract(sin(n)*43758.5453); }
          float h2(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
          // 5x7 pseudo-glyph from hash bits
          float glyph(vec2 uv, float seed){
            vec2 g = floor(uv*vec2(5.,7.));
            if(uv.x<0.08||uv.x>0.92||uv.y<0.06||uv.y>0.94) return 0.;
            float b = h2(g + seed*13.37);
            // bias towards symmetric, readable shapes
            float m = h2(vec2(abs(g.x-2.), g.y) + seed*13.37);
            return step(0.52, mix(b, m, 0.7));
          }
          void main(){
            float cell = ${density.toFixed(1)};
            vec2 px = vUv*uRes;
            vec2 grid = vec2(cell*0.62, cell);
            vec2 id = floor(px/grid);
            vec2 f = fract(px/grid);
            float col = id.x;
            float speed = 4. + h1(col*1.7)*10.;
            float offs = h1(col*3.1)*200.;
            float rows = uRes.y/grid.y;
            float head = mod(uTime*speed + offs + uScroll*80., rows + 40.);
            float y = rows - id.y;
            float d = head - y;
            float trail = d > 0. ? exp(-d*0.12) : 0.;
            float change = floor(uTime*(2. + h1(col)*6.) + h2(id)*10.);
            float g = glyph(f, h2(id + change));
            float headGlow = smoothstep(1.5, 0., abs(d));
            vec3 c = vec3(0.0, 1.0, 0.61) * g * trail * 0.55;
            c += vec3(0.75,1.,0.9) * g * headGlow;
            // mouse "scan" lens reveals brighter code
            vec2 m = (uMouse*0.5+0.5)*uRes;
            float lens = exp(-pow(length(px - m)/180., 2.));
            c *= 0.35 + lens*1.6;
            // CRT curvature darkening
            vec2 q = vUv*2.-1.;
            c *= 1. - dot(q,q)*0.25;
            c += vec3(0.0, 0.02, 0.012);
            gl_FragColor = vec4(c, 1.);
          }`,
      }),
    [density],
  );
  return (
    <mesh frustumCulled={false} renderOrder={-10} material={mat}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

function fib(n: number, r: number) {
  const pts: THREE.Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = phi * i;
    pts.push(new THREE.Vector3(Math.cos(th) * rad * r, y * r, Math.sin(th) * rad * r));
  }
  return pts;
}

function Globe({ nodes, arcs }: { nodes: number; arcs: number }) {
  const group = useRef<THREE.Group>(null);
  const nodeRef = useRef<THREE.InstancedMesh>(null);
  const R = 1.6;
  const pts = useMemo(() => fib(nodes, R), [nodes]);

  const arcData = useMemo(() => {
    const list: { curve: THREE.QuadraticBezierCurve3; speed: number; offset: number }[] = [];
    for (let i = 0; i < arcs; i++) {
      const a = pts[Math.floor(Math.random() * pts.length)];
      const b = pts[Math.floor(Math.random() * pts.length)];
      if (a.distanceTo(b) < 0.8) {
        i--;
        continue;
      }
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.setLength(R + a.distanceTo(b) * 0.45);
      list.push({ curve: new THREE.QuadraticBezierCurve3(a, mid, b), speed: 0.2 + Math.random() * 0.5, offset: Math.random() });
    }
    return list;
  }, [arcs, pts]);

  const arcMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: U.time },
        vertexShader: /* glsl */ `attribute float aT; attribute float aSpeed; attribute float aOff; varying float vT; varying float vS; varying float vO;
          void main(){ vT=aT; vS=aSpeed; vO=aOff; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);} `,
        fragmentShader: /* glsl */ `uniform float uTime; varying float vT; varying float vS; varying float vO;
          void main(){
            float head = fract(uTime*vS + vO);
            float d = head - vT;
            float pulse = d>0. ? exp(-d*18.) : 0.;
            float base = 0.12;
            vec3 c = mix(vec3(0.,1.,0.61), vec3(0.8,1.,0.95), pulse);
            gl_FragColor = vec4(c*(base+pulse*2.5), base + pulse);
          }`,
      }),
    [],
  );

  const arcGeo = useMemo(() => {
    const pos: number[] = [],
      t: number[] = [],
      sp: number[] = [],
      of: number[] = [];
    const SEG = 40;
    arcData.forEach((a) => {
      const p = a.curve.getPoints(SEG);
      for (let i = 0; i < SEG; i++) {
        pos.push(...p[i].toArray(), ...p[i + 1].toArray());
        t.push(i / SEG, (i + 1) / SEG);
        sp.push(a.speed, a.speed);
        of.push(a.offset, a.offset);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aT", new THREE.Float32BufferAttribute(t, 1));
    g.setAttribute("aSpeed", new THREE.Float32BufferAttribute(sp, 1));
    g.setAttribute("aOff", new THREE.Float32BufferAttribute(of, 1));
    return g;
  }, [arcData]);

  const sphereLines = useMemo(() => {
    const g = new THREE.WireframeGeometry(new THREE.SphereGeometry(R * 0.985, 24, 16));
    return g;
  }, []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += dt * 0.12;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -pointer.y * 0.4 + 0.25, 2, dt);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, pointer.x * 0.2, 2, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, scroll.progress * 3.2, 3, dt);
    const n = nodeRef.current;
    if (n && !n.userData.init) {
      const m = new THREE.Matrix4();
      pts.forEach((p, i) => n.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z)));
      n.instanceMatrix.needsUpdate = true;
      n.userData.init = true;
    }
    void state;
  });

  return (
    <group ref={group} position={[2.1, 0, -0.5]}>
      <lineSegments geometry={sphereLines}>
        <lineBasicMaterial color="#00ff9c" transparent opacity={0.07} />
      </lineSegments>
      <instancedMesh ref={nodeRef} args={[undefined, undefined, pts.length]} frustumCulled={false}>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshBasicMaterial color="#7dffcc" toneMapped={false} />
      </instancedMesh>
      <lineSegments geometry={arcGeo} material={arcMat} />
      <HudRings />
    </group>
  );
}

function HudRings() {
  const refs = useRef<THREE.Mesh[]>([]);
  useFrame((_, dt) => {
    refs.current.forEach((r, i) => {
      if (!r) return;
      r.rotation.z += dt * (i % 2 ? 0.3 : -0.2) * (1 + i * 0.2);
    });
  });
  const rings = [
    { r: 2.05, w: 0.008, arc: Math.PI * 1.6, tilt: 1.2 },
    { r: 2.25, w: 0.02, arc: Math.PI * 0.35, tilt: 1.35 },
    { r: 2.4, w: 0.005, arc: Math.PI * 2, tilt: 1.0 },
  ];
  return (
    <>
      {rings.map((g, i) => (
        <mesh
          key={i}
          ref={(n) => {
            if (n) refs.current[i] = n;
          }}
          rotation-x={g.tilt}
        >
          <ringGeometry args={[g.r, g.r + g.w, 96, 1, 0, g.arc]} />
          <meshBasicMaterial color={i === 1 ? "#ff3b3b" : "#00ff9c"} transparent opacity={i === 1 ? 0.9 : 0.4} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

function Rig() {
  const { camera } = useThree();
  useFrame((state, dt) => {
    U.time.value = state.clock.elapsedTime;
    U.scroll.value = scroll.progress;
    U.mouse.value.set(pointer.x, pointer.y);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.3, 3, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pointer.y * 0.2, 3, dt);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HackerScene({ tier, mobile }: SceneProps) {
  const glitchDelay = useMemo(() => new THREE.Vector2(5, 11), []);
  const glitchDur = useMemo(() => new THREE.Vector2(0.06, 0.18), []);
  const glitchStr = useMemo(() => new THREE.Vector2(0.02, 0.06), []);
  const ca = useMemo(() => new THREE.Vector2(0.0012, 0.0006), []);
  return (
    <>
      <color attach="background" args={["#020604"]} />
      <Rig />
      <Rain density={mobile ? 18 : 16} />
      <Globe nodes={mobile ? 220 : tier === 2 ? 640 : 380} arcs={mobile ? 18 : tier === 2 ? 56 : 32} />
      {tier > 0 && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.25} radius={0.6} />
          <ChromaticAberration offset={ca} radialModulation={false} modulationOffset={0} />
          <Scanline density={1.6} opacity={0.12} blendFunction={BlendFunction.OVERLAY} />
          <Noise opacity={0.08} blendFunction={BlendFunction.SCREEN} />
          <Glitch delay={glitchDelay} duration={glitchDur} strength={glitchStr} mode={GlitchMode.SPORADIC} ratio={0.9} columns={0.02} />
          <Vignette offset={0.25} darkness={0.8} />
        </EffectComposer>
      )}
    </>
  );
}
