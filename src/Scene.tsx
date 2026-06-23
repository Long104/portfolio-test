import { useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ==========================================
// 1. PROCEDURAL TEXTURES (Canvas-based)
//    White alpha masks — coloring is done
//    in the fragment shaders.
// ==========================================

function createStarTexture(): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2

  // Radial glow core
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.5)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.2, 'rgba(255,255,220,0.9)')
  grad.addColorStop(0.5, 'rgba(255,230,150,0.3)')
  grad.addColorStop(1, 'rgba(255,230,150,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  // Cross-shaped star spikes
  ctx.save()
  ctx.translate(c, c)
  ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 2; i++) {
    const spike = ctx.createLinearGradient(-c, 0, c, 0)
    spike.addColorStop(0, 'rgba(255,255,255,0)')
    spike.addColorStop(0.45, 'rgba(255,255,255,0)')
    spike.addColorStop(0.5, 'rgba(255,255,240,0.7)')
    spike.addColorStop(0.55, 'rgba(255,255,255,0)')
    spike.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = spike
    ctx.fillRect(-c, -1, size, 2)
    ctx.rotate(Math.PI / 2)
  }
  ctx.restore()

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

function createPetalTexture(): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2

  // Soft radial alpha mask
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.65)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.4, 'rgba(255,255,255,0.8)')
  grad.addColorStop(0.7, 'rgba(255,255,255,0.3)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

function createBlobTexture(): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2

  // Larger, softer blob
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.85)
  grad.addColorStop(0, 'rgba(255,255,255,0.9)')
  grad.addColorStop(0.3, 'rgba(255,255,255,0.6)')
  grad.addColorStop(0.6, 'rgba(255,255,255,0.25)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(c, c, c * 0.85, 0, Math.PI * 2)
  ctx.fill()

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
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
`

const backdropFragment = /* glsl */ `
  varying vec2 vUv;
  void main() {
    float dist = distance(vUv, vec2(0.5));

    // Dark center — the foreground glow mesh paints the core/halo on top
    // vec3 dark   = vec3(0.01, 0.03, 0.05);
    // vec3 mint   = vec3(0.15, 0.85, 0.70);
    // vec3 teal   = vec3(0.02, 0.18, 0.22);
    vec3 dark   = vec3(1, 1, 1);
    vec3 mint   = vec3(1, 1, 1);
    vec3 teal   = vec3(1, 1, 1);

    vec3 color = mix(dark, mint, smoothstep(0.0, 0.40, dist));
    if (dist > 0.40) color = mix(color, teal, smoothstep(0.40, 0.70, dist));

    gl_FragColor = vec4(color, 1.0);

    #include <colorspace_fragment>
  }
`

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
    //fix
    if (r < 5.0) pos.xy = normalize(pos.xy + 0.001) * (5.0 + aRandoms.x * 3.0);
    // if (r < 4.0) pos.xy = normalize(pos.xy + 0.001) * (5.0 + aRandoms.x * 3.0);

    // Liquid water-flow math (sine/cosine offset X/Y paths)
    float wave = sin(pos.z * 0.1 + uTime + aRandoms.y * 6.28) * 0.5;
    pos.x += cos(wave) * 0.5;
    pos.y += sin(wave) * 0.5;

    vDepth = clamp((pos.z + 60.0) / 65.0, 0.0, 1.0);

    // Scale: microscopic far away, massive near camera
    float baseScale = (vType < 0.5) ? 1.0 : 2.5;
    float scale = baseScale * (0.2 + pow(vDepth, 3.0) * 15.0);

    // Spin particles along the current
    float angle = pos.z * 0.05 + aRandoms.y * 6.28;
    float s = sin(angle);
    float c = cos(angle);
    vec3 transformed = position;
    transformed.xy = mat2(c, -s, s, c) * transformed.xy;

    vec4 mvPos = modelViewMatrix * vec4(pos + transformed * scale, 1.0);
    gl_Position = projectionMatrix * mvPos;
  }
`

const particleFragment = /* glsl */ `
  uniform sampler2D uTexPetal;
  uniform sampler2D uTexBlob;
  varying vec2 vUv;
  varying float vType;
  varying float vDepth;

  void main() {
    vec4 texColor;
    vec3 finalColor;

    if (vType < 0.5) {
      // Vibrant peach/pink petals
      // no need for this the pink blur i want it to be the pink explosive instead not as blur and ove slowly
      // texColor = texture2D(uTexBlob, vUv);
      finalColor = mix(vec3(1.0, 0.3, 0.55), vec3(1.0, 0.6, 0.75), vDepth);
    } else {
      // Dark framing blobs (deep jade/teal)
      texColor = texture2D(uTexBlob, vUv);
      finalColor = mix(vec3(0.01, 0.12, 0.15), vec3(0.0, 0.05, 0.08), vDepth);
    }

    // Proximity fade — disappear at camera lens to prevent screen blocking
    float alphaFade = smoothstep(1.0, 0.85, vDepth);
    gl_FragColor = vec4(finalColor, texColor.a * alphaFade);

    #include <colorspace_fragment>
  }
`

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
    // fix
    if (r < 4.0) pos.xy = normalize(pos.xy + 0.001) * (4.0 + aRandoms.x * 2.0);
    // if (r < 2.0) pos.xy = normalize(pos.xy + 0.001) * (2.0 + aRandoms.x * 1.5);

    vDepth = clamp((pos.z + 60.0) / 65.0, 0.0, 1.0);
    float scale = 0.5 * (0.2 + pow(vDepth, 2.5) * 6.0);

    // Radial forward-motion streak
    vec3 transformed = position;
    vec2 dir = normalize(pos.xy + 0.001);
    float stretch = 1.0 + (vDepth * 3.0);
    transformed.xy += dir * dot(transformed.xy, dir) * (stretch - 1.0);

    vec4 mvPos = modelViewMatrix * vec4(pos + transformed * scale, 1.0);
    gl_Position = projectionMatrix * mvPos;
  }
