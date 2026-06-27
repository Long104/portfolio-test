import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  CanvasTexture,
  InstancedBufferAttribute,
  LinearFilter,
  PlaneGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
} from "three";

// ==========================================
// 1. PROCEDURAL TEXTURES (Canvas-based)
//    White alpha masks — coloring is done
//    in the fragment shaders.
// ==========================================

function createStarTexture(): Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // Radial glow core
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.5);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.2, "rgba(255,255,220,0.9)");
  grad.addColorStop(0.5, "rgba(255,230,150,0.3)");
  grad.addColorStop(1, "rgba(255,230,150,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Cross-shaped star spikes
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

  const tex = new CanvasTexture(canvas);
  tex.generateMipmaps = false;
  tex.minFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function createPetalTexture(): Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // Soft radial alpha mask
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.65);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.8)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.3)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new CanvasTexture(canvas);
  tex.generateMipmaps = false;
  tex.minFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function createBlobTexture(): Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // Larger, softer blob
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.85);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.6)");
  grad.addColorStop(0.6, "rgba(255,255,255,0.25)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c, c, c * 0.85, 0, Math.PI * 2);
  ctx.fill();

  const tex = new CanvasTexture(canvas);
  tex.generateMipmaps = false;
  tex.minFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// 15-stop depth gradient baked into a 256×1 LUT.
// Edit colors here — no shader changes ever needed.
function createGradientLUT(): Texture {
  const w = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;

  // vec3(0.002, 0.025, 0.054) // #072D42
  // vec3(0.0003, 0.046, 0.081) // #013D50
  // vec3(0.0003, 0.083, 0.139) // #015168
  // vec3(0.003, 0.155, 0.208) // #086E7E
  // vec3(0.002, 0.191, 0.239) //  #077986
  // vec3(0.004, 0.308, 0.357) // #0D96A1
  // vec3(0.029, 0.497, 0.503) // #30BBBC
  // vec3(0.164, 0.644, 0.672) // #71D2D6
  // vec3(0.318, 0.657, 0.637) // #98D4D1
  // vec3(0.479, 0.644, 0.665) // #B8D2D5
  // vec3(0.686, 0.630, 0.694) // #D8D0D9
  // vec3(0.930, 0.474, 0.672) // #F7B7D6
  // vec3(0.991, 0.418, 0.497) // #FEADBB
  // vec3(0.991, 0.982, 0.247) // #FEFD88
  // vec3(0.991, 1.000, 0.455) // #FEFFB4
  // vec3(0.991, 0.982, 0.930) // #FEFDF7
  // vec3 mintGlow    = vec3(0.047, 0.890, 0.714); // #0CE3B6
  const stops: [number, string][] = [
    // freah
    // [0.0, "#FEFDF7"], // whiteCore
    // [0.03, "#FEFFB4"], // whiteCore
    // [0.071, "#FEFD88"], // coreYellow
    // [0.132, "#FF3366"], // freshHotPink - Ultra-vivid, neon-leaning hot pink
    // [0.260, "#FFB347"], // freshAmber - Bright, juicy, saturated neon amber
    // [0.420, "#F7B7D6"], // coral
    // [0.386, "#D8D0D9"], // hotPink
    // [0.757, "#B8D2D5"], // magenta
    // [0.729, "#98D4D1"], // orchid
    // [0.480, "#0CE3B6"], // mintGlow - Kept original (already fresh)
    // [0.5, "#71D2D6"], // spring
    // [0.571, "#30BBBC"], // mintGlow
    // [0.643, "#0D96A1"], // aqua
    // [0.714, "#077986"], // seafoam
    // [0.786, "#086E7E"], // deepTeal
    // [0.857, "#015168"], // deepBlue
    // [0.929, "#013D50"], // darkForest
    // [0.945, "#005F73"], // freshDarkJade - Cleaner, deep teal-cyan without the muddy gray tones
    // [0.857, "#0A2533"], // freshNearBlack - Deep midnight blue-green base
    // [0.929, "#05131C"], // freshAlmostBlack - Extremely dark, rich cyber-tinted shadow
    // [1.0, "#01080C"], // freshDeepBlack - Crisp, high-contrast final stop

    // recommend
    // [0.0,   "#FFFEF0"], // whiteCore
    // [0.030, "#FFF78A"], // warmYellow
    // [0.071, "#FFE040"], // vividYellow
    // [0.143, "#FFB06A"], // peach
    // [0.214, "#FF7F9C"], // vividPink
    // [0.286, "#D65A8A"], // deepRose
    // [0.357, "#40C4C6"], // brightTeal (skip the gray zone)
    // [0.429, "#1AACB2"], // saturatedTeal
    // [0.5,   "#0C8E98"], // teal
    // [0.571, "#07717C"], // deepTeal
    // [0.643, "#045560"], // darkerTeal
    // [0.714, "#023A46"], // darkBlue
    // [0.786, "#01242E"], // veryDark
    // [0.857, "#01141C"], // nearBlack
    // [0.929, "#000A10"], // almostBlack
    // [1.0,   "#000508"], // deepBlack

    // too real

    [0.0, "#FEFDF7"], // whiteCore
    [0.03, "#FEFFB4"], // whiteCore
    [0.071, "#FEFD88"], // coreYellow
    [0.132, "#FF9093"], // hotPink
    [0.467, "#FEADBB"], // amber
    [0.532, "#0CE3B6"], // mintGlow
    // [0.5, "#71D2D6"], // spring
    // [0.571, "#30BBBC"], // mintGlow
    // [0.643, "#0D96A1"], // aqua
    // [0.714, "#077986"], // seafoam
    // [0.7424, "#086E7E"], // deepTeal
    [0.786, "#015168"], // blueBlue
    [0.857, "#00161d"], // deepBlue
    // [0.857, "#01141C"], // nearBlack
    [0.929, "#013D50"], // darkForest
    [0.945, "#072D42"], // darkJade
    [1.0, "#000508"], // deepBlack


    // here
// [0.857, "#00161d"], // deepBlue
//     // [0.857, "#01141C"], // nearBlack
//     [0.929, "#013D50"], // darkForest
//     [0.945, "#072D42"], // darkJade
//     [0.929, "#000A10"], // almostBlack
//     [1.0, "#000508"], // deepBlack

// [0.857, "#00161d"], // deepBlue
//     // [0.857, "#01141C"], // nearBlack
//     [0.929, "#013D50"], // darkForest
//     [0.945, "#072D42"], // darkJade
//     [0.929, "#000A10"], // almostBlack
//     [1.0, "#000508"], // deepBlack

// •	Slightly Darker: [0.900, "#013b4c"], // deeperBlue
// •	Much Darker (Midnight Teal): [0.950, "#002b38"], // midnightTeal
// •	Near Black (Deep Abyss): [0.980, "#00161d"], // abyssBlue
    // test
    // [0.0, "#FFFEF0"], // whiteCore
    // [0.071, "#FFF529"], // coreYellow
    // [0.143, "#FFB45A"], // amber
    // [0.214, "#FF8A6E"], // coral
    // [0.286, "#FD6982"], // hotPink
    // [0.357, "#EB4A94"], // magenta
    // [0.429, "#9E61B8"], // orchid
    // [0.5, "#4DB39E"], // spring
    // [0.571, "#0CE3B6"], // mintGlow
    // [0.643, "#05949E"], // aqua
    // [0.714, "#015161"], // seafoam
    // [0.786, "#012E42"], // deepTeal
    // [0.857, "#001523"], // deepBlue
    // [0.929, "#00060E"], // darkForest
    // [1.0, "#000208"], // darkJade
  ];

  const grad = ctx.createLinearGradient(0, 0, w, 0);
  for (const [offset, color] of stops) grad.addColorStop(offset, color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, 1);

  const tex = new CanvasTexture(canvas);
  tex.minFilter = LinearFilter; // GPU interpolates between stops for free
  tex.magFilter = LinearFilter;

  // old
  // tex.colorSpace = LinearSRGBColorSpace; // raw values — no sRGB linearization
  // To this:
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// ==========================================
// 2. SHADERS
// ==========================================

// Layer A: Static fullscreen backdrop (prevents black hole)
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
    // Center coordinate space + correct for aspect ratio (matches glow shader)
    vec2 centered = vUv - vec2(0.5);
    centered.x *= uAspect;
    float dist = length(centered);

    // Pink center — base layer is pink so additive glow layers amplify pink, not fight teal
    vec3 darkPink = vec3(0.08, 0.0, 0.06);   // dark pink void
    vec3 midAura  = vec3(0.15, 0.02, 0.12);  // deep pink aura
    vec3 mint     = vec3(0.047, 0.89, 0.714); // #0ce3b6 — teal kicks in further out
    vec3 teal     = vec3(0.004, 0.165, 0.18); // #012a2e — outer tunnel

    vec3 color = mix(darkPink, midAura, smoothstep(0.0, 0.30, dist));
    color = mix(color, mint, smoothstep(0.30, 0.55, dist));
    if (dist > 0.60) color = mix(color, teal, smoothstep(0.60, 1.0, dist));

    gl_FragColor = vec4(color, 1.0);

    #include <colorspace_fragment>
  }
`;

// Layer B: Fluid particles (petals + blobs, normal alpha blending)
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

    // Z-Axis flow (sucking-in effect)
    pos.z += uTime * uSpeed * (0.8 + aRandoms.x * 0.4);
    pos.z = mod(pos.z + 60.0, 70.0) - 60.0;

    // Center clearance — keep the glowing core visible
    float r = length(pos.xy);
    if (r < 5.0) pos.xy = normalize(pos.xy + 0.001) * (5.0 + aRandoms.x * 3.0);

    // Liquid water-flow math (sine/cosine offset X/Y paths)
    float wave = sin(pos.z * 0.1 + uTime + aRandoms.y * 6.28) * 0.5;
    pos.x += cos(wave) * 0.5;
    pos.y += sin(wave) * 0.5;

    vDepth = pow(clamp((pos.z + 60.0) / 65.0, 0.0, 1.0), 1.6);

    // Scale: microscopic far away, massive near camera
    float baseScale = (vType < 0.5) ? 1.0 : 2.5;
    float scale = baseScale * (0.2 + vDepth * vDepth * vDepth * 15.0);


    // Spin particles along the current
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

    // make it less
    // if (vType < 0.15) {
    if (vType < 0.5) {
      // Ghost-teal petals — semi-transparent liquid glass
      texColor = texture2D(uTexPetal, vUv);
      finalColor = vec3(0.106, 0.737, 0.698); // #1BBCB2
      texColor.a *= 0.18;
    } else {
      // Dark framing blobs — color from baked 15-stop depth gradient LUT.
      // Edit palette in createGradientLUT(), never touch this shader.
      texColor = texture2D(uTexBlob, vUv);
      finalColor = texture2D(uGradLUT, vec2(vDepth, 0.5)).rgb;
    }

    // Proximity fade — disappear at camera lens to prevent screen blocking
    float alphaFade = smoothstep(1.0, 0.85, vDepth);
    gl_FragColor = vec4(finalColor, texColor.a * alphaFade);

    #include <colorspace_fragment>
  }
`;

// Layer C: Radiant star flares (additive blending)
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
    float scale = 0.5 * (0.2 + vDepth * vDepth * sqrt(vDepth) * 6.0);

    // Radial forward-motion streak
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

    vec3 colors[10] = vec3[10](
      vec3(0.938, 0.278, 0.386),    // #F890A8 Vibrant Soft Pink
      vec3(0.947, 0.481, 0.584),    // #F9B9CA Pastel Rose
      vec3(0.262, 1.000, 0.320),    // #8CFF96 Bright Mint Green
      vec3(0.850, 1.000, 0.448),    // #EDFFB6 Soft Lime Yellow
      vec3(0.612, 1.000, 0.402),    // #D0FFAF Mint Yellow
      vec3(0.984, 0.694, 0.761),    // #FEDBE4 Blush Pink
      vec3(1.000, 1.000, 0.448),    // #FFFFB6 Pastel Yellow
      vec3(0.973, 0.612, 0.694),    // #FDD0DA Light Sakura
      vec3(0.947, 0.247, 0.347),    // #FB889E Neon Deep Pink
      vec3(1.000, 0.973, 0.612)     // #FFFDDA Warm Cream
    );

    int index = int(floor(vColorMix * 10.0));
    index = clamp(index, 0, 9);

    vec3 glow = colors[index];

    float alphaFade = smoothstep(1.0, 0.80, vDepth);
    gl_FragColor = vec4(glow, texColor.a * alphaFade);

    #include <colorspace_fragment>
  }
