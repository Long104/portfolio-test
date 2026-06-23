import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

// ============================================================================
// 1. TEXTURE CREATORS
// ============================================================================

function createCoreSpurtTexture(): THREE.Texture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2)
  ctx.fill()

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

function createStreakTexture(): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.ellipse(c, c, size * 0.15, size * 0.45, 0, 0, Math.PI * 2)
  ctx.fill()

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

  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.9)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.8, 'rgba(255,255,255,0.95)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

function createStarFlareTexture(): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2

  ctx.save()
  ctx.translate(c, c)
  for (let i = 0; i < 2; i++) {
    const grad = ctx.createLinearGradient(-c, 0, c, 0)
    grad.addColorStop(0, 'rgba(255,255,255,0)')
    grad.addColorStop(0.5, 'rgba(255,255,255,1)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(-c, -2, size, 4)
    ctx.rotate(Math.PI / 2)
  }
  ctx.restore()

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

// ============================================================================
// 2. SHADER CODES
// ============================================================================

const backdropVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const backdropFragment = /* glsl */ `
  varying vec2 vUv;
  void main() {
    float dist = distance(vUv, vec2(0.5));

    vec3 mintGreen  = vec3(0.20, 0.88, 0.58);
    vec3 brightCyan = vec3(0.00, 0.95, 0.85);
    vec3 deepTeal   = vec3(0.05, 0.25, 0.40);

    vec3 skyColor = mix(mintGreen, brightCyan, smoothstep(0.0, 0.6, dist));
    vec3 finalColor = mix(skyColor, deepTeal, smoothstep(0.5, 1.0, dist));

    gl_FragColor = vec4(finalColor, 1.0);
    #include <colorspace_fragment>
  }
`

const elementVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uMode;
  attribute vec3 aInitialPos;
  attribute vec3 aRandoms;

  varying vec2 vUv;
  varying float vColorIndex;
  varying float vDepth;

  void main() {
    vUv = uv;
    vColorIndex = aRandoms.z;

    vec3 pos = aInitialPos;

    if (uMode > 0.5) {
      pos.z += uTime * uSpeed * (1.0 + aRandoms.x * 0.6);
      pos.z = mod(pos.z + 65.0, 70.0) - 65.0;
    } else {
      // Core particles just wiggle slightly in Z
      pos.z += sin(uTime * 3.0 + aRandoms.x * 6.28) * 1.5;
    }

    vDepth = clamp((pos.z + 65.0) / 65.0, 0.0, 1.0);

    float scale = 0.4;
    if (uMode > 0.5) {
      scale *= (0.15 + pow(vDepth, 3.5) * 12.0);
    } else {
      scale *= (2.0 + aRandoms.y * 5.0) + sin(uTime * 2.0 + aRandoms.y * 6.28) * 0.5;
    }

    vec3 transformed = position;
    if ((pos.x != 0.0 || pos.y != 0.0) && uMode > 0.5) {
      vec2 dir = normalize(pos.xy);
      float stretch = 1.0 + (vDepth * 4.0);
      float dotProd = dot(transformed.xy, dir);
      transformed.xy += dir * dotProd * (stretch - 1.0);
    }
    
    if (uMode < 0.5) {
      float angle = (uTime * 0.2 + aRandoms.z * 6.28);
      float s = sin(angle);
      float c = cos(angle);
      transformed.xy = mat2(c, -s, s, c) * transformed.xy;
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos + transformed * scale, 1.0);
  }
`

const elementFragment = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uMode;
  varying vec2 vUv;
  varying float vColorIndex;
  varying float vDepth;

  void main() {
    vec4 tex = texture2D(uTexture, vUv);
    if (tex.a < 0.05) discard;

    vec3 color;
    if (uMode < 1.5) {
      if (vColorIndex < 0.33) {
        color = vec3(1.0, 0.85, 0.1); 
      } else if (vColorIndex < 0.66) {
        color = vec3(1.0, 0.1, 0.5); 
      } else {
        color = vec3(0.1, 0.9, 0.6); 
      }
    } else {
      color = mix(vec3(1.0, 1.0, 1.0), vec3(0.2, 1.0, 0.4), step(0.5, vColorIndex));
    }

    float alpha = tex.a;
    if (uMode > 0.5) { 
      alpha *= smoothstep(1.0, 0.82, vDepth) * smoothstep(0.0, 0.15, vDepth);
    } else {
      float distFromCenter = distance(vUv, vec2(0.5));
      alpha *= smoothstep(0.5, 0.2, distFromCenter);
    }

    gl_FragColor = vec4(color * (uMode == 0.0 ? 1.0 : 1.5), alpha);
    #include <colorspace_fragment>
  }
`

// ============================================================================
// 3. MAIN COMPONENT SCENE ARCHITECTURE
// ============================================================================

const CORE_PARTICLE_COUNT = 400 
const VELOCITY_STREAK_COUNT = 300 
const FOREGROUND_SILHOUETTE_COUNT = 30 

function generateVFXInstanceData(count: number, minRadius: number, maxRadius: number, depthRange: number) {
  const pos = new Float32Array(count * 3)
  const rand = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = minRadius + Math.random() * (maxRadius - minRadius)
    
    pos[i * 3] = Math.cos(angle) * radius
    pos[i * 3 + 1] = Math.sin(angle) * radius
    pos[i * 3 + 2] = Math.random() * -depthRange

    rand[i * 3] = Math.random()
    rand[i * 3 + 1] = Math.random()
    rand[i * 3 + 2] = Math.random()
  }

  return { pos, rand }
}