`

const flareFragment = /* glsl */ `
  uniform sampler2D uTexStar;
  varying vec2 vUv;
  varying float vDepth;
  varying float vColorMix;

  void main() {
    vec4 texColor = texture2D(uTexStar, vUv);

    vec3 colors[5] = vec3[5](
      vec3(0.8078, 1.0, 0.6863),  // #CEFFAF  mint yellow
      vec3(1.0, 0.7059, 0.3529),  // #FFB45A  warm amber
      vec3(1.0, 0.3, 0.5),        // #FF4D80  neon coral
      vec3(1.0, 0.4, 0.7),        // #FF66B2  deep pink
      vec3(1.0, 0.4118, 0.7059)   // #FF69B4  hot pink
    );
    int index = int(floor(vColorMix * 5.0));
    vec3 glow = colors[index];

    float alphaFade = smoothstep(1.0, 0.80, vDepth);
    gl_FragColor = vec4(glow * 1.0, texColor.a * alphaFade);

    #include <colorspace_fragment>
  }
`

// Layer D: Foreground core glow (renders ON TOP of particles)
// Guarantees the yellow core + pink halo are always visible.
const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const glowFragment = /* glsl */ `
  uniform float uAspect;
  varying vec2 vUv;
  void main() {
    // Correct for screen aspect so the glow is circular
    vec2 centered = vUv - vec2(0.5);
    centered.x *= uAspect;
    float dist = length(centered);

    vec3 coreColor = vec3(1.0, 0.98, 0.65);  // Warm yellow-white
    vec3 haloColor = vec3(0.76, 0.09, 0.36);  // #C2185B  dark pink

    // Core blends into pink halo
    vec3 color = mix(coreColor, haloColor, smoothstep(0.02, 0.16, dist));

    // Strong alpha at center, smooth falloff
    float alpha = 1.0 - smoothstep(0.0, 0.35, dist);

    gl_FragColor = vec4(color, alpha);

    #include <colorspace_fragment>
  }
