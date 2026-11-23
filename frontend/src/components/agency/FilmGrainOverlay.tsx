'use client';
import React from 'react';

export default function FilmGrainOverlay() {
  return (
    <div 
      aria-hidden="true" 
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.035] mix-blend-overlay overflow-hidden select-none"
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <filter id="noiseFilter">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.8" 
            numOctaves="3" 
            stitchTiles="stitch" 
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </div>
  );
}
