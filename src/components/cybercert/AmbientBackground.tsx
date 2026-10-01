"use client";

import React from "react";

export function AmbientBackground() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#030407]"
      aria-hidden="true"
    >
      {/* 1. LENTE ANAMÓRFICA / HORIZONTE ORBITAL (Inspirado na curvatura atmosférica vista da Dragon/Starship) */}
      <div 
        className="absolute -top-[25vw] left-1/2 -translate-x-1/2 w-[140vw] h-[55vw] rounded-[100%] opacity-40 blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 30%, rgba(56, 189, 248, 0.15) 0%, rgba(30, 58, 138, 0.08) 45%, transparent 75%)"
        }}
      />

      {/* 2. MALHA DE TELEMETRIA AEROESPACIAL (Grid submilimétrico com mira técnica) */}
      <div 
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.8) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px"
        }}
      />

      {/* 3. COORDENADAS / MARCADORES DE RETÍCULA ÓPTICA (+) */}
      <div 
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.9) 1px, transparent 1px)`,
          backgroundSize: "240px 240px",
          backgroundPosition: "24px 24px"
        }}
      />

      {/* 4. VINHETA ÓPTICA CINEMATOGRÁFICA (Concentra o foco operacional no centro do console) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 35%, transparent 35%, rgba(3, 4, 7, 0.75) 85%, #030407 100%)"
        }}
      />

      {/* 5. MICRO-GRÃO FOTOGRÁFICO PROCEDURAL (Elimina banding digital do monitor OLED/IPS) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.018] mix-blend-screen pointer-events-none">
        <filter id="aerospace-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#aerospace-grain)" />
      </svg>
    </div>
  );
}

export default AmbientBackground;

