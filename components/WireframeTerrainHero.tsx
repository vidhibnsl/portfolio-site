'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { computeBaseHeights, fbm } from '../utils/terrainNoise';
import WireframeOverlay from './WireframeOverlay';

/* ================================================================== */
/*  Configuration                                                      */
/* ================================================================== */

export interface TerrainConfig {
  /** Horizontal subdivisions (desktop). */
  segmentsX: number;
  /** Depth subdivisions (desktop). */
  segmentsY: number;
  /** Horizontal subdivisions (mobile). */
  mobileSegmentsX: number;
  /** Depth subdivisions (mobile). */
  mobileSegmentsY: number;
  /** Plane width in world units. */
  planeWidth: number;
  /** Plane depth in world units. */
  planeDepth: number;
  /** Noise frequency multiplier. */
  noiseScale: number;
  /** Overall noise amplitude. */
  noiseAmp: number;
  /** Controls peak concentration toward horizon (lower = more uniform). */
  horizonFalloff: number;
  /** Gaussian brush falloff (higher = tighter brush). */
  brushFalloff: number;
  /** How strongly the brush flattens peaks (0–1). */
  flattenStrength: number;
  /** Plateau height as fraction of base height (0–1). */
  plateauFactor: number;
  /** Mouse velocity pulse amplitude. */
  pulseAmp: number;
  /** Pulse exponential decay time in seconds. */
  pulseDecay: number;
  /** Mouse position lerp factor per frame (at 60 fps). */
  mouseLerp: number;
  /** Height return lerp factor per frame (at 60 fps). */
  heightLerp: number;
  /** Wireframe line color. */
  wireColor: string;
  /** Wireframe opacity (0–1). */
  wireOpacity: number;
}

const DEFAULTS: TerrainConfig = {
  segmentsX: 200,
  segmentsY: 120,
  mobileSegmentsX: 120,
  mobileSegmentsY: 72,
  planeWidth: 20,
  planeDepth: 14,
  noiseScale: 1.2,
  noiseAmp: 0.35,
  horizonFalloff: 0.6,
  brushFalloff: 18.0,
  flattenStrength: 0.95,
  plateauFactor: 0.12,
  pulseAmp: 0.08,
  pulseDecay: 0.35,
  mouseLerp: 0.12,
  heightLerp: 0.08,
  wireColor: '#1a1a2e',
  wireOpacity: 0.38,
};

/* ================================================================== */
/*  Terrain mesh (inner R3F component)                                 */
/* ================================================================== */

interface TerrainProps {
  config: TerrainConfig;
  reducedMotion: boolean;
}

