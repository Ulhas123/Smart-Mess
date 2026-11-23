import React from 'react';

export default function KineticMarquee() {
  const track1 = [
    'HAWKES INTENSITY KERNEL: λ(t) = μ₀ + Σ αᵢ e^(-βᵢ(t - tᵢ))',
    'PINBALL QUANTILE LOSS: L_τ(y, ŷ) = max(τ(y - ŷ), (1 - τ)(ŷ - y))',
    'VOLUME-WEIGHTED WAPE: 25.95% (BENCHMARK BEST)',
    'HETEROSCEDASTIC DISPERSION: Var(Y) = μ + α μ²',
    'ASYMMETRIC NEWSVENDOR RATIO: 3:1 (C_shortage = 3, C_waste = 1)',
    '612 UNSEEN HOLDOUT MEAL EVENTS · ZERO DATA LEAKAGE',
    'LIGHTGBM ALL FEATURES: MAE 41.54 HEADS · 0.8 MS LATENCY',
    'ANNUAL CAMPUS FOOD SAVED: 5,100+ KG PREVENTATIVE REDUCTION',
  ];

  const track2 = [
    'IIIT ALLAHABAD · DEPARTMENT OF ELECTRONICS & COMMUNICATION ENGINEERING',
    'PROJECT SUPERVISOR: DR. KIRTAN GOPAL PANDA (ASSISTANT PROFESSOR)',
    'RESEARCHERS: VARUN KARANKAR · AADARSH SINGH · TUSHAR GARG',
    'BH-2 HOSTEL: 300 CAPACITY (PURE VEG DIETARY PROFILE)',
    'BH-3 HOSTEL: 300 CAPACITY (NON-VEG CATERING PROTOCOL)',
    'PRAYAGRAJ IST TIME ZONE: ASIA/KOLKATA (UTC+5:30) HARDWARE SYNC',
    'KMK GLOBAL LIMITED: BH-2 & BH-3 OFFICIAL 21-SLOT WEEKLY MENU',
    'ZERO CRITICAL SURGE FALSE NEGATIVES ACROSS ALL DINING EXODUSES',
  ];

  return (
    <div className="relative w-full py-10 bg-[#060608] border-t border-b border-white/10 overflow-hidden select-none group">
      {/* Background glow strip */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-amber-500/5 to-transparent pointer-events-none" />

      {/* Track 1: Mathematical Theorems (Scrolls Left) */}
      <div className="flex w-max space-x-12 animate-marquee py-2 group-hover:[animation-play-state:paused]">
        {[...track1, ...track1].map((text, idx) => (
          <div 
            key={idx}
            className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.25em] text-neutral-400 whitespace-nowrap transition-colors hover:text-amber-400 cursor-default"
          >
            <span>{text}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
          </div>
        ))}
      </div>

      {/* Track 2: Campus Telemetry & Authors (Scrolls Right) */}
      <div className="flex w-max space-x-12 animate-marquee-reverse py-2 border-t border-white/5 mt-2 group-hover:[animation-play-state:paused]">
        {[...track2, ...track2].map((text, idx) => (
          <div 
            key={idx}
            className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.25em] text-neutral-500 whitespace-nowrap transition-colors hover:text-emerald-400 cursor-default"
          >
            <span>{text}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
