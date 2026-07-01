import {
  CanvasTexture,
  LinearFilter,
  SRGBColorSpace,
  Texture,
} from "three";

// ==========================================
// 1. PROCEDURAL TEXTURES (Canvas-based)
//    White alpha masks — coloring is done
//    in the fragment shaders.
// ==========================================

export function createStarTexture(): Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // Radial glow core
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.5);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.2, "rgba(255,255,220,0.9)");
  // here
  grad.addColorStop(0.5, "rgba(255,230,150,0.3)");
  grad.addColorStop(1, "rgba(255,230,150,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Cross-shaped star spikes
  ctx.save();
  ctx.translate(c, c);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 2; i++) {
    const spike = ctx.createLinearGradient(-c, 0, c, 0);
    spike.addColorStop(0, "rgba(255,255,255,0)");
    spike.addColorStop(0.45, "rgba(255,255,255,0)");
    spike.addColorStop(0.5, "rgba(255,255,240,0.7)");
    spike.addColorStop(0.55, "rgba(255,255,255,0)");
    spike.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = spike;
    ctx.fillRect(-c, -1, size, 2);
    ctx.rotate(Math.PI / 2);
  }
  ctx.restore();

  const tex = new CanvasTexture(canvas);
  tex.generateMipmaps = false;
  tex.minFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export function createPetalTexture(): Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // Soft radial alpha mask
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.65);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.8)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.3)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new CanvasTexture(canvas);
  tex.generateMipmaps = false;
  tex.minFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export function createBlobTexture(): Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // Larger, softer blob
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.85);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.6)");
  grad.addColorStop(0.6, "rgba(255,255,255,0.25)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c, c, c * 0.85, 0, Math.PI * 2);
  ctx.fill();

  const tex = new CanvasTexture(canvas);
  tex.generateMipmaps = false;
  tex.minFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// 15-stop depth gradient baked into a 256×1 LUT.
// Edit colors here — no shader changes ever needed.
export function createGradientLUT(): Texture {
  const w = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;

  // vec3(0.002, 0.025, 0.054) // #072D42
  // vec3(0.0003, 0.046, 0.081) // #013D50
  // vec3(0.0003, 0.083, 0.139) // #015168
  // vec3(0.003, 0.155, 0.208) // #086E7E
  // vec3(0.002, 0.191, 0.239) //  #077986
  // vec3(0.004, 0.308, 0.357) // #0D96A1
  // vec3(0.029, 0.497, 0.503) // #30BBBC
  // vec3(0.164, 0.644, 0.672) // #71D2D6
  // vec3(0.318, 0.657, 0.637) // #98D4D1
  // vec3(0.479, 0.644, 0.665) // #B8D2D5
  // vec3(0.686, 0.630, 0.694) // #D8D0D9
  // vec3(0.930, 0.474, 0.672) // #F7B7D6
  // vec3(0.991, 0.418, 0.497) // #FEADBB
  // vec3(0.991, 0.982, 0.247) // #FEFD88
  // vec3(0.991, 1.000, 0.455) // #FEFFB4
  // vec3(0.991, 0.982, 0.930) // #FEFDF7
  // vec3 mintGlow    = vec3(0.047, 0.890, 0.714); // #0CE3B6
  const stops: [number, string][] = [
    // freah
    // [0.0, "#FEFDF7"], // whiteCore
    // [0.03, "#FEFFB4"], // whiteCore
    // [0.071, "#FEFD88"], // coreYellow
    // [0.132, "#FF3366"], // freshHotPink - Ultra-vivid, neon-leaning hot pink
    // [0.260, "#FFB347"], // freshAmber - Bright, juicy, saturated neon amber
    // [0.420, "#F7B7D6"], // coral
    // [0.386, "#D8D0D9"], // hotPink
    // [0.757, "#B8D2D5"], // magenta
    // [0.729, "#98D4D1"], // orchid
    // [0.480, "#0CE3B6"], // mintGlow - Kept original (already fresh)
    // [0.5, "#71D2D6"], // spring
    // [0.571, "#30BBBC"], // mintGlow
    // [0.643, "#0D96A1"], // aqua
    // [0.714, "#077986"], // seafoam
    // [0.786, "#086E7E"], // deepTeal
    // [0.857, "#015168"], // deepBlue
    // [0.929, "#013D50"], // darkForest
    // [0.945, "#005F73"], // freshDarkJade - Cleaner, deep teal-cyan without the muddy gray tones
    // [0.857, "#0A2533"], // freshNearBlack - Deep midnight blue-green base
    // [0.929, "#05131C"], // freshAlmostBlack - Extremely dark, rich cyber-tinted shadow
    // [1.0, "#01080C"], // freshDeepBlack - Crisp, high-contrast final stop

    // recommend
    // [0.0,   "#FFFEF0"], // whiteCore
    // [0.030, "#FFF78A"], // warmYellow
    // [0.071, "#FFE040"], // vividYellow
    // [0.143, "#FFB06A"], // peach
    // [0.214, "#FF7F9C"], // vividPink
    // [0.286, "#D65A8A"], // deepRose
    // [0.357, "#40C4C6"], // brightTeal (skip the gray zone)
    // [0.429, "#1AACB2"], // saturatedTeal
    // [0.5,   "#0C8E98"], // teal
    // [0.571, "#07717C"], // deepTeal
    // [0.643, "#045560"], // darkerTeal
    // [0.714, "#023A46"], // darkBlue
    // [0.786, "#01242E"], // veryDark
    // [0.857, "#01141C"], // nearBlack
    // [0.929, "#000A10"], // almostBlack
    // [1.0,   "#000508"], // deepBlack

    // too real

    [0.0, "#FEFDF7"], // whiteCore
    [0.03, "#FEFFB4"], // whiteCore
    [0.071, "#FEFD88"], // coreYellow
    // [0.132, "#FF9093"], // hotPink
    // [0.467, "#FEADBB"], // amber
    [0.132, "#FDABB8"], // hotPink
    [0.467, "#FAB0CE"], // amber
    [0.632, "#0CE3B6"], // mintGlow
    // [0.632, "#58F9FB"], // mintGlow  
    // [0.720, "#A7FFEA"], // mintGlow  
    // [0.5, "#71D2D6"], // spring
    // [0.571, "#30BBBC"], // mintGlow
    // [0.643, "#0D96A1"], // aqua
    // [0.714, "#077986"], // seafoam
    // [0.7424, "#086E7E"], // deepTeal
    [0.786, "#015168"], // blueBlue
    [0.857, "#00161d"], // deepBlue
    // [0.857, "#01141C"], // nearBlack
    [0.929, "#013D50"], // darkForest
    [0.945, "#072D42"], // darkJade
    [1.0, "#000508"], // deepBlack

    // here
    // [0.857, "#00161d"], // deepBlue
    //     // [0.857, "#01141C"], // nearBlack
    //     [0.929, "#013D50"], // darkForest
    //     [0.945, "#072D42"], // darkJade
    //     [0.929, "#000A10"], // almostBlack
    //     [1.0, "#000508"], // deepBlack

    // [0.857, "#00161d"], // deepBlue
    //     // [0.857, "#01141C"], // nearBlack
    //     [0.929, "#013D50"], // darkForest
    //     [0.945, "#072D42"], // darkJade
    //     [0.929, "#000A10"], // almostBlack
    //     [1.0, "#000508"], // deepBlack

    // •	Slightly Darker: [0.900, "#013b4c"], // deeperBlue
    // •	Much Darker (Midnight Teal): [0.950, "#002b38"], // midnightTeal
    // •	Near Black (Deep Abyss): [0.980, "#00161d"], // abyssBlue
    // test
    // [0.0, "#FFFEF0"], // whiteCore
    // [0.071, "#FFF529"], // coreYellow
    // [0.143, "#FFB45A"], // amber
    // [0.214, "#FF8A6E"], // coral
    // [0.286, "#FD6982"], // hotPink
    // [0.357, "#EB4A94"], // magenta
    // [0.429, "#9E61B8"], // orchid
    // [0.5, "#4DB39E"], // spring
    // [0.571, "#0CE3B6"], // mintGlow
    // [0.643, "#05949E"], // aqua
    // [0.714, "#015161"], // seafoam
    // [0.786, "#012E42"], // deepTeal
    // [0.857, "#001523"], // deepBlue
    // [0.929, "#00060E"], // darkForest
    // [1.0, "#000208"], // darkJade
  ];

  const grad = ctx.createLinearGradient(0, 0, w, 0);
  for (const [offset, color] of stops) grad.addColorStop(offset, color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, 1);

  const tex = new CanvasTexture(canvas);
  tex.minFilter = LinearFilter; // GPU interpolates between stops for free
  tex.magFilter = LinearFilter;

  // old
  // tex.colorSpace = LinearSRGBColorSpace; // raw values — no sRGB linearization
  // To this:
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// 10×1 LUT of flare colors — sampled in the flare fragment shader
// instead of initializing a vec3[10] array per pixel.
export function createFlareColorLUT(): Texture {
  const w = 10;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;

  const colors: [number, string][] = [
    [0.0, "#F890A8"],
    [0.1, "#F9B9CA"],
    [0.2, "#8CFF96"],
    [0.3, "#EDFFB6"],
    [0.4, "#D0FFAF"],
    [0.5, "#FEDBE4"],
    [0.6, "#FFFFB6"],
    [0.7, "#FDD0DA"],
    [0.8, "#FB889E"],
    [0.9, "#FFFDDA"],
  ];

  for (let i = 0; i < w; i++) {
    ctx.fillStyle = colors[i][1];
    ctx.fillRect(i, 0, 1, 1);
  }

  const tex = new CanvasTexture(canvas);
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
