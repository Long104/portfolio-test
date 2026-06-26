import { useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ==========================================
// 1. PROCEDURAL TEXTURES (Crisp, Painterly Elements)
// ==========================================

function createStarTexture() {
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

function createPetalTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // Solid oval shapes for crisp anime paint chunks
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.ellipse(c, c, c * 0.85, c * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createBlobTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // Clean, dark bubble/blob silhouettes
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(c, c, c * 0.9, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ==========================================
// 2. SHADERS (Restructured Layering)
// ==========================================

const backdropVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Pure, intense Mint-to-Teal Tunnel backdrop (No pink/white blankets!)
const backdropFragment = /* glsl */ `
  uniform float uAspect;
  varying vec2 vUv;
  void main() {
    vec2 centered = vUv - vec2(0.5);
    centered.x *= uAspect;
    float dist = length(centered);

    // The precise hex-equivalent palette from the reference image
    vec3 vortexCenter = vec3(0.00, 0.06, 0.08); // #001014 Deep Void right behind the explosion
    vec3 magicalMint  = vec3(0.05, 0.89, 0.71); // #0ce3b6 Vibrant glowing water ring
    vec3 outerTeal    = vec3(0.00, 0.16, 0.18); // #012a2e Rich dark sea edge

    // Smooth gradient mapping creating a beautiful vignette tunnel effect
    vec3 color = mix(vortexCenter, magicalMint, smoothstep(0.0, 0.35, dist));
    color = mix(color, outerTeal, smoothstep(0.4, 0.95, dist));

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

    // Fast, continuous tunnel suction flow
    pos.z += uTime * uSpeed * (0.9 + aRandoms.x * 0.4);
    pos.z = mod(pos.z + 60.0, 70.0) - 60.0;

    // Tighten clearance to pack particles densely into the center core explosion
    float r = length(pos.xy);
    if (r < 1.5) pos.xy = normalize(pos.xy + 0.001) * (1.5 + aRandoms.x * 2.0);

    // Wavy, organic fluid movement path
    float wave = sin(pos.z * 0.15 + uTime * 1.5 + aRandoms.y * 6.28) * 0.6;
    pos.x += cos(wave) * 0.4;
    pos.y += sin(wave) * 0.4;

    vDepth = clamp((pos.z + 60.0) / 65.0, 0.0, 1.0);

    // Scale mapping (tiny at depth, big and sharp when close)
    float baseScale = (vType < 0.60) ? 1.6 : 3.2; 
    float scale = baseScale * (0.15 + pow(vDepth, 3.5) * 18.0);

    // Continuous spin transformation
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
  varying vec2 vUv;
  varying float vType;
  varying float vDepth;

  void main() {
    vec4 texColor;
    vec3 finalColor;

    // Group allocation creating the chaotic, solid splatters
    if (vType < 0.55) {
      // 1. Vibrant neon coral-pink particles/splatters
//fix
      // texColor = texture2D(uTexPetal, vUv);
      finalColor = mix(vec3(1.0, 0.25, 0.48), vec3(1.0, 0.55, 0.70), vDepth);
    } else if (vType < 0.65) {
      // 2. Added Sun-Yellow paint bits exploding right out of the center core
//fix
      // texColor = texture2D(uTexPetal, vUv);
      finalColor = mix(vec3(1.0, 0.92, 0.30), vec3(1.0, 1.0, 0.70), vDepth);
    } else {
      // 3. Ultra-dark crisp framing silhouettes (Creates massive 2.5D depth layers)
//fix
      texColor = texture2D(uTexBlob, vUv);
      finalColor = mix(vec3(0.00, 0.08, 0.10), vec3(0.00, 0.02, 0.04), vDepth);
    }

    if (texColor.a < 0.1) discard; // Strict masking alpha edge to stay crisp

    float alphaFade = smoothstep(1.0, 0.88, vDepth);
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

    pos.z += uTime * uSpeed * (1.2 + aRandoms.y * 0.6);
    pos.z = mod(pos.z + 60.0, 70.0) - 60.0;

    vDepth = clamp((pos.z + 60.0) / 65.0, 0.0, 1.0);
    float scale = 0.4 * (0.1 + pow(vDepth, 2.0) * 8.0);

    // Directional motion streak stretching out from center
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

    // Light-dappling array: Mixes bright spark streaks with glowing mint accents
    vec3 colors[4] = vec3[4](
      vec3(1.0, 1.0, 0.5),        // Core Bright Yellow
      vec3(1.0, 0.4, 0.6),        // Hot Pink Streak
      vec3(0.1, 0.95, 0.85),       // Magical Mint Caustic Dapple (Matches background!)
      vec3(1.0, 1.0, 1.0)         // Incandescent White Spark
    );
    
    int index = int(floor(vColorMix * 4.0));
    vec3 glow = colors[index];

    float alphaFade = smoothstep(1.0, 0.82, vDepth);
    gl_FragColor = vec4(glow * 1.5, texColor.a * alphaFade);

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

// Strictly isolated fiery core (Now condensed so it doesn't block the background!)
const glowFragment = /* glsl */ `
  uniform float uAspect;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
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
    vec3 sunYellow = vec3(1.0, 0.80, 0.1);
    vec3 neonPink  = vec3(0.95, 0.15, 0.45);

    // Kept inside a tight radial boundary so it forms the clean center core ignition point
    vec3 color = neonPink;
    color = mix(color, sunYellow, smoothstep(0.08, 0.04, d));
    color = mix(color, whiteCore, smoothstep(0.03, 0.00, d));

    // Tight falloff boundary
    float alpha = smoothstep(0.12, 0.01, d);

    gl_FragColor = vec4(color * 1.3, alpha);
    #include <colorspace_fragment>
  }
`;

// ==========================================
// 3. SCENE COMPONENT
// ==========================================

const PAINT_COUNT = 6000; // Increased instance count for dense splatter
const FLARE_COUNT = 2500; 

function generateInstanceData(count: number, maxRadius: number) {
  const pos = new Float32Array(count * 3);
  const rand = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Spawns a high concentration of elements right inside the core vector
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
  const starTex = useMemo(() => createStarTexture(), []);
  const petalTex = useMemo(() => createPetalTexture(), []);
  const blobTex = useMemo(() => createBlobTexture(), []);

  const backdropMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uAspect: { value: 1.0 } },
    vertexShader: backdropVertex,
    fragmentShader: backdropFragment,
    depthWrite: false,
    depthTest: false,
  }), []);

  const paintMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: 0.18 },
      uTexPetal: { value: petalTex },
      uTexBlob: { value: blobTex },
    },
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    transparent: true,
    depthWrite: false,
  }), [petalTex, blobTex]);

  const flareMat = useMemo(() => new THREE.ShaderMaterial({
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
  }), [starTex]);

  const glowMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uAspect: { value: 1.0 },
      uTime: { value: 0 },
    },
    vertexShader: glowVertex,
    fragmentShader: glowFragment,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  }), []);

  const backdropGeo = useMemo(() => new THREE.PlaneGeometry(2, 2), []);

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
      <mesh geometry={backdropGeo} material={backdropMat} renderOrder={-2} />
      <instancedMesh args={[paintGeo, paintMat, PAINT_COUNT]} frustumCulled={false} renderOrder={-1} />
      <instancedMesh args={[flareGeo, flareMat, FLARE_COUNT]} frustumCulled={false} renderOrder={0} />
      <mesh geometry={backdropGeo} material={glowMat} renderOrder={1} />
    </>
  );
}

// ==========================================
// 4. EXPORT
// ==========================================

export default function Scene() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#000508" }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 74 }}>
        <KiraKiraVortex />
      </Canvas>
    </div>
  );
}
