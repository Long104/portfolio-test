// Layer A: Static fullscreen backdrop (prevents black hole)
export const backdropVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const backdropFragment = /* glsl */ `
  uniform float uAspect;
  uniform float uBass;
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

    vec3 color = mix(darkPink, midAura, smoothstep(0.0, 0.15, dist));
    color = mix(color, mint, smoothstep(0.15, 0.35, dist));
    if (dist > 0.40) color = mix(color, teal, smoothstep(0.40, 0.70, dist));

    // Audio: bass makes the void breathe — barely perceptible
    color *= 1.0 + uBass * 0.03;

    gl_FragColor = vec4(color, 1.0);

    #include <colorspace_fragment>
  }
`;
