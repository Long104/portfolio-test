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

    // Dark nebula — warm rose center → desaturates through mauve/gray → cool teal edge
    // All colors stay in dark range (0.04–0.18) so additive glow layers don't blow out
    vec3 darkVoid = vec3(0.08, 0.00, 0.06);   // dark pink void
    vec3 c1       = vec3(0.16, 0.02, 0.08);   // dark rose
    vec3 c2       = vec3(0.14, 0.04, 0.10);   // dark mauve
    vec3 c3       = vec3(0.12, 0.06, 0.10);   // grayish mauve
    vec3 c4       = vec3(0.10, 0.08, 0.10);   // dark neutral gray
    vec3 c5       = vec3(0.08, 0.10, 0.12);   // gray-blue
    vec3 c6       = vec3(0.04, 0.12, 0.14);   // dark teal

    vec3 color = mix(darkVoid, c1, smoothstep(0.0, 0.08, dist));
    color = mix(color, c2, smoothstep(0.08, 0.18, dist));
    color = mix(color, c3, smoothstep(0.18, 0.28, dist));
    color = mix(color, c4, smoothstep(0.28, 0.40, dist));
    color = mix(color, c5, smoothstep(0.40, 0.55, dist));
    color = mix(color, c6, smoothstep(0.55, 0.75, dist));

    // Audio: bass makes the void breathe — barely perceptible
    color *= 1.0 + uBass * 0.06;

    gl_FragColor = vec4(color, 1.0);

    #include <colorspace_fragment>
  }
`;
