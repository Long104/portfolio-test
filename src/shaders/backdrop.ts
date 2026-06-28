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

    // Dark void at center → blooms through warm pinks → desaturates to gray → cools to teal edge
    vec3 darkVoid = vec3(0.08, 0.0, 0.06);    // dark pink void
    vec3 c1       = vec3(0.992, 0.553, 0.592); // #FD8D97 — salmon pink
    vec3 c2       = vec3(0.992, 0.671, 0.725); // #FDABB9 — light pink
    vec3 c3       = vec3(0.980, 0.702, 0.812); // #FAB3CF — mauve pink
    vec3 c4       = vec3(0.867, 0.792, 0.847); // #DDCAD8 — gray lavender
    vec3 c5       = vec3(0.780, 0.820, 0.839); // #C7D1D6 — silver gray
    vec3 c6       = vec3(0.584, 0.827, 0.816); // #95D3D0 — muted teal

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