function KiraKiraVortex() {
  const silhouetteMeshRef = useRef<THREE.InstancedMesh>(null)

  const textures = useMemo(() => ({
    core: createCoreSpurtTexture(),
    streak: createStreakTexture(),
    blob: createBlobTexture(),
    flare: createStarFlareTexture()
  }), [])

  const geometry = useMemo(() => ({
    quad: new THREE.PlaneGeometry(1, 1),
    screen: new THREE.PlaneGeometry(160, 160)
  }), [])

  const backdropMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: backdropVertex,
    fragmentShader: backdropFragment,
    depthWrite: false,
    depthTest: false
  }), [])

  const coreMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSpeed: { value: 0.0 }, uMode: { value: 0.0 }, uTexture: { value: textures.core } },
    vertexShader: elementVertex,
    fragmentShader: elementFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  }), [textures.core])

  const streakMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSpeed: { value: 32.0 }, uMode: { value: 1.0 }, uTexture: { value: textures.streak } },
    vertexShader: elementVertex,
    fragmentShader: elementFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  }), [textures.streak])

  const flareMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSpeed: { value: 20.0 }, uMode: { value: 2.0 }, uTexture: { value: textures.flare } },
    vertexShader: elementVertex,
    fragmentShader: elementFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }), [textures.flare])

  const silhouetteMat = useMemo(() => new THREE.MeshBasicMaterial({
    map: textures.blob, 
    color: "#000000", 
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    depthTest: false
  }), [textures.blob])

  const coreGeo = useMemo(() => {
    // Keep core tightly grouped in the distance
    const { pos, rand } = generateVFXInstanceData(CORE_PARTICLE_COUNT, 0.0, 8.0, 15)
    // Shift them all to -60 Z
    for(let i=0; i<CORE_PARTICLE_COUNT; i++) pos[i*3+2] -= 45.0
    const geo = geometry.quad.clone()
    geo.setAttribute('aInitialPos', new THREE.InstancedBufferAttribute(pos, 3))
    geo.setAttribute('aRandoms', new THREE.InstancedBufferAttribute(rand, 3))
    return geo
  }, [geometry.quad])

  const streakGeo = useMemo(() => {
    const { pos, rand } = generateVFXInstanceData(VELOCITY_STREAK_COUNT, 2.0, 16.0, 65)
    const geo = geometry.quad.clone()
    geo.setAttribute('aInitialPos', new THREE.InstancedBufferAttribute(pos, 3))
    geo.setAttribute('aRandoms', new THREE.InstancedBufferAttribute(rand, 3))
    return geo
  }, [geometry.quad])

  const silhouetteData = useMemo(() => {
    const { pos, rand } = generateVFXInstanceData(FOREGROUND_SILHOUETTE_COUNT, 1.5, 9.0, 12)
    return { pos, rand }
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    coreMat.uniforms.uTime.value = t
    streakMat.uniforms.uTime.value = t
    flareMat.uniforms.uTime.value = t

    if (silhouetteMeshRef.current) {
      const dummy = new THREE.Object3D()
      const speed = 4.5
      
      for (let i = 0; i < FOREGROUND_SILHOUETTE_COUNT; i++) {
        const initX = silhouetteData.pos[i * 3]
        const initY = silhouetteData.pos[i * 3 + 1]
        const initZ = silhouetteData.pos[i * 3 + 2]
        const rFactor = silhouetteData.rand[i * 3]

        let curZ = initZ + t * speed * (0.8 + rFactor * 0.4)
        curZ = (curZ % 12.0) - 2.0 

        dummy.position.set(initX * (1.0 + (curZ + 2.0) * 0.15), initY * (1.0 + (curZ + 2.0) * 0.15), curZ)
        
        const s = (2.2 + rFactor * 2.5) * (0.4 + Math.pow((curZ + 2.0) / 14.0, 2.0) * 4.0)
        dummy.scale.set(s, s, 1)
        dummy.updateMatrix()
        silhouetteMeshRef.current.setMatrixAt(i, dummy.matrix)
      }
      silhouetteMeshRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      <mesh geometry={geometry.screen} material={backdropMat} position={[0, 0, -66]} />

      <instancedMesh args={[coreGeo, coreMat, CORE_PARTICLE_COUNT]} frustumCulled={false} />

      <instancedMesh args={[streakGeo, streakMat, VELOCITY_STREAK_COUNT]} frustumCulled={false} />

      <instancedMesh args={[streakGeo, flareMat, VELOCITY_STREAK_COUNT]} frustumCulled={false} />

      <instancedMesh 
        ref={silhouetteMeshRef} 
        args={[geometry.quad, silhouetteMat, FOREGROUND_SILHOUETTE_COUNT]} 
        frustumCulled={false}
        renderOrder={10}
      />

      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.9} 
          luminanceSmoothing={0.2} 
          intensity={0.6} 
          mipmapBlur 
        />
      </EffectComposer>
    </>
  )
}

export default function Scene() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#010c10' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 65 }}>
        <KiraKiraVortex />
      </Canvas>
    </div>
  )
}
