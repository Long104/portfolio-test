
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ==========================================
// 1. PROCEDURAL TEXTURES (Canvas-based)
// ==========================================

function createStarTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.5);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.2, "rgba(255,255,220,0.9)");
  grad.addColorStop(0.5, "rgba(255,230,150,0.3)");
  grad.addColorStop(1, "rgba(255,230,150,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(c, c);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 2; i++) {
    const spike = ctx.createLinearGradient(-c, 0, c, 0);
    spike.addColorStop(0, "rgba(255,255,255,0)");
    spike.addColorStop(0.45, "rgba(255,255,255,0)");
    spike.addColorStop(0.5, "rgba(255,255,240,0.7)");
    spike.addColorStop(0.55, "rgba(255,255,255,0)");
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

  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.65);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.8)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.3)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

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

  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.85);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.6)");
  grad.addColorStop(0.6, "rgba(255,255,255,0.25)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c, c, c * 0.85, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createGradientLUT(): THREE.Texture {
  const w = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;

  const stops: [number, string][] = [
    [0.0, "#FEFDF7"], 
    [0.03, "#FEFFB4"], 
    [0.071, "#FEFD88"], 
    [0.132, "#FF9093"], 
    [0.360, "#FEADBB"], 
    [0.480, "#0CE3B6"], 
    [0.571, "#30BBBC"], 
    [0.945, "#072D42"], 
    [0.857, "#01141C"], 
    [0.929, "#000A10"], 
    [1.0, "#000508"], 
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

    vec3 dark   = vec3(0.0, 0.063, 0.078);  
    vec3 mint   = vec3(0.047, 0.89, 0.714); 
    vec3 teal   = vec3(0.004, 0.165, 0.18); 

    vec3 color = mix(dark, mint, smoothstep(0.0, 0.40, dist));
    if (dist > 0.40) color = mix(color, teal, smoothstep(0.40, 0.70, dist));

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

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

    pos.z += uTime * uSpeed * (0.8 + aRandoms.x * 0.4);
    pos.z = mod(pos.z + 60.0, 70.0) - 60.0;

    float r = length(pos.xy);
    if (r < 5.0) pos.xy = normalize(pos.xy + 0.001) * (5.0 + aRandoms.x * 3.0);

    float wave = sin(pos.z * 0.1 + uTime + aRandoms.y * 6.28) * 0.5;
    pos.x += cos(wave) * 0.5;
    pos.y += sin(wave) * 0.5;

    vDepth = pow(clamp((pos.z + 60.0) / 65.0, 0.0, 1.0), 1.5);

    float baseScale = (vType < 0.5) ? 1.0 : 2.5;
    float scale = baseScale * (0.2 + pow(vDepth, 3.0) * 15.0);

    float angle = pos.z * 0.05 + aRandoms.y * 6.28;
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

    if (vType < 0.5) {
      finalColor = mix(vec3(1.0, 0.3, 0.55), vec3(1.0, 0.6, 0.75), vDepth);
    } else {
      texColor = texture2D(uTexBlob, vUv);
      finalColor = texture2D(uGradLUT, vec2(vDepth, 0.5)).rgb;
    }

    float alphaFade = smoothstep(1.0, 0.85, vDepth);
    gl_FragColor = vec4(finalColor, texColor.a * alphaFade);
    #include <colorspace_fragment>
  }
`;

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

    pos.z += uTime * uSpeed * (1.0 + aRandoms.x * 0.5);
    pos.z = mod(pos.z + 60.0, 70.0) - 60.0;

    float r = length(pos.xy);
    if (r < 4.0) pos.xy = normalize(pos.xy + 0.001) * (4.0 + aRandoms.x * 2.0);

    vDepth = clamp((pos.z + 60.0) / 65.0, 0.0, 1.0);
    float scale = 0.5 * (0.2 + pow(vDepth, 2.5) * 6.0);

    vec3 transformed = position;
    vec2 dir = normalize(pos.xy + 0.001);
    float stretch = 1.0 + (vDepth * 3.0);
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

    vec3 colors[6] = vec3[6](
      vec3(1.0, 1.0, 0.4),        
      vec3(1.0, 0.9, 0.2),        
      vec3(0.8078, 1.0, 0.6863),  
      vec3(1.0, 0.3, 0.5),        
      vec3(1.000, 0.100, 0.150),   
      vec3(0.973, 0.050, 0.250)   
    );
    int index = int(floor(vColorMix * 6.0));
    vec3 glow = colors[index];

    float alphaFade = smoothstep(1.0, 0.80, vDepth);
    gl_FragColor = vec4(glow * 1.0, texColor.a * alphaFade);
    #include <colorspace_fragment>
  }
`;

const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// ── D4: SUN — Big Pastel Aura Mask (Fixed Step-Ratios) ──
const sunFragment = /* glsl */ `
  uniform float uAspect;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 3; ++i) {
      v += a * noise(p);
      p = rot * p * 2.5 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 centered = vUv - vec2(0.5);
    centered.x *= uAspect;
    float dist = length(centered);
    float angle = atan(centered.y, centered.x);

    float gasNoise = fbm(centered * 4.0 - vec2(uTime * 0.3, uTime * 0.3));
    float ripple = fbm(vec2(angle * 3.0, uTime * 0.6)) * 0.02;
    float d = dist + ripple;

    vec3 whiteCore = vec3(1.0, 1.0, 0.9);      
    vec3 yellow    = vec3(1.0, 0.85, 0.2);     
    vec3 midPink   = vec3(1.0, 0.40, 0.65);    
    vec3 outerEdge = vec3(0.95, 0.15, 0.55);   

    vec3 color = outerEdge;
// Smoothstep steps rearranged to emphasize pink over a larger area
// Smoothstep steps rearranged to emphasize pink over a larger area
// Smoothstep steps rearranged to emphasize pink over a larger area
// Smoothstep steps rearranged to emphasize pink over a larger area
color = mix(color, midPink,   smoothstep(0.32, 0.10, d + gasNoise * 0.015));
color = mix(color, yellow,    smoothstep(0.09, 0.03, d + gasNoise * 0.015));
color = mix(color, whiteCore, smoothstep(0.02, 0.00, d + gasNoise * 0.015));

    float glow = min(exp(-d * 6.0) + 0.4, 1.0);
    float alpha = smoothstep(0.35, 0.02, d) * (0.6 + gasNoise * 0.4);

    gl_FragColor = vec4(color * glow, alpha);
    #include <colorspace_fragment>
  }
`;

// ── D3: RAYS ──
const raysFragment = /* glsl */ `
  uniform float uAspect;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  void main() {
    vec2 centered = vUv - vec2(0.5);
    centered.x *= uAspect;
    float dist = length(centered);
    float angle = atan(centered.y, centered.x);

    float a = angle + uTime * 0.03;

    float rays = pow(0.5 + 0.5 * sin(a * 6.0), 8.0);
    rays += pow(0.5 + 0.5 * sin(a * 13.0 + 1.5), 16.0) * 0.4;

    float n = noise(vec2(angle * 5.0, uTime * 0.2));
    rays *= 0.6 + n * 0.8;

    float distFade = smoothstep(0.42, 0.06, dist) * smoothstep(0.0, 0.02, dist);

vec3 rayColor = mix(
  vec3(1.0, 0.75, 0.2),    // hot gold core edge
  vec3(1.0, 0.35, 0.65),   // deep bubblegum pink outer ray
  smoothstep(0.03, 0.18, dist)
);

    float alpha = rays * distFade * 0.15;
    gl_FragColor = vec4(rayColor * alpha, alpha);
    #include <colorspace_fragment>
  }
`;

// ── D2: BRIDGE ──
const bridgeFragment = /* glsl */ `
  uniform float uAspect;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  void main() {
    vec2 centered = vUv - vec2(0.5);
    centered.x *= uAspect;
    float dist = length(centered);

    float gasNoise = noise(centered * 4.0 - vec2(uTime * 0.2));
    float d = dist + gasNoise * 0.012;

    vec3 whiteCore = vec3(1.0, 0.95, 0.8);    
    vec3 gold      = vec3(1.0, 0.75, 0.2);     
    vec3 softPink  = vec3(0.992, 0.682, 0.761); 

    vec3 color = softPink;
    color = mix(color, gold,      smoothstep(0.15, 0.06, d));
    color = mix(color, whiteCore, smoothstep(0.04, 0.0, d));

    float glow = exp(-d * 6.0);
    float alpha = smoothstep(0.25, 0.05, d);

    gl_FragColor = vec4(color * glow * 0.6, alpha * 0.3);
    #include <colorspace_fragment>
  }
`;

// ── D1: CORE — Balanced Ignition Boundary (Fixed Blowout) ──
const coreFragment = /* glsl */ `
  uniform float uAspect;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  void main() {
    vec2 centered = vUv - vec2(0.5);
    centered.x *= uAspect;
    float dist = length(centered);

    float gasNoise = noise(centered * 6.0 - vec2(uTime * 0.5, uTime * 0.5));
    float d = dist + gasNoise * 0.01;

    vec3 whiteCore = vec3(1.0, 1.0, 0.9);
    vec3 sunYellow = vec3(1.0, 0.75, 0.1);

    vec3 color = mix(sunYellow, whiteCore, smoothstep(0.015, 0.00, d));

    // Tight boundaries isolate white/yellow to absolute center.
    // This allows the pink aura underneath to cleanly step out.
    float alpha = smoothstep(0.04, 0.00, d);

    gl_FragColor = vec4(color * 1.5, alpha);
    #include <colorspace_fragment>
  }
`;

// ==========================================
// 3. SCENE COMPONENT
// ==========================================

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

function KiraKiraVortex() {
  const starTex = useMemo(() => createStarTexture(), []);
  const petalTex = useMemo(() => createPetalTexture(), []);
  const blobTex = useMemo(() => createBlobTexture(), []);
  const gradLUT = useMemo(() => createGradientLUT(), []);
  const noiseTex = useMemo(() => createNoiseTexture(), []); 

  const backdropMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
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
      new THREE.ShaderMaterial({
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
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: 0.2 },
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

  const sunMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAspect: { value: window.innerWidth / window.innerHeight },
          uTime: { value: 0 },
        },
        vertexShader: glowVertex,
        fragmentShader: sunFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const raysMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAspect: { value: window.innerWidth / window.innerHeight },
          uTime: { value: 0 },
        },
        vertexShader: glowVertex,
        fragmentShader: raysFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const bridgeMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAspect: { value: window.innerWidth / window.innerHeight },
          uTime: { value: 0 },
        },
        vertexShader: glowVertex,
        fragmentShader: bridgeFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const coreMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAspect: { value: window.innerWidth / window.innerHeight },
          uTime: { value: 0 },
        },
        vertexShader: glowVertex,
        fragmentShader: coreFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const backdropGeo = useMemo(() => new THREE.PlaneGeometry(2, 2), []);

  const paintGeo = useMemo(() => {
    const { pos, rand } = generateInstanceData(PAINT_COUNT, 14.0);
    const geo = new THREE.PlaneGeometry(0.4, 0.4);
    geo.setAttribute("aInitialPos", new THREE.InstancedBufferAttribute(pos, 3));
    geo.setAttribute("aRandoms", new THREE.InstancedBufferAttribute(rand, 3));
    return geo;
  }, []);

  const flareGeo = useMemo(() => {
    const { pos, rand } = generateInstanceData(FLARE_COUNT, 10.0);
    const geo = new THREE.PlaneGeometry(0.3, 0.3);
    geo.setAttribute("aInitialPos", new THREE.InstancedBufferAttribute(pos, 3));
    geo.setAttribute("aRandoms", new THREE.InstancedBufferAttribute(rand, 3));
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      [starTex, petalTex, blobTex, gradLUT, noiseTex].forEach((t) => t.dispose());
      [backdropGeo, paintGeo, flareGeo].forEach((g) => g.dispose());
      [backdropMat, paintMat, flareMat, sunMat, raysMat, bridgeMat, coreMat].forEach((m) =>
        m.dispose(),
      );
    };
  }, [
    starTex,
    petalTex,
    blobTex,
    gradLUT,
    noiseTex,
    backdropGeo,
    paintGeo,
    flareGeo,
    backdropMat,
    paintMat,
    flareMat,
    sunMat,
    raysMat,
    bridgeMat,
    coreMat,
  ]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    paintMat.uniforms.uTime.value = t;
    flareMat.uniforms.uTime.value = t;
    sunMat.uniforms.uTime.value = t;
    raysMat.uniforms.uTime.value = t;
    bridgeMat.uniforms.uTime.value = t;
    coreMat.uniforms.uTime.value = t;
    const aspect = state.size.width / state.size.height;
    sunMat.uniforms.uAspect.value = aspect;
    raysMat.uniforms.uAspect.value = aspect;
    bridgeMat.uniforms.uAspect.value = aspect;
    coreMat.uniforms.uAspect.value = aspect;
    backdropMat.uniforms.uAspect.value = aspect;
  });

  return (
    <>
      <mesh geometry={backdropGeo} material={backdropMat} renderOrder={-1} />

      <instancedMesh
        args={[paintGeo, paintMat, PAINT_COUNT]}
        frustumCulled={false}
      />

      <instancedMesh
        args={[flareGeo, flareMat, FLARE_COUNT]}
        frustumCulled={false}
      />

      <mesh geometry={backdropGeo} material={sunMat} renderOrder={1} />
      <mesh geometry={backdropGeo} material={raysMat} renderOrder={2} />
      <mesh geometry={backdropGeo} material={bridgeMat} renderOrder={3} />
      <mesh geometry={backdropGeo} material={coreMat} renderOrder={4} />
    </>
  );
}

// ==========================================
// 4. FRAME LIMITER + EXPORT
// ==========================================

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
        background: "#01314A",
      }}
    >
      <Canvas
        frameloop="demand"
        camera={{ position: [0, 0, 5], fov: 75 }}
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
