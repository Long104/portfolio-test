import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  InstancedBufferAttribute,
  PlaneGeometry,
  ShaderMaterial,
} from "three";

import { createStarTexture, createPetalTexture, createBlobTexture, createGradientLUT } from "./textures";
import { backdropVertex, backdropFragment } from "./shaders/backdrop";
import { particleVertex, particleFragment } from "./shaders/particles";
import { flareVertex, flareFragment } from "./shaders/flare";
import { glowVertex, glowFragment } from "./shaders/glow";
import { PAINT_COUNT, FLARE_COUNT } from "./perf";

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

export default function KiraKiraVortex() {
  // --- StrictMode-safe dispose flag ---
  // In dev StrictMode, React mount→unmount→mount. The cleanup would dispose
  // GPU resources that the second mount still references. Deferring disposal
  // to a setTimeout ensures we only dispose on REAL unmount.
  const mountedRef = useRef(true);

  // --- Procedural textures ---
  const starTex = useMemo(() => createStarTexture(), []);
  const petalTex = useMemo(() => createPetalTexture(), []);
  const blobTex = useMemo(() => createBlobTexture(), []);
  const gradLUT = useMemo(() => createGradientLUT(), []);

  // --- Materials (useMemo — immutable identity, used in JSX render) ---
  // Note: uniforms are mutated per-frame in useFrame below.
  // This is the standard R3F pattern; the react-hooks/immutability
  // and react-hooks/refs rules are disabled for this file in eslint.config.js
  // because React Compiler's purity model is fundamentally incompatible
  // with imperative Three.js uniform mutations.
  const backdropMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uAspect: { value: window.innerWidth / window.innerHeight },
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
  const glowMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uAspect: { value: window.innerWidth / window.innerHeight },
          uTime: { value: 0 },
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
    // here make the hole bigger
    const { pos, rand } = generateInstanceData(PAINT_COUNT, 36.0);
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

  // --- Dispose all GPU resources on unmount (prevents leaks on HMR/route change) ---
  // Deferred: in StrictMode dev, the re-mount sets mountedRef back to true
  // before this timeout fires, so we skip disposal. On real unmount, the
  // ref stays false and disposal proceeds.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      setTimeout(() => {
        if (mountedRef.current) return; // StrictMode re-mounted
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
    paintMat.uniforms.uTime.value = t;
    flareMat.uniforms.uTime.value = t;
    glowMat.uniforms.uTime.value = t;
    const aspect = state.size.width / state.size.height;
    glowMat.uniforms.uAspect.value = aspect;
    backdropMat.uniforms.uAspect.value = aspect;
  });

  return (
    <>
      {/* 1. Backdrop (Far distance void) */}
      <mesh geometry={backdropGeo} material={backdropMat} renderOrder={-5} />

      {/* 2. Merged Glow (Sun + Rays + Bridge + Core — single pass) */}
      <mesh geometry={backdropGeo} material={glowMat} renderOrder={-4} />

      {/* 3. Fluid Particles & Water Bubbles (Now clipping on top of the clouds seamlessly) */}
      <instancedMesh
        args={[paintGeo, paintMat, PAINT_COUNT]}
        frustumCulled={false}
        renderOrder={1}
      />

      {/* 4. Saturated Star Flares (Drawn on the absolute top layer) */}
      <instancedMesh 
        args={[flareGeo, flareMat, FLARE_COUNT]} 
        frustumCulled={false} 
        renderOrder={2}
      />
    </>
  );
}
