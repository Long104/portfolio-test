import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  InstancedBufferAttribute,
  InstancedMesh,
  PlaneGeometry,
  ShaderMaterial,
} from "three";

import { createStarTexture, createPetalTexture, createBlobTexture, createGradientLUT } from "./textures";
import { backdropVertex, backdropFragment } from "./shaders/backdrop";
import { particleVertex, particleFragment } from "./shaders/particles";
import { flareVertex, flareFragment } from "./shaders/flare";
import { glowVertex, glowFragment } from "./shaders/glow";
import { PAINT_COUNT, FLARE_COUNT } from "./perf";
import { useAudioEngine } from "./useAudioEngine";

// ==========================================
// 3. SCENE COMPONENT
// ==========================================

function generateInstanceData(count: number, maxRadius: number) {
  const pos = new Float32Array(count * 3);
  const rand = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * maxRadius;
    pos[i * 3] = Math.cos(angle) * radius;
    pos[i * 3 + 1] = Math.sin(angle) * radius;
    pos[i * 3 + 2] = Math.random() * -60;

    rand[i * 3] = Math.random();
    rand[i * 3 + 1] = Math.random();
    rand[i * 3 + 2] = Math.random();
  }
  return { pos, rand };
}

interface KiraKiraVortexProps {
  scrollProgress?: number;
}

