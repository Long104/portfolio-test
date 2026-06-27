// Layer B: Fluid particles (petals + blobs, normal alpha blending)
export const particleVertex = /* glsl */ `
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
    // pos.z += uTime * uSpeed * (0.8 + aRandoms.x * 0.4);
    // speed
    pos.z += uTime * uSpeed * (1.2 + aRandoms.x * 0.4);
    pos.z = mod(pos.z + 60.0, 70.0) - 60.0;

    // Center clearance — keep the glowing core visible
    float r = length(pos.xy);
    // interesting 5.0
    if (r < 5.0) pos.xy = normalize(pos.xy + 0.001) * (5.0 + aRandoms.x * 3.0);

    // Liquid water-flow math (sine/cosine offset X/Y paths)
    // float wave = sin(pos.z * 0.1 + uTime + aRandoms.y * 6.28) * 0.5;
    float wave = sin(pos.z * 0.8 + uTime + aRandoms.y * 6.28) * 0.5;
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

export const particleFragment = /* glsl */ `
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