`;

// Layer D: Four stacked fullscreen meshes with additive blending.
// D4 = big pastel sun circle (extra-light.md — wide, FBM noise, breathing)
// D3 = anisotropic light rays (NEW — directional streaks radiating outward)
// D2 = bridge glow (NEW — medium radial fill, connects core to sun)
// D1 = tight ignition core (really-like-it.md — small, bright, hot)
// All use inline GLSL hash/noise (per-pixel, full resolution, no texture tiling).

const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Shared GLSL noise functions — duplicated in each shader (no cross-shader sharing)
// hash + value noise = organic, non-repeating, full resolution

// ── D4: SUN — big pastel circle (from extra-light.md) ──
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

    // Early out — skip expensive FBM for pixels outside sun radius
    float maxAlpha = smoothstep(0.42, 0.06, dist) * 0.2;
    if (maxAlpha < 0.001) discard;

    float angle = atan(centered.y, centered.x);

    // Fluid gas noise — FBM for rich, layered turbulence
    float gasNoise = fbm(centered * 4.0 - vec2(uTime * 0.3, uTime * 0.3));
    float ripple = fbm(vec2(angle * 3.0, uTime * 0.6)) * 0.02;
    float d = dist + ripple;

    // Sun palette (outside → inside) — pink outside, yellow center
    vec3 whiteCore = vec3(1.0, 0.95, 0.0);
    vec3 yellow    = vec3(1.0, 0.85, 0.0);
    vec3 midPink   = vec3(1.0, 0.08, 0.58);
    vec3 outerEdge = vec3(1.0, 0.0, 0.2);

    vec3 color = outerEdge;
    color = mix(color, midPink,   smoothstep(0.15, 0.025, d + gasNoise * 0.015));
    color = mix(color, yellow,    smoothstep(0.09, 0.03, d + gasNoise * 0.015));
    color = mix(color, whiteCore, smoothstep(0.02, 0.0, d + gasNoise * 0.015));

    float glow = min(exp(-d * 8.0) + 0.4, 0.85);
    float alpha = smoothstep(0.42, 0.06, d) * (0.1 + gasNoise * 0.1);

    if (alpha < 0.001) discard;

    gl_FragColor = vec4(color * glow, alpha);

    #include <colorspace_fragment>
  }
`;

