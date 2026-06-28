import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  InstancedMesh,
  LinearFilter,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  SRGBColorSpace,
} from "three";
import { useAudioEngine } from "./useAudioEngine";

// ==========================================
// SPARKLE SYSTEM — Chromatic Lens Flare Kira-Kira
// Each sparkle is a tiny anamorphic lens flare:
// - Overexposed white core
// - Blue (#3459B5) horizontal fringe
// - Teal (#6AABAD) vertical fringe
// - Soft bloom glow extending beyond spikes
// Born from nothing → flash → die. Beat-driven.
// ==========================================

const POOL_SIZE = 200;

const SPARKLE_COLORS: [number, number, number][] = [
  [0.938, 0.278, 0.386], [0.947, 0.481, 0.584],
  [0.262, 1.000, 0.320], [0.850, 1.000, 0.448],
  [0.612, 1.000, 0.402], [0.984, 0.694, 0.761],
  [1.000, 1.000, 0.448], [0.973, 0.612, 0.694],
  [0.947, 0.247, 0.347], [1.000, 0.973, 0.612],
  [0.106, 0.737, 0.698],
];

// Chromatic lens flare texture — blue/teal fringed diamond sparkle
function createSparkleTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // 1. Blue glow (#3459B5) — offset upper-left
  const blueGrad = ctx.createRadialGradient(c - 10, c - 10, 0, c - 10, c - 10, 70);
  blueGrad.addColorStop(0, "rgba(52, 89, 181, 0.45)");
  blueGrad.addColorStop(0.4, "rgba(52, 89, 181, 0.12)");
  blueGrad.addColorStop(1, "rgba(52, 89, 181, 0)");
  ctx.fillStyle = blueGrad;
  ctx.fillRect(0, 0, size, size);

  // 2. Teal glow (#6AABAD) — offset lower-right
  const tealGrad = ctx.createRadialGradient(c + 10, c + 10, 0, c + 10, c + 10, 70);
  tealGrad.addColorStop(0, "rgba(106, 171, 173, 0.45)");
  tealGrad.addColorStop(0.4, "rgba(106, 171, 173, 0.12)");
  tealGrad.addColorStop(1, "rgba(106, 171, 173, 0)");
  ctx.fillStyle = tealGrad;
  ctx.fillRect(0, 0, size, size);

  // 3. Overexposed white core
  const core = ctx.createRadialGradient(c, c, 0, c, c, 22);
  core.addColorStop(0, "rgba(255, 255, 255, 1)");
  core.addColorStop(0.25, "rgba(255, 255, 245, 0.95)");
  core.addColorStop(0.55, "rgba(255, 250, 210, 0.4)");
  core.addColorStop(1, "rgba(255, 250, 210, 0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);

  // 4. Chromatic spikes — blue→white→teal split
  ctx.save();
  ctx.translate(c, c);
  ctx.globalCompositeOperation = "lighter";

  // Horizontal spike: blue (left) → white (center) → teal (right)
  const hSpike = ctx.createLinearGradient(-c, 0, c, 0);
  hSpike.addColorStop(0.00, "rgba(52, 89, 181, 0)");
  hSpike.addColorStop(0.30, "rgba(52, 89, 181, 0.4)");
  hSpike.addColorStop(0.42, "rgba(180, 200, 240, 0.7)");
  hSpike.addColorStop(0.49, "rgba(255, 255, 255, 1)");
  hSpike.addColorStop(0.51, "rgba(255, 255, 255, 1)");
  hSpike.addColorStop(0.58, "rgba(180, 230, 230, 0.7)");
  hSpike.addColorStop(0.70, "rgba(106, 171, 173, 0.4)");
  hSpike.addColorStop(1.00, "rgba(106, 171, 173, 0)");
  ctx.fillStyle = hSpike;
  ctx.fillRect(-c, -2.5, size, 5);

  // Vertical spike: same chromatic split
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = hSpike;
  ctx.fillRect(-c, -2.5, size, 5);

  // Diagonal accent spikes (thinner, subtler)
  ctx.rotate(-Math.PI / 4);
  for (let i = 0; i < 2; i++) {
    const dSpike = ctx.createLinearGradient(-c, 0, c, 0);
    dSpike.addColorStop(0.00, "rgba(52, 89, 181, 0)");
    dSpike.addColorStop(0.40, "rgba(120, 150, 210, 0)");
    dSpike.addColorStop(0.50, "rgba(200, 220, 240, 0.4)");
    dSpike.addColorStop(0.60, "rgba(140, 200, 200, 0)");
    dSpike.addColorStop(1.00, "rgba(106, 171, 173, 0)");
    ctx.fillStyle = dSpike;
    ctx.fillRect(-c, -1, size, 2);
    ctx.rotate(Math.PI / 2);
  }

  ctx.restore();

  const tex = new CanvasTexture(canvas);
  tex.generateMipmaps = false;
  tex.minFilter = LinearFilter;
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

interface Sparkle {
  x: number; y: number; z: number;
  rot: number; size: number;
  cr: number; cg: number; cb: number;
  birthTime: number; lifetime: number;
  active: boolean;
}

export default function SparkleSystem() {
  const { getData } = useAudioEngine();
  const meshRef = useRef<InstancedMesh>(null);
  const prevBass = useRef(0);
  const prevTreble = useRef(0);
  const spawnTimer = useRef(0);
  const ambientTimer = useRef(0);

  const sparkleTex = useMemo(() => createSparkleTexture(), []);
  const geometry = useMemo(() => new PlaneGeometry(1.0, 1.0), []);

  // Custom shader: chromatic texture + instance tint + radial bloom
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTex: { value: sparkleTex },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying vec3 vInstColor;

          void main() {
            vUv = uv;

            #ifdef USE_INSTANCING_COLOR
              vInstColor = instanceColor;
            #else
              vInstColor = vec3(1.0);
            #endif

            vec4 mvPos = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uTex;
          varying vec2 vUv;
          varying vec3 vInstColor;

          void main() {
            vec4 tex = texture2D(uTex, vUv);

            // Radial bloom — soft glow extending beyond the texture
            float dist = length(vUv - 0.5);
            float bloom = exp(-dist * 5.0) * 0.35;

            // Bloom colors: blue (#3459B5) + teal (#6AABAD)
            vec3 bloomBlue = vec3(0.204, 0.349, 0.710);
            vec3 bloomTeal = vec3(0.416, 0.671, 0.678);
            vec3 bloomColor = (bloomBlue + bloomTeal * 0.6) * bloom;

            // Combine: chromatic texture (blue/teal/white structure)
            // tinted by instance color (pastel core) + bloom glow
            vec3 color = tex.rgb * vInstColor + bloomColor * (0.4 + vInstColor * 0.6);

            float alpha = max(tex.a, bloom * 0.3);
            gl_FragColor = vec4(color, alpha);

            #include <colorspace_fragment>
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [sparkleTex],
  );

  const pool = useMemo<Sparkle[]>(() => {
    const arr: Sparkle[] = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      arr.push({
        x: 0, y: 0, z: -100,
        rot: 0, size: 0,
        cr: 1, cg: 1, cb: 1,
        birthTime: -1, lifetime: 0, active: false,
      });
    }
    return arr;
  }, []);

  const dummy = useMemo(() => new Object3D(), []);
  const tmpColor = useMemo(() => new Color(), []);

  function spawn(count: number, time: number, big: boolean) {
    let spawned = 0;
    for (const s of pool) {
      if (spawned >= count) break;
      if (s.active) continue;

      const angle = Math.random() * Math.PI * 2;
      const radius = big
        ? 1.0 + Math.random() * 6
        : 1.5 + Math.random() * 4;

      s.x = Math.cos(angle) * radius;
      s.y = Math.sin(angle) * radius * 0.8;
      s.z = -1 - Math.random() * 14;

      s.rot = Math.random() * Math.PI * 2;
      s.size = big
        ? 0.6 + Math.random() * 0.7
        : 0.3 + Math.random() * 0.4;

      const col = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];
      s.cr = col[0]; s.cg = col[1]; s.cb = col[2];

      s.birthTime = time;
      s.lifetime = 0.3 + Math.random() * 0.5;
      s.active = true;
      spawned++;
    }
  }

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const audio = getData();

    const bassBeat = audio.bass > 0.4 && audio.bass > prevBass.current * 1.12;
    prevBass.current = audio.bass;

    const trebleSpark = audio.treble > 0.10 && audio.treble > prevTreble.current * 1.25;
    prevTreble.current = audio.treble;

    spawnTimer.current += delta;

    if (bassBeat && spawnTimer.current > 0.06) {
      spawn(6 + Math.floor(audio.bass * 12), time, true);
      spawnTimer.current = 0;
    }

    if (trebleSpark) {
      spawn(2 + Math.floor(audio.treble * 5), time, false);
    }

    ambientTimer.current += delta;
    if (ambientTimer.current > 0.35 + Math.random() * 0.25) {
      spawn(1 + Math.floor(Math.random() * 2), time, false);
      ambientTimer.current = 0;
    }

    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < pool.length; i++) {
      const s = pool[i];
      const age = time - s.birthTime;

      if (s.active && age < s.lifetime) {
        const t = age / s.lifetime;

        let scale: number;
        if (t < 0.15) {
          scale = t / 0.15;
        } else if (t < 0.40) {
          scale = 1.0;
        } else {
          scale = 1.0 - (t - 0.40) / 0.60;
        }

        if (t < 0.18 && t > 0.12) scale *= 1.2;

        scale = Math.max(0, scale);
        const renderScale = scale * s.size;
        const brightness = Math.max(0, scale);

        dummy.position.set(s.x, s.y, s.z);
        dummy.rotation.set(0, 0, s.rot);
        dummy.scale.setScalar(renderScale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        const flashBoost = t < 0.40 ? 1.0 + (1.0 - t / 0.40) * 0.5 : 1.0;
        tmpColor.setRGB(
          s.cr * brightness * flashBoost,
          s.cg * brightness * flashBoost,
          s.cb * brightness * flashBoost,
        );
        mesh.setColorAt(i, tmpColor);
      } else {
        if (s.active) s.active = false;
        dummy.position.set(0, 0, -100);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        tmpColor.setRGB(0, 0, 0);
        mesh.setColorAt(i, tmpColor);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    tmpColor.setRGB(0, 0, 0);
    for (let i = 0; i < POOL_SIZE; i++) {
      dummy.position.set(0, 0, -100);
      dummy.scale.setScalar(0.0001);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, tmpColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    return () => {
      geometry.dispose();
      material.dispose();
      sparkleTex.dispose();
    };
  }, [geometry, material, sparkleTex, dummy, tmpColor]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, POOL_SIZE]}
      frustumCulled={false}
      renderOrder={10}
    />
  );
}
