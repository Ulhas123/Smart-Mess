'use client';
import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [cursorText, setCursorText] = useState<string>('');
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isPointer, setIsPointer] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 24, stiffness: 220, mass: 0.4 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Disable on touch devices
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const cursorEl = target.closest('[data-cursor]') as HTMLElement | null;
      if (cursorEl) {
        setCursorText(cursorEl.getAttribute('data-cursor') || '');
        setIsHovered(true);
      } else {
        setCursorText('');
        setIsHovered(false);
      }

      const clickable = target.closest('button, a, input, select, textarea, [role="button"]');
      setIsPointer(!!clickable);
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [isVisible, mouseX, mouseY]);

  if (!isVisible) return null;

  return (
    <motion.div
      style={{
        left: smoothX,
        top: smoothY,
        transform: 'translate(-50%, -50%)',
      }}
      className="pointer-events-none fixed z-[9999] flex items-center justify-center transition-opacity duration-200"
    >
      <motion.div
        animate={{
          scale: isHovered ? 1 : isPointer ? 1.5 : 1,
          width: isHovered && cursorText ? 'auto' : isPointer ? 32 : 12,
          height: isHovered && cursorText ? 32 : isPointer ? 32 : 12,
          paddingLeft: isHovered && cursorText ? 14 : 0,
          paddingRight: isHovered && cursorText ? 14 : 0,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 250 }}
        className={`flex items-center justify-center rounded-full border border-white/40 shadow-2xl backdrop-blur-md ${
          isHovered
            ? 'bg-white text-black font-mono text-[10px] uppercase font-bold tracking-[0.2em] shadow-white/20'
            : isPointer
            ? 'bg-white/20 border-white/60'
            : 'bg-white/80'
        }`}
      >
        {isHovered && cursorText && (
          <span className="whitespace-nowrap select-none">{cursorText}</span>
        )}
      </motion.div>
    </motion.div>
  );
}
