'use client';
import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  href?: string;
  download?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export default function MagneticButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  href,
  download,
  type = 'button',
  disabled = false,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 180, damping: 14, mass: 0.12 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!ref.current || disabled) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    x.set((clientX - centerX) * 0.32);
    y.set((clientY - centerY) * 0.32);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const baseStyles = "relative inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-full font-mono text-[11px] uppercase tracking-[0.2em] transition-all duration-300 select-none cursor-pointer group overflow-hidden border disabled:opacity-50 disabled:pointer-events-none";

  const variantStyles = {
    primary: "border-white/20 bg-white/5 backdrop-blur-md text-white hover:bg-white hover:text-black hover:border-white shadow-lg shadow-black/40",
    secondary: "border-white/10 bg-neutral-900/60 text-neutral-300 hover:border-white/40 hover:text-white hover:bg-neutral-800/80",
    ghost: "border-transparent bg-transparent text-neutral-400 hover:text-white hover:border-white/20",
    accent: "border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400 hover:text-black hover:border-amber-400",
  }[variant];

  if (href) {
    return (
      <motion.a
        ref={ref as any}
        href={href}
        download={download}
        style={{ x: springX, y: springY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`${baseStyles} ${variantStyles} ${className}`}
      >
        <span className="relative z-10 flex items-center gap-2.5 font-medium">{children}</span>
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={ref as any}
      type={type}
      disabled={disabled}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2.5 font-medium">{children}</span>
    </motion.button>
  );
}
