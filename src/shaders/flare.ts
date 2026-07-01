// Layer C: Radiant star flares (additive blending)
// AUDIO STRATEGY: near-dark at rest (×0.12). ~65% flash bright on treble.
// Punchy starburst effect — flares explode on hi-hats and synths.
export const flareVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uTreble;
  attribute vec3 aInitialPos;
  attribute vec3 aRandoms;
  varying vec2 vUv;
  varying float vDepth;
  varying float vColorMix;
  varying float vTreblePulse;

  void main() {
    vUv = uv;
    vColorMix = aRandoms.x;
    vec3 pos = aInitialPos;

    // Constant speed — no audio
    pos.z += uTime * uSpeed * (1.2 + aRandoms.x * 0.5);
    pos.z = mod(pos.z + 60.0, 70.0) - 60.0;

    float r = length(pos.xy);
    if (r < 4.0) pos.xy = normalize(pos.xy + 0.001) * (4.0 + aRandoms.x * 2.0);

    vDepth = clamp((pos.z + 60.0) / 65.0, 0.0, 1.0);
    // ~65% reactive flares scale up on treble
    float reactive = smoothstep(0.3, 0.6, vColorMix);
    float audioScale = 1.0 + uTreble * reactive * 0.6;
    float scale = 0.5 * (0.2 + vDepth * vDepth * sqrt(vDepth) * 6.0) * audioScale;

    // Radial forward-motion streak
    vec3 transformed = position;
    vec2 dir = normalize(pos.xy + 0.001);
    float stretch = 1.0 + (vDepth * 3.0);
    transformed.xy += dir * dot(transformed.xy, dir) * (stretch - 1.0);

    vTreblePulse = uTreble;

    vec4 mvPos = modelViewMatrix * vec4(pos + transformed * scale, 1.0);
    gl_Position = projectionMatrix * mvPos;
  }
`;

export const flareFragment = /* glsl */ `
  uniform sampler2D uTexStar;
  uniform sampler2D uColorLUT;
  varying vec2 vUv;
  varying float vDepth;
  varying float vColorMix;
  varying float vTreblePulse;

  void main() {
     vec4 texColor = texture2D(uTexStar, vUv);

    vec3 glow = texture2D(uColorLUT, vec2(vColorMix, 0.5)).rgb;

    // Near-dark at rest (×0.12). Reactive flares explode on treble.
    float reactive = smoothstep(0.3, 0.6, vColorMix);
    glow *= 0.12 + vTreblePulse * reactive * 2.0;

    float alphaFade = smoothstep(1.0, 0.80, vDepth);
    gl_FragColor = vec4(glow, texColor.a * alphaFade);

    #include <colorspace_fragment>
  }
`;