// ── D3: RAYS — anisotropic light streaks radiating from center (NEW) ──
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

    // Early out — rays only exist within radius 0.42
    if (dist > 0.42) discard;

    float angle = atan(centered.y, centered.x);

    // Slow rotation — barely perceptible drift
    float a = angle + uTime * 0.03;
    // Primary rays (6) + secondary rays (13) — pow sharpens to thin streaks
    float rays = pow(0.5 + 0.5 * sin(a * 6.0), 8.0);
    rays += pow(0.5 + 0.5 * sin(a * 13.0 + 1.5), 16.0) * 0.4;

    // Noise variation — breaks perfect symmetry, adds organic flicker
    float n = noise(vec2(angle * 5.0, uTime * 0.2));
    rays *= 0.6 + n * 0.8;

    // Distance falloff — visible from core edge to mid-radius
    float distFade = smoothstep(0.42, 0.06, dist) * smoothstep(0.0, 0.02, dist);

    // Warm color — yellow near center, pink at outer edges
    vec3 rayColor = mix(
      vec3(1.0, 0.88, 0.3),    // warm yellow
      vec3(1.0, 0.4, 0.6),     // soft pink
      smoothstep(0.05, 0.3, dist)
    );

    float alpha = rays * distFade * 0.2;

    if (alpha < 0.001) discard;

    gl_FragColor = vec4(rayColor * alpha, alpha);


    #include <colorspace_fragment>
  }
