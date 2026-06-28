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
    vec3 darkVoid = vec3(0.08, 0.0, 0.06);     // dark pink void
    vec3 c1       = vec3(0.347, 0.194, 0.207); // #FD8D97×0.35 — salmon pink
    vec3 c2       = vec3(0.347, 0.235, 0.254); // #FDABB9×0.35 — light pink
    vec3 c3       = vec3(0.343, 0.246, 0.284); // #FAB3CF×0.35 — mauve pink
    vec3 c4       = vec3(0.303, 0.277, 0.296); // #DDCAD8×0.35 — gray lavender
    vec3 c5       = vec3(0.273, 0.287, 0.294); // #C7D1D6×0.35 — silver gray
    vec3 c6       = vec3(0.204, 0.289, 0.286); // #95D3D0×0.35 — muted teal

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
