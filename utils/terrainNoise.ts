/**
 * terrainNoise.ts
 * Lightweight 2D noise utilities for terrain generation.
 * No external dependencies — uses a hash-based smooth noise with
 * Hermite interpolation, layered into fbm and ridge noise.
 */

/* ------------------------------------------------------------------ */
/*  Core noise primitives                                              */
/* ------------------------------------------------------------------ */

function hash(x: number, z: number): number {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  let fx = x - ix;
  let fz = z - iz;
  // Hermite smoothstep
  fx = fx * fx * (3 - 2 * fx);
  fz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz);
  const b = hash(ix + 1, iz);
  const c = hash(ix, iz + 1);
  const d = hash(ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

/* ------------------------------------------------------------------ */
/*  Fractal Brownian Motion (standard layered noise)                   */
/* ------------------------------------------------------------------ */

export function fbm(x: number, z: number, octaves: number): number {
  let val = 0;
  let amp = 1;
  let freq = 1;
  let max = 0;
  for (let o = 0; o < octaves; o++) {
    val += amp * (smoothNoise(x * freq, z * freq) - 0.5);
    max += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return val / max;
}

/* ------------------------------------------------------------------ */
/*  Ridge noise — sharp peaks via folded absolute value                */
/* ------------------------------------------------------------------ */

export function ridgeNoise(x: number, z: number, octaves: number): number {
  let val = 0;
  let amp = 1;
  let freq = 1;
  let max = 0;
  for (let o = 0; o < octaves; o++) {
    const n = 1 - Math.abs(smoothNoise(x * freq, z * freq) - 0.5) * 2;
    val += amp * n * n;
    max += amp;
    amp *= 0.45;
    freq *= 2.1;
  }
  return val / max;
}

/* ------------------------------------------------------------------ */
/*  Base height map generator                                          */
/* ------------------------------------------------------------------ */

export interface BaseHeightConfig {
  noiseScale: number;
  noiseAmp: number;
  horizonFalloff: number;
}

/**
 * Generates a Float32Array of base heights for a terrain mesh.
 *
 * @param uvNorm   Flat array of [u, v] pairs in [-1, 1] for each vertex.
 *                 v = +1 is near camera (foreground), v = -1 is far (horizon).
 * @param numVerts Total vertex count.
 * @param config   Noise parameters.
 * @returns        Float32Array of heights, one per vertex.
 */
export function computeBaseHeights(
  uvNorm: Float32Array,
  numVerts: number,
  config: BaseHeightConfig
): Float32Array {
  const { noiseScale: ns, noiseAmp, horizonFalloff } = config;
  const heights = new Float32Array(numVerts);

  for (let i = 0; i < numVerts; i++) {
    const u = uvNorm[i * 2];
    const v = uvNorm[i * 2 + 1];

    // depthNorm: 0 = near camera (foreground, v ≈ +1), 1 = far horizon (v ≈ -1)
    const depthNorm = (1 - v) * 0.5;
    const hFactor = Math.pow(Math.max(0, depthNorm), horizonFalloff);

    // Layered terrain noise
    const mountains = Math.abs(fbm(u * ns * 1.5 + 0.3, v * ns * 1.5, 6)) * 3.2;
    const ridges = Math.max(0, ridgeNoise(u * ns * 2.5 + 5.1, v * ns * 2.5 + 3.7, 5)) * 1.6;
    const secondaryPeaks = Math.abs(fbm(u * ns * 3.5 + 1.9, v * ns * 3.5 + 7.2, 4)) * 1.0;
    const detail = fbm(u * ns * 7.0 + 8.6, v * ns * 7.0 + 4.2, 3) * 0.25;

    // Taper at lateral edges
    const edgeX = 1 - Math.pow(Math.abs(u), 5);

    heights[i] =
      (mountains + ridges + secondaryPeaks + detail) * noiseAmp * hFactor * edgeX;
  }

  return heights;
}