`;

// ── D2: BRIDGE — medium radial glow filling gap between core and sun (NEW) ──
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

    // Early out — bridge only exists within radius 0.25
    if (dist > 0.25) discard;

    float gasNoise = noise(centered * 4.0 - vec2(uTime * 0.2));
    float d = dist + gasNoise * 0.012;

    // Bridge palette — #FDAEC2 aura connects core to sun
    vec3 whiteCore = vec3(1.0, 0.90, 0.0);
    vec3 gold      = vec3(1.0, 0.70, 0.0);
    vec3 softPink  = vec3(0.992, 0.682, 0.761);

    vec3 color = softPink;
    color = mix(color, gold,      smoothstep(0.15, 0.06, d));
    color = mix(color, whiteCore, smoothstep(0.04, 0.0, d));

    float glow = exp(-d * 6.0);
    float alpha = smoothstep(0.25, 0.05, d);

    if (alpha < 0.001) discard;

    gl_FragColor = vec4(color * glow * 0.8, alpha * 0.5);

    #include <colorspace_fragment>
  }
`;

// ── D1: CORE — tight ignition point (from really-like-it.md) ──
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

    // Early out — core only exists within radius 0.15
    if (dist > 0.15) discard;

    float gasNoise = noise(centered * 6.0 - vec2(uTime * 0.5, uTime * 0.5));
    float d = dist + gasNoise * 0.01;

    // Core palette (outside → inside) — yellow dominant, white pinpoint center
    vec3 softPink  = vec3(1.0, 0.92, 0.0);
    vec3 whiteCore = vec3(1.0, 1.0, 0.9);
    vec3 sunYellow = vec3(1.0, 0.85, 0.15);

    vec3 color = softPink;
    color = mix(color, sunYellow, smoothstep(0.10, 0.03, d));
    color = mix(color, whiteCore, smoothstep(0.01, 0.00, d));

    float alpha = smoothstep(0.17, 0.01, d);

    if (alpha < 0.001) discard;

    gl_FragColor = vec4(color * 1.3, alpha);

    #include <colorspace_fragment>
  }
