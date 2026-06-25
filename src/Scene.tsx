import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ==========================================
// 1. PROCEDURAL TEXTURES
//    Crisp, painterly elements for the explosion look.
// ==========================================

function createStarTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // Sharp, bright core streaks
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.4);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(230,255,255,0.6)");
  grad.addColorStop(1, "rgba(200,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Sharp cross spikes
  ctx.save();
  ctx.translate(c, c);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 2; i++) {
    const spike = ctx.createLinearGradient(-c, 0, c, 0);
    spike.addColorStop(0, "rgba(255,255,255,0)");
    spike.addColorStop(0.48, "rgba(255,255,255,0.1)");
    spike.addColorStop(0.5, "rgba(255,255,255,0.9)");
    spike.addColorStop(0.52, "rgba(255,255,255,0.1)");
    spike.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = spike;
    ctx.fillRect(-c, -1, size, 2);
    ctx.rotate(Math.PI / 2);
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createPetalTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // Solid oval — crisp anime paint chunks for the explosion
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.ellipse(c, c, c * 0.85, c * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createBlobTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // Clean, solid circle — dark framing silhouettes
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(c, c, c * 0.9, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// 15-stop depth gradient baked into a 256x1 LUT.
// Edit colors here — no shader changes ever needed.
function createGradientLUT(): THREE.Texture {
  const w = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;

  const stops: [number, string][] = [
    [0.0, "#FEFDF7"], // whiteCore
    [0.03, "#FEFFB4"], // whiteCore
    [0.071, "#FEFD88"], // coreYellow
    [0.132, "#FF9093"], // hotPink
    [0.360, "#FEADBB"], // amber
    [0.480, "#0CE3B6"], // mintGlow
    [0.571, "#30BBBC"], // mintGlow
    [0.945, "#072D42"], // darkJade
    [0.857, "#01141C"], // nearBlack
    [0.929, "#000A10"], // almostBlack
    [1.0, "#000508"], // deepBlack
  ];

  const grad = ctx.createLinearGradient(0, 0, w, 0);
  for (const [offset, color] of stops) grad.addColorStop(offset, color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, 1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Precomputed FBM noise — replaces expensive per-fragment noise calculations
// with a single texture2D lookup.
function createNoiseTexture(size = 256): THREE.Texture {
  const data = new Uint8Array(size * size * 4);

  function hash(x: number, y: number): number {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }

  function noise(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    return (
      hash(ix, iy) * (1 - ux) * (1 - uy) +
      hash(ix + 1, iy) * ux * (1 - uy) +
      hash(ix, iy + 1) * (1 - ux) * uy +
      hash(ix + 1, iy + 1) * ux * uy
    );
  }

  const cosR = Math.cos(0.5);
  const sinR = Math.sin(0.5);

  function fbm(x: number, y: number): number {
    let v = 0;
    let a = 0.5;
    for (let i = 0; i < 3; i++) {
      v += a * noise(x, y);
      const nx = cosR * x - sinR * y;
      const ny = sinR * x + cosR * y;
      x = nx * 2.5 + 100;
      y = ny * 2.5 + 100;
      a *= 0.5;
    }
    return v;
  }

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const tiles = 4;
      const nx = (px / size) * tiles;
      const ny = (py / size) * tiles;
      const n = Math.min(1, Math.max(0, fbm(nx, ny)));
      const val = Math.floor(n * 255);
      const idx = (py * size + px) * 4;
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// ==========================================
// 2. SHADERS
// ==========================================

// ── Layer A: Fullscreen backdrop — dark void tunnel ──
const backdropVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const backdropFragment = /* glsl */ `
  uniform float uAspect;
  varying vec2 vUv;
  void main() {
    vec2 centered = vUv - vec2(0.5);
    centered.x *= uAspect;
    float dist = length(centered);

    // Deep void behind the explosion — high contrast for the core
    vec3 vortexCenter = vec3(0.00, 0.06, 0.08); // #001014
    vec3 magicalMint  = vec3(0.05, 0.89, 0.71); // #0ce3b6
    vec3 outerTeal    = vec3(0.00, 0.16, 0.18); // #012a2e

    vec3 color = mix(vortexCenter, magicalMint, smoothstep(0.0, 0.35, dist));
    color = mix(color, outerTeal, smoothstep(0.4, 0.95, dist));

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

// ── Layer B: Particles — 3 types, packed tight into core explosion ──
const particleVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  attribute vec3 aInitialPos;
  attribute vec3 aRandoms;

  varying vec2 vUv;
  varying float vType;
  varying float vDepth;

  void main() {
    vUv = uv;
    vType = aRandoms.z;
    vec3 pos = aInitialPos;

    // Fast, continuous tunnel suction flow
    pos.z += uTime * uSpeed * (0.9 + aRandoms.x * 0.4);
    pos.z = mod(pos.z + 60.0, 70.0) - 60.0;

    // TIGHT clearance — pack particles densely into the core explosion
    float r = length(pos.xy);
    if (r < 1.5) pos.xy = normalize(pos.xy + 0.001) * (1.5 + aRandoms.x * 2.0);

    // Wavy, organic fluid movement path
    float wave = sin(pos.z * 0.15 + uTime * 1.5 + aRandoms.y * 6.28) * 0.6;
    pos.x += cos(wave) * 0.4;
    pos.y += sin(wave) * 0.4;

    vDepth = clamp((pos.z + 60.0) / 65.0, 0.0, 1.0);

    // Scale: tiny far away, massive and sharp when close
    float baseScale = (vType < 0.60) ? 1.6 : 3.2;
    float scale = baseScale * (0.15 + pow(vDepth, 3.5) * 18.0);

    // Continuous animated spin
    float angle = pos.z * 0.08 + aRandoms.y * 6.28 + uTime * 0.2;
    float s = sin(angle);
    float c = cos(angle);
    vec3 transformed = position;
    transformed.xy = mat2(c, -s, s, c) * transformed.xy;

    vec4 mvPos = modelViewMatrix * vec4(pos + transformed * scale, 1.0);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const particleFragment = /* glsl */ `
  uniform sampler2D uTexPetal;
  uniform sampler2D uTexBlob;
  uniform sampler2D uGradLUT;
  varying vec2 vUv;
  varying float vType;
  varying float vDepth;

  void main() {
    vec4 texColor;
    vec3 finalColor;

    // 3 particle types create the chaotic explosion splatter
    if (vType < 0.55) {
      // 1. Vibrant neon coral-pink (55%) — crisp ellipse shape
      texColor = texture2D(uTexPetal, vUv);
      finalColor = mix(vec3(1.0, 0.25, 0.48), vec3(1.0, 0.55, 0.70), vDepth);
    } else if (vType < 0.65) {
      // 2. Sun-yellow paint bits exploding from core (10%)
      texColor = texture2D(uTexPetal, vUv);
      finalColor = mix(vec3(1.0, 0.92, 0.30), vec3(1.0, 1.0, 0.70), vDepth);
    } else {
      // 3. Ultra-dark crisp framing silhouettes (35%) — 2.5D depth layers
      texColor = texture2D(uTexBlob, vUv);
      finalColor = texture2D(uGradLUT, vec2(vDepth, 0.5)).rgb;
    }

    if (texColor.a < 0.1) discard; // Crisp alpha edges — no soft halos

    float alphaFade = smoothstep(1.0, 0.88, vDepth);
    gl_FragColor = vec4(finalColor, texColor.a * alphaFade);

    #include <colorspace_fragment>
  }
`;

// ── Layer C: Star flares — fast, bright, fly through core ──
const flareVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  attribute vec3 aInitialPos;
  attribute vec3 aRandoms;
  varying vec2 vUv;
  varying float vDepth;
  varying float vColorMix;

  void main() {
    vUv = uv;
    vColorMix = aRandoms.x;
    vec3 pos = aInitialPos;

    pos.z += uTime * uSpeed * (1.2 + aRandoms.y * 0.6);
    pos.z = mod(pos.z + 60.0, 70.0) - 60.0;

    // No center clearance — flares fly right through the explosion
    vDepth = clamp((pos.z + 60.0) / 65.0, 0.0, 1.0);
    float scale = 0.4 * (0.1 + pow(vDepth, 2.0) * 8.0);

    // Directional motion streak stretching outward
    vec3 transformed = position;
    vec2 dir = normalize(pos.xy + 0.001);
    float stretch = 1.0 + (vDepth * 4.0);
    transformed.xy += dir * dot(transformed.xy, dir) * (stretch - 1.0);

    vec4 mvPos = modelViewMatrix * vec4(pos + transformed * scale, 1.0);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const flareFragment = /* glsl */ `
  uniform sampler2D uTexStar;
  varying vec2 vUv;
  varying float vDepth;
  varying float vColorMix;

  void main() {
    vec4 texColor = texture2D(uTexStar, vUv);

    // 4-color dappling: yellow + pink + mint + white sparks
    vec3 colors[4] = vec3[4](
      vec3(1.0, 1.0, 0.5),     // Core Bright Yellow
      vec3(1.0, 0.4, 0.6),     // Hot Pink Streak
      vec3(0.1, 0.95, 0.85),   // Magical Mint (matches backdrop!)
      vec3(1.0, 1.0, 1.0)      // Incandescent White Spark
    );

    int index = int(floor(vColorMix * 4.0));
    vec3 glow = colors[index];

    float alphaFade = smoothstep(1.0, 0.82, vDepth);
    gl_FragColor = vec4(glow * 1.5, texColor.a * alphaFade);

    #include <colorspace_fragment>
  }
`;

// ── Layer D1: Tight explosion core (renders ON TOP of halo) ──
// Concentrated ignition point — white heart, sun-yellow ring, neon pink edge.
const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const glowFragment = /* glsl */ `
  uniform float uAspect;
  uniform float uTime;
  uniform sampler2D uNoiseTex;
  varying vec2 vUv;

  void main() {
    vec2 centered = vUv - vec2(0.5);
    centered.x *= uAspect;
    float dist = length(centered);

    // 1 texture lookup for subtle flicker (no fbm loop)
    float gasNoise = texture2D(uNoiseTex, centered * 6.0 - vec2(uTime * 0.5)).r;
    float d = dist + gasNoise * 0.01;

    // ── Explosion palette: tight, intense ──
    vec3 whiteCore = vec3(1.0, 1.0, 0.9);
    vec3 sunYellow = vec3(1.0, 0.80, 0.1);
    vec3 neonPink  = vec3(0.95, 0.15, 0.45);

    vec3 color = neonPink;
    color = mix(color, sunYellow, smoothstep(0.08, 0.04, d));
    color = mix(color, whiteCore, smoothstep(0.03, 0.00, d));

    // Tight falloff — concentrated ignition, not a blanket
    float alpha = smoothstep(0.12, 0.01, d);

    gl_FragColor = vec4(color * 1.3, alpha);

    #include <colorspace_fragment>
  }
`;

// ── Layer D2: Wide pastel halo (renders BEFORE core) ──
// The "circle" from extra-ligt — breathing, ethereal, soft.
// Cheap: 1 sin() for breathing + 1 noise lookup for drift.
const haloFragment = /* glsl */ `
  uniform float uAspect;
  uniform float uTime;
  uniform sampler2D uNoiseTex;
  varying vec2 vUv;

  void main() {
    vec2 centered = vUv - vec2(0.5);
    centered.x *= uAspect;
    float dist = length(centered);

    // Cheap breathing — 1 sin() instead of fbm angular ripple
    float breathe = sin(uTime * 1.2) * 0.006;

    // Subtle gas drift — 1 texture lookup
    float gasNoise = texture2D(uNoiseTex, centered * 3.0 - vec2(uTime * 0.1)).r;

    float d = dist + breathe + gasNoise * 0.01;

    // ── Pastel palette: wide, magical, ethereal ──
    vec3 whiteCore  = vec3(1.0, 1.0, 0.9);     // Creamy heart
    vec3 yellow     = vec3(1.0, 0.88, 0.2);     // Anime yellow
    vec3 midPink    = vec3(1.0, 0.45, 0.7);     // Bubblegum pink
    vec3 outerEdge  = vec3(0.95, 0.2, 0.6);     // Cosmic magenta

    vec3 color = outerEdge;
    color = mix(color, midPink,   smoothstep(0.22, 0.15, d));
    color = mix(color, yellow,    smoothstep(0.15, 0.025, d));
    color = mix(color, whiteCore, smoothstep(0.02, 0.0, d));

    // Capped intensity — stays pastel, never blows out
    float glow = min(exp(-d * 8.0) + 0.3, 0.6);

    // Wide soft falloff — the big circle
    float alpha = smoothstep(0.40, 0.08, d) * (0.5 + gasNoise * 0.2);

    // Dimmed — this sits UNDER the tight core explosion
    gl_FragColor = vec4(color * glow, alpha * 0.5);

    #include <colorspace_fragment>
  }
`;

// ==========================================
// 3. SCENE COMPONENT
// ==========================================

// --- Adaptive perf tier ---
type PerfTier = "mobile" | "low" | "high";

function detectPerfTier(): PerfTier {
  if (typeof navigator === "undefined") return "high";
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  if (isMobile) return "mobile";
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as { deviceMemory?: number }).deviceMemory ?? 4;
  if (cores <= 4 || memory <= 4) return "low";
  return "high";
}

const PERF_TIER = detectPerfTier();
const PAINT_COUNT =
  PERF_TIER === "mobile" ? 2000 : PERF_TIER === "low" ? 3500 : 5500;
const FLARE_COUNT =
  PERF_TIER === "mobile" ? 1000 : PERF_TIER === "low" ? 1500 : 3000;
const MAX_DPR = PERF_TIER === "mobile" ? 1 : PERF_TIER === "low" ? 1.25 : 1.5;

function generateInstanceData(count: number, maxRadius: number) {
  const pos = new Float32Array(count * 3);
  const rand = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Center-heavy distribution — packs particles toward the explosion
    const radius = Math.pow(Math.random(), 1.5) * maxRadius;
    pos[i * 3] = Math.cos(angle) * radius;
    pos[i * 3 + 1] = Math.sin(angle) * radius;
    pos[i * 3 + 2] = Math.random() * -60;

    rand[i * 3] = Math.random();
    rand[i * 3 + 1] = Math.random();
    rand[i * 3 + 2] = Math.random();
  }
  return { pos, rand };
}

function KiraKiraVortex() {
  // --- Procedural textures ---
  const starTex = useMemo(() => createStarTexture(), []);
  const petalTex = useMemo(() => createPetalTexture(), []);
  const blobTex = useMemo(() => createBlobTexture(), []);
  const gradLUT = useMemo(() => createGradientLUT(), []);
  const noiseTex = useMemo(() => createNoiseTexture(), []);

  // --- Materials ---
  const backdropMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAspect: { value: 1.0 },
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
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: 0.18 },
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
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: 0.25 },
          uTexStar: { value: starTex },
        },
        vertexShader: flareVertex,
        fragmentShader: flareFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [starTex],
  );

  // Layer D1: Tight explosion core
  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAspect: { value: 1.0 },
          uTime: { value: 0 },
          uNoiseTex: { value: noiseTex },
        },
        vertexShader: glowVertex,
        fragmentShader: glowFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [noiseTex],
  );

  // Layer D2: Wide pastel halo
  const haloMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAspect: { value: 1.0 },
          uTime: { value: 0 },
          uNoiseTex: { value: noiseTex },
        },
        vertexShader: glowVertex, // same fullscreen vertex shader
        fragmentShader: haloFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [noiseTex],
  );

  // --- Geometry ---
  // PlaneGeometry(2, 2) fills clip space [-1, 1] — proper fullscreen pass
  const fullscreenGeo = useMemo(() => new THREE.PlaneGeometry(2, 2), []);

  const paintGeo = useMemo(() => {
    const { pos, rand } = generateInstanceData(PAINT_COUNT, 15.0);
    const geo = new THREE.PlaneGeometry(0.35, 0.35);
    geo.setAttribute("aInitialPos", new THREE.InstancedBufferAttribute(pos, 3));
    geo.setAttribute("aRandoms", new THREE.InstancedBufferAttribute(rand, 3));
    return geo;
  }, []);

  const flareGeo = useMemo(() => {
    const { pos, rand } = generateInstanceData(FLARE_COUNT, 12.0);
    const geo = new THREE.PlaneGeometry(0.25, 0.25);
    geo.setAttribute("aInitialPos", new THREE.InstancedBufferAttribute(pos, 3));
    geo.setAttribute("aRandoms", new THREE.InstancedBufferAttribute(rand, 3));
    return geo;
  }, []);

  // --- Dispose all GPU resources on unmount ---
  useEffect(() => {
    return () => {
      [starTex, petalTex, blobTex, gradLUT, noiseTex].forEach((t) =>
        t.dispose(),
      );
      [fullscreenGeo, paintGeo, flareGeo].forEach((g) => g.dispose());
      [backdropMat, paintMat, flareMat, haloMat, glowMat].forEach((m) =>
        m.dispose(),
      );
    };
  }, [
    starTex,
    petalTex,
    blobTex,
    gradLUT,
    noiseTex,
    fullscreenGeo,
    paintGeo,
    flareGeo,
    backdropMat,
    paintMat,
    flareMat,
    haloMat,
    glowMat,
  ]);

  // --- Animation loop ---
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    paintMat.uniforms.uTime.value = t;
    flareMat.uniforms.uTime.value = t;
    glowMat.uniforms.uTime.value = t;
    haloMat.uniforms.uTime.value = t;
    const aspect = state.size.width / state.size.height;
    glowMat.uniforms.uAspect.value = aspect;
    haloMat.uniforms.uAspect.value = aspect;
    backdropMat.uniforms.uAspect.value = aspect;
  });

  return (
    <>
      {/* Layer A: Fullscreen backdrop — dark void tunnel */}
      <mesh
        geometry={fullscreenGeo}
        material={backdropMat}
        renderOrder={-2}
      />

      {/* Layer B: Particles — pink + yellow explosion, dark silhouettes */}
      <instancedMesh
        args={[paintGeo, paintMat, PAINT_COUNT]}
        frustumCulled={false}
        renderOrder={-1}
      />

      {/* Layer C: Star flares — fast, bright, through core */}
      <instancedMesh
        args={[flareGeo, flareMat, FLARE_COUNT]}
        frustumCulled={false}
        renderOrder={0}
      />

      {/* Layer D2: Wide pastel halo — the "circle", breathing */}
      <mesh geometry={fullscreenGeo} material={haloMat} renderOrder={1} />

      {/* Layer D1: Tight explosion core — concentrated ignition point */}
      <mesh geometry={fullscreenGeo} material={glowMat} renderOrder={2} />
    </>
  );
}

// ==========================================
// 4. FRAME LIMITER + EXPORT
// ==========================================

// Caps render rate to 30fps and pauses entirely when the tab is hidden.
function FrameLimiter({ fps = 30 }: { fps?: number }) {
  const invalidate = useThree((state) => state.invalidate);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function start() {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => invalidate(), 1000 / fps);
    }
    function stop() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function onVisibilityChange() {
      if (document.hidden) stop();
      else start();
    }

    start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fps, invalidate]);

  return null;
}

export default function Scene() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#000508",
      }}
    >
      <Canvas
        frameloop="demand"
        camera={{ position: [0, 0, 5], fov: 74 }}
        dpr={PERF_TIER === "mobile" ? 1 : [1, MAX_DPR]}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: false,
        }}
        performance={{ min: 0.5 }}
      >
        <FrameLimiter fps={30} />
        <KiraKiraVortex />
      </Canvas>
    </div>
  );
}
