'use client';
import React, { useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export interface FloatingItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  meta?: string;
  mediaUrl: string;
  badge?: string;
  accentColor?: string;
}

interface FloatingMediaRevealProps {
  items: FloatingItem[];
  label?: string;
  sublabel?: string;
  onItemClick?: (item: FloatingItem) => void;
}

export default function FloatingMediaReveal({
  items,
  label = "Curated Culinary Architecture",
  sublabel = "Daily Institutional Index",
  onItemClick,
}: FloatingMediaRevealProps) {
  const [activeItem, setActiveItem] = useState<FloatingItem | null>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 22, stiffness: 160, mass: 0.45 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="relative w-full overflow-hidden select-none"
    >
      <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-6">
        <span className="font-mono text-[10px] md:text-[11px] tracking-[0.25em] text-neutral-400 uppercase">
          {label}
        </span>
        <span className="font-mono text-[10px] md:text-[11px] tracking-[0.25em] text-neutral-500 uppercase">
          {sublabel} [ {items.length} ]
        </span>
      </div>

      <div className="divide-y divide-white/10">
        {items.map((item, index) => (
          <div
            key={item.id}
            data-cursor="VIEW"
            onMouseEnter={() => setActiveItem(item)}
            onMouseLeave={() => setActiveItem(null)}
            onClick={() => onItemClick && onItemClick(item)}
            className="group relative flex flex-col md:flex-row md:items-center justify-between py-6 transition-all duration-500 hover:text-white cursor-pointer"
          >
            <div className="flex items-baseline gap-4 md:gap-8">
              <span className="font-mono text-xs text-neutral-600 group-hover:text-amber-400 transition-colors">
                [0{index + 1}]
              </span>
              <div>
                <h3 className="text-xl md:text-3xl font-display font-normal tracking-tight transition-transform duration-500 group-hover:translate-x-3 text-neutral-200 group-hover:text-white">
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p className="font-mono text-[11px] text-neutral-500 mt-1 tracking-wide">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 mt-3 md:mt-0 font-mono text-[11px] text-neutral-400 uppercase tracking-widest">
              {item.badge && (
                <span className="px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-[9px] text-amber-300">
                  {item.badge}
                </span>
              )}
              <span>{item.category}</span>
              {item.meta && (
                <span className="text-neutral-600 group-hover:text-neutral-300 transition-colors">
                  {item.meta}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Hover Asset */}
      <motion.div
        style={{
          left: smoothX,
          top: smoothY,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: activeItem ? 1 : 0,
          opacity: activeItem ? 1 : 0,
          rotate: activeItem ? 2 : 0,
        }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none fixed z-50 w-72 md:w-88 h-48 md:h-56 rounded-md overflow-hidden border border-white/20 shadow-2xl bg-neutral-950/90 backdrop-blur-md"
      >
        {activeItem && (
          <div className="relative w-full h-full flex flex-col">
            <img 
              src={activeItem.mediaUrl} 
              alt={activeItem.title} 
              className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-amber-400">
                {activeItem.category}
              </span>
              <span className="font-display text-lg text-white font-medium">
                {activeItem.title}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