`;

// ==========================================
// 3. SCENE COMPONENT
// ==========================================

// --- Adaptive perf tier (replaces hardcoded counts) ---
// Cheap heuristic: UA + cores + RAM. Good enough before first frame;
// R3F `performance` prop then drops DPR further if FPS dips at runtime.
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

  // D4: Sun — big pastel circle
  const sunMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uAspect: { value: window.innerWidth / window.innerHeight },
          uTime: { value: 0 },
        },
        vertexShader: glowVertex,
        fragmentShader: sunFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: AdditiveBlending,
      }),
    [],
  );

  // D3: Rays — anisotropic light streaks
  const raysMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uAspect: { value: window.innerWidth / window.innerHeight },
          uTime: { value: 0 },
        },
        vertexShader: glowVertex,
        fragmentShader: raysFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: AdditiveBlending,
      }),
    [],
  );

  // D2: Bridge — medium radial glow
  const bridgeMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uAspect: { value: window.innerWidth / window.innerHeight },
          uTime: { value: 0 },
        },
        vertexShader: glowVertex,
        fragmentShader: bridgeFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: AdditiveBlending,
      }),
    [],
  );

  // D1: Core — tight ignition
  const coreMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uAspect: { value: window.innerWidth / window.innerHeight },
          uTime: { value: 0 },
        },
        vertexShader: glowVertex,
        fragmentShader: coreFragment,
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
    const { pos, rand } = generateInstanceData(PAINT_COUNT, 14.0);
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
        [starTex, petalTex, blobTex, gradLUT].forEach((t) =>
          t.dispose(),
        );
        [backdropGeo, paintGeo, flareGeo].forEach((g) => g.dispose());
        [
          backdropMat,
          paintMat,
          flareMat,
          sunMat,
          raysMat,
          bridgeMat,
          coreMat,
        ].forEach((m) => m.dispose());
      });
    };
  }, []);

  // --- Animation loop ---
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
      {/* 1. Backdrop (Far distance void) */}
      <mesh geometry={backdropGeo} material={backdropMat} renderOrder={-5} />

      {/* 2. Fullscreen Glow Clouds & Sun Layers (Moved BEHIND the particles) */}
      <mesh geometry={backdropGeo} material={sunMat} renderOrder={-4} />
      <mesh geometry={backdropGeo} material={raysMat} renderOrder={-3} />
      <mesh geometry={backdropGeo} material={bridgeMat} renderOrder={-2} />
      <mesh geometry={backdropGeo} material={coreMat} renderOrder={-1} />

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

// ==========================================
// 4. FRAME LIMITER + EXPORT
// ==========================================

// Caps render rate to 30fps using requestAnimationFrame (vsync-aligned).
// In frameloop="demand" mode, R3F only renders when invalidate() is called,
// so the GPU genuinely idles between frames instead of spinning at 60-120fps.
// rAF auto-pauses when the tab is hidden — no manual visibility handling needed.
function FrameLimiter({ fps = 30 }: { fps?: number }) {
  const invalidate = useThree((state) => state.invalidate);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const interval = 1000 / fps;

    function loop(now: number) {
      rafRef.current = requestAnimationFrame(loop);
      const elapsed = now - lastTimeRef.current;
      if (elapsed >= interval) {
        // Reset with remainder to avoid drift
        lastTimeRef.current = now - (elapsed % interval);
        invalidate();
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      } else {
        if (rafRef.current === null) {
          lastTimeRef.current = 0;
          rafRef.current = requestAnimationFrame(loop);
        }
      }
    }

    rafRef.current = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
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
        // background: "#000406",
        // background: "#032034",
        background: "#01314A",
      }}
    >
      <Canvas
        frameloop="demand"
        camera={{ position: [0, 0, 5], fov: 75 }}
        dpr={PERF_TIER === "mobile" ? 1 : [1, MAX_DPR]}
        gl={{
          antialias: false, // additive particles + glow — MSAA is wasted cost
          powerPreference: "high-performance",
          alpha: false,
        }}
        performance={{ min: 0.5 }} // R3F adaptive: drops DPR if FPS dips
      >
        <FrameLimiter fps={30} />
        <KiraKiraVortex />
      </Canvas>
    </div>
  );
}