`

// ==========================================
// 3. SCENE COMPONENT
// ==========================================

const PAINT_COUNT = 5500 // Petals + Blobs
const FLARE_COUNT = 3000 // Star flares

function generateInstanceData(count: number, maxRadius: number) {
  const pos = new Float32Array(count * 3)
  const rand = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * maxRadius
    pos[i * 3] = Math.cos(angle) * radius
    pos[i * 3 + 1] = Math.sin(angle) * radius
    pos[i * 3 + 2] = Math.random() * -60

    rand[i * 3] = Math.random()
    rand[i * 3 + 1] = Math.random()
    rand[i * 3 + 2] = Math.random()
  }
  return { pos, rand }
}

function KiraKiraVortex() {
  // --- Procedural textures ---
  const starTex = useMemo(() => createStarTexture(), [])
  const petalTex = useMemo(() => createPetalTexture(), [])
  const blobTex = useMemo(() => createBlobTexture(), [])

  // --- Materials (raw ShaderMaterial — no extend/TS hacks) ---
  const backdropMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: backdropVertex,
        fragmentShader: backdropFragment,
        depthWrite: false,
        depthTest: false,
      }),
    [],
  )

  const paintMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: 0.15 },
          uTexPetal: { value: petalTex },
          uTexBlob: { value: blobTex },
        },
        vertexShader: particleVertex,
        fragmentShader: particleFragment,
        transparent: true,
        depthWrite: false,
      }),
    [petalTex, blobTex],
  )

  const flareMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: 0.2 },
          uTexStar: { value: starTex },
        },
        vertexShader: flareVertex,
        fragmentShader: flareFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [starTex],
  )

  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAspect: { value: window.innerWidth / window.innerHeight },
        },
        vertexShader: glowVertex,
        fragmentShader: glowFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    [],
  )

  // --- Geometry with instanced attributes ---
  const backdropGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  const paintGeo = useMemo(() => {
    const { pos, rand } = generateInstanceData(PAINT_COUNT, 14.0)
    const geo = new THREE.PlaneGeometry(0.4, 0.4)
    geo.setAttribute('aInitialPos', new THREE.InstancedBufferAttribute(pos, 3))
    geo.setAttribute('aRandoms', new THREE.InstancedBufferAttribute(rand, 3))
    return geo
  }, [])

  const flareGeo = useMemo(() => {
    const { pos, rand } = generateInstanceData(FLARE_COUNT, 10.0)
    const geo = new THREE.PlaneGeometry(0.3, 0.3)
    geo.setAttribute('aInitialPos', new THREE.InstancedBufferAttribute(pos, 3))
    geo.setAttribute('aRandoms', new THREE.InstancedBufferAttribute(rand, 3))
    return geo
  }, [])

  // --- Animation loop ---
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    paintMat.uniforms.uTime.value = t
    flareMat.uniforms.uTime.value = t
    glowMat.uniforms.uAspect.value = state.size.width / state.size.height
  })

  return (
    <>
      {/* Layer A: Static fullscreen backdrop */}
      <mesh geometry={backdropGeo} material={backdropMat} renderOrder={-1} />

      {/* Layer B: Fluid particles (normal alpha blending) */}
      <instancedMesh
        args={[paintGeo, paintMat, PAINT_COUNT]}
        frustumCulled={false}
      />

      {/* Layer C: Star flares (additive blending) */}
      <instancedMesh
        args={[flareGeo, flareMat, FLARE_COUNT]}
        frustumCulled={false}
      />

      {/* Layer D: Foreground core glow — always visible on top */}
      <mesh geometry={backdropGeo} material={glowMat} renderOrder={1} />
    </>
  )
}

// ==========================================
// 4. EXPORT
// ==========================================

export default function Scene() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#020d12',
      }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <KiraKiraVortex />
      </Canvas>
    </div>
  )
}
