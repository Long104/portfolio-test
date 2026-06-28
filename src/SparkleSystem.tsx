import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  InstancedMesh,
  LinearFilter,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
} from "three";
import { useAudioEngine } from "./useAudioEngine";

// ==========================================
// SPARKLE SYSTEM — True kira-kira sparkles
// Sparkles SPAWN from nothing, FLASH bright, DIE.
// Not brightness modulation — actual birth/life/death lifecycle.
// Beat-driven spawning + ambient twinkle.
// ==========================================

const POOL_SIZE = 200;

// Pastel kira-kira palette (matches existing flare colors)
const SPARKLE_COLORS: [number, number, number][] = [
  [0.938, 0.278, 0.386], // #F890A8 vibrant pink
  [0.947, 0.481, 0.584], // #F9B9CA pastel rose
  [0.262, 1.000, 0.320], // #8CFF96 mint green
  [0.850, 1.000, 0.448], // #EDFFB6 lime
  [0.612, 1.000, 0.402], // #D0FFAF mint yellow
  [0.984, 0.694, 0.761], // #FEDBE4 blush
  [1.000, 1.000, 0.448], // #FFFFB6 pastel yellow
  [0.973, 0.612, 0.694], // #FDD0DA sakura
  [0.947, 0.247, 0.347], // #FB889E neon pink
  [1.000, 0.973, 0.612], // #FFFDDA warm cream
  [0.106, 0.737, 0.698], // #1BBCB2 teal
];

// Sharp 4-pointed diamond sparkle texture (classic anime ✧)
function createSparkleTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // Bright core
  const core = ctx.createRadialGradient(c, c, 0, c, c, 8);
  core.addColorStop(0, "rgba(255,255,255,1)");
  core.addColorStop(0.5, "rgba(255,255,255,0.8)");
  core.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);

  // Sharp 4-pointed diamond spikes
  ctx.save();
  ctx.translate(c, c);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 2; i++) {
    const spike = ctx.createLinearGradient(-c, 0, c, 0);
    spike.addColorStop(0.0, "rgba(255,255,255,0)");
    spike.addColorStop(0.35, "rgba(255,255,255,0)");
    spike.addColorStop(0.5, "rgba(255,255,255,0.9)");
    spike.addColorStop(0.65, "rgba(255,255,255,0)");
    spike.addColorStop(1.0, "rgba(255,255,255,0)");
    ctx.fillStyle = spike;
    // Sharper, thinner spikes for diamond look
    ctx.fillRect(-c, -1.5, size, 3);
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
  x: number;
  y: number;
  z: number;
  rot: number;
  size: number;
  cr: number;
  cg: number;
  cb: number;
  birthTime: number;
  lifetime: number;
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
  const geometry = useMemo(() => new PlaneGeometry(0.3, 0.3), []);
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map: sparkleTex,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [sparkleTex],
  );

  // Sparkle pool — all start dead
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

      // Random position spread across the screen area
      const angle = Math.random() * Math.PI * 2;
      const radius = big
        ? 1.5 + Math.random() * 7 // bass: wider spread
        : 2 + Math.random() * 5;  // treble: medium spread

      s.x = Math.cos(angle) * radius;
      s.y = Math.sin(angle) * radius * 0.8; // slightly squashed (aspect)
      s.z = -3 - Math.random() * 22;

      s.rot = Math.random() * Math.PI * 2;
      s.size = big
        ? 0.2 + Math.random() * 0.3   // bass: bigger sparkles
        : 0.1 + Math.random() * 0.15; // treble: smaller sparkles

      const col = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];
      s.cr = col[0]; s.cg = col[1]; s.cb = col[2];

      s.birthTime = time;
      s.lifetime = 0.25 + Math.random() * 0.45; // 250-700ms
      s.active = true;
      spawned++;
    }
  }

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const audio = getData();

    // ── Beat detection ──
    // Bass beat: sudden increase in bass energy
    const bassBeat = audio.bass > 0.45 && audio.bass > prevBass.current * 1.15;
    prevBass.current = audio.bass;

    // Treble spark: sudden increase in treble
    const trebleSpark = audio.treble > 0.12 && audio.treble > prevTreble.current * 1.3;
    prevTreble.current = audio.treble;

    // ── Spawning ──
    spawnTimer.current += delta;

    // On bass beat: burst of big sparkles (with cooldown)
    if (bassBeat && spawnTimer.current > 0.06) {
      const count = 6 + Math.floor(audio.bass * 10); // 6-16 sparkles
      spawn(count, time, true);
      spawnTimer.current = 0;
    }

    // On treble spark: few small sparkles
    if (trebleSpark) {
      spawn(2 + Math.floor(audio.treble * 4), time, false);
    }

    // Ambient twinkle: 1-2 random sparkles per ~500ms (even without beats)
    ambientTimer.current += delta;
    if (ambientTimer.current > 0.4 + Math.random() * 0.3) {
      spawn(1 + Math.floor(Math.random() * 2), time, false);
      ambientTimer.current = 0;
    }

    // ── Update all instances ──
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < pool.length; i++) {
      const s = pool[i];
      const age = time - s.birthTime;

      if (s.active && age < s.lifetime) {
        const t = age / s.lifetime; // 0 → 1

        // Size envelope: quick grow → hold → shrink
        // This is the kira-kira lifecycle: appear → flash → die
        let scale: number;
        if (t < 0.12) {
          // Birth: grow from 0 to full in 12% of lifetime
          scale = t / 0.12;
        } else if (t < 0.30) {
          // Flash: hold at full brightness
          scale = 1.0;
        } else {
          // Death: shrink back to 0 over remaining 70%
          scale = 1.0 - (t - 0.30) / 0.70;
        }

        // Add a slight overshoot at birth for "pop" effect
        if (t < 0.15 && t > 0.10) {
          scale *= 1.15; // brief overshoot
        }

        const renderScale = scale * s.size;
        const brightness = Math.max(0, scale); // fade color with scale

        dummy.position.set(s.x, s.y, s.z);
        dummy.rotation.set(0, 0, s.rot);
        dummy.scale.setScalar(renderScale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        tmpColor.setRGB(
          s.cr * brightness,
          s.cg * brightness,
          s.cb * brightness,
        );
        mesh.setColorAt(i, tmpColor);
      } else {
        // Dead sparkle — invisible
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

  // Initialize all instances as invisible + dispose on unmount
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Initialize colors so instanceColor buffer exists
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
