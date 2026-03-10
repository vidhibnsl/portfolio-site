'use client';

import React from 'react';

/* ------------------------------------------------------------------ */
/*  WireframeOverlay                                                   */
/*  HTML headline + subtitle floating above the 3D canvas.             */
/*  Pure CSS — no 3D dependency.                                       */
/* ------------------------------------------------------------------ */

interface WireframeOverlayProps {
  headline?: string;
  subtitle?: string;
}

export default function WireframeOverlay({
  headline = 'Vidhi Bansal',
  subtitle = '3D Visualizer · World Builder · Cinematics',
}: WireframeOverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        pointerEvents: 'none',
        textAlign: 'center',
        paddingTop: 'clamp(5rem, 12vh, 8rem)',
        paddingLeft: '2rem',
        paddingRight: '2rem',
      }}
    >
      <h1
        style={{
          fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          fontWeight: 300,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          color: '#0f1720',
          margin: '0 0 0.6rem',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        {headline}
      </h1>

      <p
        style={{
          fontSize: 'clamp(0.6rem, 1.1vw, 0.85rem)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(15, 23, 32, 0.4)',
          margin: 0,
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          fontWeight: 400,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}