function Terrain({ config, reducedMotion }: TerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { camera } = useThree();

  /* ---------- mouse state ---------- */
  const smoothMx = useRef(0);
  const smoothMy = useRef(0);
  const prevMx = useRef(0);
  const prevMy = useRef(0);
  const smoothVel = useRef(0);
  const pulseStr = useRef(0);
  const mouseActive = useRef(false);

  // Raycast helpers
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndcMouse = useRef(new THREE.Vector2(-10, -10));
  const hitPoint = useMemo(() => new THREE.Vector3(), []);

  // Cursor position in normalized plane coords [-1, 1]
  const cursorU = useRef(0);
  const cursorV = useRef(0);

  /* ---------- pointer events ---------- */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      ndcMouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndcMouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseActive.current = true;
    };
    const onLeave = () => {
      mouseActive.current = false;
      ndcMouse.current.set(-10, -10);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  /* ---------- geometry + base heights (computed once) ---------- */
  const { geometry, baseHeights, uvNorm, numVerts, currentHeights } = useMemo(() => {
    const sx = config.segmentsX;
    const sy = config.segmentsY;
    const nv = (sx + 1) * (sy + 1);

    const geo = new THREE.PlaneGeometry(config.planeWidth, config.planeDepth, sx, sy);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const halfW = config.planeWidth * 0.5;
    const halfD = config.planeDepth * 0.5;

    // Precompute normalised coords
    const uv = new Float32Array(nv * 2);
    for (let i = 0; i < nv; i++) {
      uv[i * 2] = pos.getX(i) / halfW;
      uv[i * 2 + 1] = pos.getZ(i) / halfD;
    }

    // Generate base terrain
    const bh = computeBaseHeights(uv, nv, {
      noiseScale: config.noiseScale,
      noiseAmp: config.noiseAmp,
      horizonFalloff: config.horizonFalloff,
    });

    // Apply base heights
    for (let i = 0; i < nv; i++) pos.setY(i, bh[i]);
    pos.needsUpdate = true;

    // Current heights start at base
    const ch = new Float32Array(bh);

    return { geometry: geo, baseHeights: bh, uvNorm: uv, numVerts: nv, currentHeights: ch };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.segmentsX, config.segmentsY, config.planeWidth, config.planeDepth,
      config.noiseScale, config.noiseAmp, config.horizonFalloff]);

  /* ---------- material ---------- */
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(config.wireColor),
        wireframe: true,
        transparent: true,
        opacity: config.wireOpacity,
      }),
    [config.wireColor, config.wireOpacity]
  );

  /* ---------- per-frame deformation ---------- */
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const dt = Math.min(delta, 0.05);

    // Frame-rate-independent lerp: factor = 1 - (1 - rate)^(dt*60)
    const ml = 1 - Math.pow(1 - config.mouseLerp, dt * 60);
    const hl = 1 - Math.pow(1 - config.heightLerp, dt * 60);

    /* --- project cursor onto ground plane --- */
    let active = false;
    if (mouseActive.current && !reducedMotion) {
      raycaster.setFromCamera(ndcMouse.current, camera);
      const hit = raycaster.ray.intersectPlane(groundPlane, hitPoint);
      if (hit) {
        const halfW = config.planeWidth * 0.5;
        const halfD = config.planeDepth * 0.5;
        cursorU.current = THREE.MathUtils.clamp(hitPoint.x / halfW, -1.5, 1.5);
        cursorV.current = THREE.MathUtils.clamp(hitPoint.z / halfD, -1.5, 1.5);
        active = true;
      }
    }

    /* --- smooth cursor --- */
    smoothMx.current += (cursorU.current - smoothMx.current) * ml;
    smoothMy.current += (cursorV.current - smoothMy.current) * ml;
    const smx = smoothMx.current;
    const smy = smoothMy.current;

    /* --- velocity --- */
    const dmx = smx - prevMx.current;
    const dmy = smy - prevMy.current;
    const vel = Math.sqrt(dmx * dmx + dmy * dmy) / Math.max(dt, 0.001);
    smoothVel.current += (vel - smoothVel.current) * 0.1;
    prevMx.current = smx;
    prevMy.current = smy;

    /* --- pulse (decaying velocity response) --- */
    pulseStr.current += (smoothVel.current * config.pulseAmp * 0.01 - pulseStr.current) * 0.15;
    pulseStr.current *= Math.exp(-dt / config.pulseDecay);
    const ps = pulseStr.current;

    /* --- per-vertex deformation --- */
    const bf = config.brushFalloff;
    const fs = config.flattenStrength;
    const pf = config.plateauFactor;

    for (let i = 0; i < numVerts; i++) {
      const u = uvNorm[i * 2];
      const v = uvNorm[i * 2 + 1];
      const baseH = baseHeights[i];

      let targetH = baseH;

      if (active) {
        const du = u - smx;
        const dv = v - smy;
        const d2 = du * du + dv * dv;
        const flatten = Math.min(Math.exp(-d2 * bf) * fs, 1.0);
        const plateauH = baseH * pf;

        // Flatten: blend from base toward plateau under the brush
        targetH = baseH + (plateauH - baseH) * flatten;

        // Velocity pulse: noisy perturbation near cursor
        if (ps > 0.001) {
          const pulseFalloff = Math.exp(-d2 * bf * 0.5);
          const noiseVal = fbm(u * 8 + smx * 2, v * 8 + smy * 2, 2);
          targetH += ps * pulseFalloff * noiseVal * Math.max(baseH, 0.05) * 4;
        }
      }

      // Damped lerp toward target (smooth flatten + smooth return)
      currentHeights[i] += (targetH - currentHeights[i]) * hl;
      pos.setY(i, currentHeights[i]);
    }

    pos.needsUpdate = true;

    // Subtle opacity response to velocity
    material.opacity = config.wireOpacity + Math.min(ps * 2, 0.12);
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

/* ================================================================== */
/*  Camera controller (sets lookAt once after mount)                   */
/* ================================================================== */

function CameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, 0.2, -2);
  }, [camera]);
  return null;
}

/* ================================================================== */
/*  Main export: WireframeTerrainHero                                  */
/* ================================================================== */

interface WireframeTerrainHeroProps {
  /** H1 headline text. */
  headline?: string;
  /** Subtitle text. */
  subtitle?: string;
  /** Override any terrain config value. */
  config?: Partial<TerrainConfig>;
  /** Additional CSS class on the outer section. */
  className?: string;
  /** Background color. */
  bgColor?: string;
}

export default function WireframeTerrainHero({
  headline,
  subtitle,
  config: userConfig,
  className = '',
  bgColor = '#fafafa',
}: WireframeTerrainHeroProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 900);
    setReducedMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  const config = useMemo<TerrainConfig>(() => {
    const base = { ...DEFAULTS, ...userConfig };
    if (isMobile) {
      base.segmentsX = base.mobileSegmentsX;
      base.segmentsY = base.mobileSegmentsY;
    }
    return base;
  }, [userConfig, isMobile]);

  const dpr = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    return isMobile
      ? Math.min(window.devicePixelRatio, 1.5)
      : Math.min(window.devicePixelRatio, 2);
  }, [isMobile]);

  return (
    <section
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: bgColor,
      }}
    >
      {/* HTML overlay (headline + subtitle) */}
      <WireframeOverlay headline={headline} subtitle={subtitle} />

      {/* Soft gradient fog toward horizon */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 5,
          pointerEvents: 'none',
          background: `linear-gradient(
            to bottom,
            ${bgColor}ee 0%,
            ${bgColor}00 30%,
            ${bgColor}00 75%,
            ${bgColor}99 100%
          )`,
        }}
      />

      {/* Vignette */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 4,
          pointerEvents: 'none',
          boxShadow: `inset 0 0 140px 50px ${bgColor}80`,
        }}
      />

      {/* 3D canvas */}
      <Canvas
        dpr={dpr}
        camera={{
          fov: 55,
          near: 0.1,
          far: 100,
          position: [0, 3.2, 7],
        }}
        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(bgColor, 1);
        }}
      >
        <CameraRig />
        <Terrain config={config} reducedMotion={reducedMotion} />
      </Canvas>
    </section>
  );
}