export default function KiraKiraVortex({ scrollProgress = 0 }: KiraKiraVortexProps) {
  // --- Audio reactivity ---
  const { getData } = useAudioEngine();

  // --- Mesh refs for layer rotation (Option B) ---
  const paintRef = useRef<InstancedMesh>(null);
  const flareRef = useRef<InstancedMesh>(null);

  // Per-layer smoothing — each visual element responds at a different speed.
  // This creates a staggered cascade: core snaps fast, particles lag behind.
  // Lower factor = slower response = laggy/heavier feel.
  const smooth = useRef({
    coreBass: 0,       // 0.50 — fast attack, the heart pulses with the kick
    sunBass: 0,        // 0.25 — medium, sun follows bass a beat later
    raysTreble: 0,     // 0.40 — rays shimmer with highs
    bridgeMid: 0,      // 0.30 — bridge glows with mids
    particlesMid: 0,   // 0.12 — laggy, particles drift behind the beat
    flaresTreble: 0,   // 0.35 — flares sparkle on treble
    backdropBass: 0,   // 0.08 — barely moves, void breathes slowly
  });

  // --- StrictMode-safe dispose flag ---
  const mountedRef = useRef(true);

  // --- Procedural textures ---
  const starTex = useMemo(() => createStarTexture(), []);
  const petalTex = useMemo(() => createPetalTexture(), []);
  const blobTex = useMemo(() => createBlobTexture(), []);
  const gradLUT = useMemo(() => createGradientLUT(), []);

  // --- Materials ---
  const backdropMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uAspect: { value: window.innerWidth / window.innerHeight },
          uBass: { value: 0 },
        },
        vertexShader: backdropVertex,
        fragmentShader: backdropFragment,
        depthWrite: false,
        depthTest: false,
      }),
    [],
  );

  const paintMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: 0.15 },
          uTexPetal: { value: petalTex },
          uTexBlob: { value: blobTex },
          uGradLUT: { value: gradLUT },
          uMid: { value: 0 },
        },
        vertexShader: particleVertex,
        fragmentShader: particleFragment,
        transparent: true,
        depthWrite: false,
      }),
    [petalTex, blobTex, gradLUT],
  );

  const flareMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: 0.2 },
          uTexStar: { value: starTex },
          uTreble: { value: 0 },
        },
        vertexShader: flareVertex,
        fragmentShader: flareFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [starTex],
  );

  // MERGED GLOW: Sun + Rays + Bridge + Core in 1 pass
  // Now with scroll-based uScroll + uBreath uniforms for color shift & breath
  const glowMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uAspect: { value: window.innerWidth / window.innerHeight },
          uTime: { value: 0 },
          uCoreBass: { value: 0 },
          uSunBass: { value: 0 },
          uRaysTreble: { value: 0 },
          uBridgeMid: { value: 0 },
          uScroll: { value: 0 },    // Option C: color shift
          uBreath: { value: 0 },    // Option C: intensity swell
        },
        vertexShader: glowVertex,
        fragmentShader: glowFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: AdditiveBlending,
      }),
    [],
  );

  // --- Geometry with instanced attributes ---
  const backdropGeo = useMemo(() => new PlaneGeometry(2, 2), []);

  const paintGeo = useMemo(() => {
    const { pos, rand } = generateInstanceData(PAINT_COUNT, 38.0);
    const geo = new PlaneGeometry(0.4, 0.4);
    geo.setAttribute("aInitialPos", new InstancedBufferAttribute(pos, 3));
    geo.setAttribute("aRandoms", new InstancedBufferAttribute(rand, 3));
    return geo;
  }, []);

  const flareGeo = useMemo(() => {
    const { pos, rand } = generateInstanceData(FLARE_COUNT, 10.0);
    const geo = new PlaneGeometry(0.3, 0.3);
    geo.setAttribute("aInitialPos", new InstancedBufferAttribute(pos, 3));
    geo.setAttribute("aRandoms", new InstancedBufferAttribute(rand, 3));
    return geo;
  }, []);

  // --- Dispose all GPU resources on unmount ---
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      setTimeout(() => {
        if (mountedRef.current) return;
        [starTex, petalTex, blobTex, gradLUT].forEach((t) => t.dispose());
        [backdropGeo, paintGeo, flareGeo].forEach((g) => g.dispose());
        [backdropMat, paintMat, flareMat, glowMat].forEach((m) =>
          m.dispose(),
        );
      });
    };
  }, []);

  // --- Animation loop ---
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const raw = getData();
    const s = smooth.current;

    // Asymmetric envelope per layer
    const env = (cur: number, target: number, atk: number, dec: number) =>
      cur + (target - cur) * (target > cur ? atk : dec);

    s.coreBass     = env(s.coreBass,     raw.bass,   0.40, 0.08);
    s.sunBass      = env(s.sunBass,      raw.bass,   0.20, 0.04);
    s.raysTreble   = env(s.raysTreble,   raw.treble, 0.35, 0.12);
    s.bridgeMid    = env(s.bridgeMid,    raw.mid,    0.25, 0.06);
    s.particlesMid = env(s.particlesMid, raw.mid,    0.15, 0.04);
    s.flaresTreble = env(s.flaresTreble, raw.treble, 0.40, 0.10);
    s.backdropBass = env(s.backdropBass, raw.bass,   0.08, 0.02);

    const aspect = state.size.width / state.size.height;

    // ── TIMING ──
    paintMat.uniforms.uTime.value = t;
    flareMat.uniforms.uTime.value = t;
    glowMat.uniforms.uTime.value = t;

    // ── ASPECT ──
    glowMat.uniforms.uAspect.value = aspect;
    backdropMat.uniforms.uAspect.value = aspect;

    // ── AUDIO → MATERIALS (unchanged) ──
    glowMat.uniforms.uCoreBass.value = s.coreBass;
    glowMat.uniforms.uSunBass.value = s.sunBass;
    glowMat.uniforms.uRaysTreble.value = s.raysTreble;
    glowMat.uniforms.uBridgeMid.value = s.bridgeMid;
    paintMat.uniforms.uMid.value = s.particlesMid;
    flareMat.uniforms.uTreble.value = s.flaresTreble;
    backdropMat.uniforms.uBass.value = s.backdropBass;

    // ══════════════════════════════════════════════
    // OPTION B: Layer rotation (parallax scroll)
    // Each layer rotates at a different speed around Y
    // to create depth: flares (fast) → particles (mid) → glow/core (static)
    // ══════════════════════════════════════════════
    // Subtle layer rotation: max ~10° (π/18) per full scroll — gentle tunnel feel
    const scrollAngle = scrollProgress * Math.PI / 18;

    if (paintRef.current) {
      paintRef.current.rotation.y = scrollAngle;
    }
    if (flareRef.current) {
      // Flares rotate faster for parallax depth (closer feel)
      flareRef.current.rotation.y = scrollAngle * 1.8;
    }

    // ══════════════════════════════════════════════
    // OPTION C: Scroll-driven effects
    // ══════════════════════════════════════════════

    // Speed pulse — particles + flares speed up in middle, slow at ends
    const speedCurve = 1.0 + Math.sin(scrollProgress * Math.PI) * 1.0;
    paintMat.uniforms.uSpeed.value = 0.15 * speedCurve;
    flareMat.uniforms.uSpeed.value = 0.2 * speedCurve;

    // Color shift + Breath → passed to glow shader
    glowMat.uniforms.uScroll.value = scrollProgress;

    // Breath: sinusoidal swell that peaks at mid-scroll (0→1→0)
    const breath = 0.5 + 0.5 * Math.sin(scrollProgress * Math.PI);
    glowMat.uniforms.uBreath.value = breath;
  });

  return (
    <>
      {/* 1. Backdrop (Far distance void) */}
      <mesh geometry={backdropGeo} material={backdropMat} renderOrder={-5} />

      {/* 2. Merged Glow (Sun + Rays + Bridge + Core — single pass) */}
      <mesh geometry={backdropGeo} material={glowMat} renderOrder={-4} />

      {/* 3. Fluid Particles — rotates with scroll (1x) */}
      <instancedMesh
        ref={paintRef}
        args={[paintGeo, paintMat, PAINT_COUNT]}
        frustumCulled={false}
        renderOrder={1}
      />

      {/* 4. Saturated Star Flares — rotates with scroll (1.8x, parallax closer) */}
      <instancedMesh 
        ref={flareRef}
        args={[flareGeo, flareMat, FLARE_COUNT]} 
        frustumCulled={false} 
        renderOrder={2}
      />
    </>
  );
}
