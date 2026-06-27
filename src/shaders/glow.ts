// Layer D: Four stacked fullscreen meshes with additive blending.
// D4 = big pastel sun circle (extra-light.md — wide, FBM noise, breathing)
// D3 = anisotropic light rays (NEW — directional streaks radiating outward)
// D2 = bridge glow (NEW — medium radial fill, connects core to sun)
// D1 = tight ignition core (really-like-it.md — small, bright, hot)
// All use inline GLSL hash/noise (per-pixel, full resolution, no texture tiling).

export const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// ── MERGED GLOW: Sun + Rays + Bridge + Core in a single fullscreen pass ──
// Replaces 4 separate additive-blend passes with 1.
// Each layer's contribution = color * alpha (additive blending math).
// Final output = sum of all 4, alpha=1.0, blended once onto backdrop.
export const glowFragment = /* glsl */ `
  uniform float uAspect;
  uniform float uTime;
  uniform float uCoreBass;    // core — fast bass (smoothing 0.50)
  uniform float uSunBass;     // sun — slow bass (smoothing 0.25)
  uniform float uRaysTreble;  // rays — treble (smoothing 0.40)
  uniform float uBridgeMid;   // bridge — mid (smoothing 0.30)
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

    // Master early-out
    if (dist > 0.42) discard;

    float angle = atan(centered.y, centered.x);
    vec3 totalColor = vec3(0.0);

    // ══════ D4: SUN ══════
    {
      float gasNoise = fbm(centered * 4.0 - vec2(uTime * 0.3, uTime * 0.3));
      float ripple = fbm(vec2(angle * 3.0, uTime * 0.6)) * 0.02;
      float d = dist + ripple;

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

      // Audio: slow bass gently intensifies the sun — subtle breathing
      glow *= 1.0 + uSunBass * 0.15;

      totalColor += color * glow * alpha;
    }

    // ══════ D3: RAYS ══════
    {
      float a = angle + uTime * 0.03;
      float rays = pow(0.5 + 0.5 * sin(a * 6.0), 8.0);
      rays += pow(0.5 + 0.5 * sin(a * 13.0 + 1.5), 16.0) * 0.4;

      float n = noise(vec2(angle * 5.0, uTime * 0.2));
      rays *= 0.6 + n * 0.8;

      float distFade = smoothstep(0.42, 0.06, dist) * smoothstep(0.0, 0.02, dist);

      vec3 rayColor = mix(
        vec3(1.0, 0.88, 0.3),
        vec3(1.0, 0.4, 0.6),
        smoothstep(0.05, 0.3, dist)
      );

      float alpha = rays * distFade * 0.2;

      // Audio: treble gently sharpens rays
      alpha *= 1.0 + uRaysTreble * 0.3;

      totalColor += rayColor * alpha * alpha;
    }

    // ══════ D2: BRIDGE ══════
    if (dist < 0.25) {
      float gasNoise = noise(centered * 4.0 - vec2(uTime * 3.0));
      float d = dist + gasNoise * 0.012;

      vec3 whiteCore = vec3(1.0, 0.90, 0.0);
      vec3 gold      = vec3(1.0, 0.70, 0.0);
      vec3 softPink  = vec3(0.992, 0.682, 0.761);

      vec3 color = softPink;
      color = mix(color, gold,      smoothstep(0.15, 0.06, d));
      color = mix(color, whiteCore, smoothstep(0.04, 0.0, d));

      float glow = exp(-d * 6.0);
      float alpha = smoothstep(0.25, 0.05, d);

      // Audio: mid gently pulses the bridge
      glow *= 1.0 + uBridgeMid * 0.1;

      totalColor += color * glow * 0.8 * alpha * 0.5;
    }

    // ══════ D1: CORE ══════
    if (dist < 0.17) {
      float gasNoise = noise(centered * 6.0 - vec2(uTime * 0.5, uTime * 0.5));
      float d = dist + gasNoise * 0.01;

      vec3 softPink  = vec3(1.0, 0.92, 0.0);
      vec3 whiteCore = vec3(1.0, 1.0, 0.9);
      vec3 sunYellow = vec3(1.0, 0.85, 0.15);

      vec3 color = softPink;
      color = mix(color, sunYellow, smoothstep(0.10, 0.03, d));
      color = mix(color, whiteCore, smoothstep(0.01, 0.00, d));

      float alpha = smoothstep(0.17, 0.01, d);

      // Audio: core is the main responder — fast bass makes the heart pulse
      float coreBoost = 1.6 + uCoreBass * 0.3;

      totalColor += color * coreBoost * alpha;
    }

    if (dot(totalColor, totalColor) < 0.000001) discard;

    gl_FragColor = vec4(totalColor, 1.0);

    #include <colorspace_fragment>
  }
`;
