// Layer C: Radiant star flares (additive blending)
// Audio: per-instance twinkle only — ~40% of flares flash on treble,
// rest stay completely still. No uniform reactivity.
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
    // Per-instance: reactive flares scale up, non-reactive stay constant
    float reactive = smoothstep(0.6, 0.85, vColorMix);
    float audioScale = 1.0 + uTreble * reactive * 0.4;
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
  varying vec2 vUv;
  varying float vDepth;
  varying float vColorMix;
  varying float vTreblePulse;

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
    // ONLY reactive flares flash — 60% stay at baseline color
    float reactive = smoothstep(0.6, 0.85, vColorMix);
    glow *= 1.0 + vTreblePulse * reactive * 0.6;

    float alphaFade = smoothstep(1.0, 0.80, vDepth);
    gl_FragColor = vec4(glow, texColor.a * alphaFade);

    #include <colorspace_fragment>
  }
`;
