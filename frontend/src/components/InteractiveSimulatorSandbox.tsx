'use client';
import React, { useState } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  CloudRain, 
  Flame, 
  Clock, 
  ShoppingBag, 
  ChefHat, 
  AlertCircle,
  BarChart3
} from 'lucide-react';
import MagneticButton from './agency/MagneticButton';

type PresetKey = 'midsem' | 'diwali' | 'rain' | 'sunday';

interface Preset {
  id: PresetKey;
  label: string;
  badge: string;
  desc: string;
  q10: number;
  q50: number;
  q90: number;
  expectedTurnout: number;
  deltaPercent: string;
  batchT60: number;
  batchT15: number;
  batchBuffer: number;
  flour: number;
  rice: number;
  dal: number;
  oil: number;
  dairyPoultry: number;
}

const PRESETS: Record<PresetKey, Preset> = {
  midsem: {
    id: 'midsem',
    label: 'Mid-Sem Exam Rush',
    badge: 'Exam Multiplier (1.06)',
    desc: 'Intense examination period drives on-campus dining retention. Academic calendar multiplier of 1.06 lifts dinner turnout to peak operational surge.',
    q10: 205,
    q50: 242,
    q90: 278,
    expectedTurnout: 242,
    deltaPercent: '+6.0%',
    batchT60: 169,
    batchT15: 48,
    batchBuffer: 43,
    flour: 26.6,
    rice: 29.0,
    dal: 12.1,
    oil: 6.0,
    dairyPoultry: 19.4,
  },
  diwali: {
    id: 'diwali',
    label: 'Diwali Mass Exodus',
    badge: 'Hawkes Kernel (a=0.70, b=2.5d)',
    desc: 'Self-exciting exponential student departure cascade prior to Diwali. Hawkes shock of 70% drops dining turnout to vacation baseline.',
    q10: 52,
    q50: 68,
    q90: 88,
    expectedTurnout: 68,
    deltaPercent: '-70.0%',
    batchT60: 48,
    batchT15: 14,
    batchBuffer: 16,
    flour: 7.5,
    rice: 8.2,
    dal: 3.4,
    oil: 1.7,
    dairyPoultry: 5.4,
  },
  rain: {
    id: 'rain',
    label: 'Prayagraj Monsoon Torrent',
    badge: 'Rain Breakfast Mult (0.82)',
    desc: 'Heavy morning precipitation trap residents in hostels or cause skipped meals. Breakfast attendance falls by 18% under weather multiplier 0.82.',
    q10: 84,
    q50: 103,
    q90: 124,
    expectedTurnout: 103,
    deltaPercent: '-18.0%',
    batchT60: 72,
    batchT15: 21,
    batchBuffer: 21,
    flour: 8.2,
    rice: 4.1,
    dal: 2.1,
    oil: 1.5,
    dairyPoultry: 15.5,
  },
  sunday: {
    id: 'sunday',
    label: 'BH-3 Special Non-Veg Night',
    badge: 'BH-3 Non-Veg (+7%) & Dessert (+6%)',
    desc: 'Friday non-veg pull factor in BH-3 combined with dessert creates highest weekly demand peak across university hostels.',
    q10: 220,
    q50: 258,
    q90: 282,
    expectedTurnout: 258,
    deltaPercent: '+13.0%',
    batchT60: 180,
    batchT15: 52,
    batchBuffer: 46,
    flour: 28.4,
    rice: 31.0,
    dal: 12.9,
    oil: 6.5,
    dairyPoultry: 36.1,
  },
};

export default function InteractiveSimulatorSandbox() {
  const [activePreset, setActivePreset] = useState<PresetKey>('midsem');
  const [customMultiplier, setCustomMultiplier] = useState<number>(1.0);
  const data = PRESETS[activePreset];

  const scaledQ10 = Math.round(data.q10 * customMultiplier);
  const scaledQ50 = Math.round(data.q50 * customMultiplier);
  const scaledQ90 = Math.round(data.q90 * customMultiplier);

  return (
    <section className="relative w-full py-24 px-6 md:px-16 bg-[#09090b] text-neutral-100 border-t border-b border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
                Predictive Machine Learning Engine // Sub-Millisecond Inference
              </span>
            </div>
            <h2 className="text-3xl md:text-6xl font-display font-light tracking-tight text-white">
              LightGBM Quantile Forecaster.
            </h2>
            <p className="font-sans text-sm md:text-base text-neutral-400 max-w-2xl mt-3 font-light leading-relaxed">
              Explore how calendar regimes, Hawkes festival departure cascades, and weather anomalies shape non-crossing prediction bounds ($q_{10}, q_{50}, q_{90}$) in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest">
              [ Inference: 0.8ms ]
            </span>
            <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 font-mono text-xs text-amber-300">
              Pinball Loss Calibration
            </div>
          </div>
        </div>

        {/* 1-Click Scenario Preset Toggles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {(Object.keys(PRESETS) as PresetKey[]).map((key) => {
            const p = PRESETS[key];
            const isSelected = activePreset === key;
            return (
              <button
                key={key}
                onClick={() => setActivePreset(key)}
                data-cursor="SIMULATE"
                className={`text-left p-5 rounded-sm border transition-all duration-300 ${
                  isSelected
                    ? 'border-white/50 bg-white/10 text-white shadow-xl shadow-black/50'
                    : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                    Preset [{p.id.toUpperCase()}]
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/5 text-neutral-400'
                  }`}>
                    {p.deltaPercent}
                  </span>
                </div>
                <h4 className="font-display text-lg text-white font-medium mb-1">{p.label}</h4>
                <p className="font-mono text-[11px] text-neutral-400 line-clamp-2">{p.badge}</p>
              </button>
            );
          })}
        </div>

        {/* Dynamic Display Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Visualizer & Quantile Fan (7 Cols) */}
          <div className="lg:col-span-7 rounded-sm border border-white/10 bg-neutral-950/70 p-6 md:p-8 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400">
                  Scenario Telemetry // {data.label}
                </span>
                <p className="font-sans text-xs text-neutral-400 mt-1 max-w-lg">
                  {data.desc}
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-[10px] text-neutral-500 block">Hostel Capacity</span>
                <span className="font-mono text-sm font-semibold text-neutral-200">300 Heads</span>
              </div>
            </div>

            {/* Quantile Fan Representation */}
            <div className="my-8">
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                  Quantile Prediction Fan
                </span>
                <span className="font-mono text-xs text-neutral-400">
                  Tolerance Band: [{scaledQ10} — {scaledQ90}] Heads
                </span>
              </div>

              {/* Graphical Scale Bar */}
              <div className="relative h-14 w-full bg-neutral-900/80 rounded-sm border border-white/10 overflow-hidden flex items-center px-4">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                  {[0, 50, 100, 150, 200, 250, 300].map((tick) => (
                    <div key={tick} className="h-full border-r border-white/30 text-[9px] font-mono pl-1 pt-1 text-neutral-400">
                      {tick}
                    </div>
                  ))}
                </div>

                {/* q10 to q90 interval fill */}
                <div
                  className="absolute h-8 bg-gradient-to-r from-emerald-500/20 via-amber-400/30 to-rose-500/20 rounded border-t border-b border-amber-400/40 transition-all duration-700"
                  style={{
                    left: `${(scaledQ10 / 300) * 100}%`,
                    width: `${((scaledQ90 - scaledQ10) / 300) * 100}%`,
                  }}
                />

                {/* q50 Median Indicator Needle */}
                <div
                  className="absolute h-10 w-1 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] z-10 transition-all duration-700"
                  style={{ left: `${(scaledQ50 / 300) * 100}%` }}
                >
                  <div className="absolute -top-5 -translate-x-1/2 font-mono text-[10px] text-amber-300 font-bold whitespace-nowrap bg-black/80 px-1 rounded">
                    q50: {scaledQ50}
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-neutral-500 font-mono text-[10px] mt-2">
                <span>0 heads (Empty)</span>
                <span>150 heads (Half)</span>
                <span>300 heads (Full Capacity)</span>
              </div>
            </div>

            {/* Quantile Numerical Breakdown */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
              <div className="p-4 rounded border border-white/5 bg-white/[0.02]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 block mb-1">
                  q10 · Lower Bound
                </span>
                <span className="font-display text-2xl text-white font-normal">
                  {scaledQ10} <span className="text-xs font-mono text-neutral-500">heads</span>
                </span>
                <p className="font-mono text-[10px] text-neutral-500 mt-1">Zero excess waste baseline</p>
              </div>

              <div className="p-4 rounded border border-amber-400/20 bg-amber-400/[0.03]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-amber-300 block mb-1">
                  q50 · Median Target
                </span>
                <span className="font-display text-2xl text-white font-normal">
                  {scaledQ50} <span className="text-xs font-mono text-neutral-500">heads</span>
                </span>
                <p className="font-mono text-[10px] text-neutral-500 mt-1">Optimal mathematical prep</p>
              </div>

              <div className="p-4 rounded border border-white/5 bg-white/[0.02]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-rose-400 block mb-1">
                  q90 · Buffer Ceiling
                </span>
                <span className="font-display text-2xl text-white font-normal">
                  {scaledQ90} <span className="text-xs font-mono text-neutral-500">heads</span>
                </span>
                <p className="font-mono text-[10px] text-neutral-500 mt-1">Stock-out elimination cap</p>
              </div>
            </div>

            {/* Custom Multiplier Slider */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-widest">
                  Fine Volatility Scale:
                </span>
                <span className="font-mono text-xs text-amber-300 font-bold">
                  {(customMultiplier * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={customMultiplier}
                onChange={(e) => setCustomMultiplier(parseFloat(e.target.value))}
                className="w-48 accent-amber-400 cursor-pointer"
              />
              <button
                onClick={() => setCustomMultiplier(1.0)}
                className="font-mono text-[10px] uppercase text-neutral-400 hover:text-white underline underline-offset-4"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Staged Batch Prep & Raw Materials (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Batch Preparation Staging */}
            <div className="rounded-sm border border-white/10 bg-neutral-950/70 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ChefHat size={16} className="text-amber-400" />
                  <span className="font-mono text-[11px] uppercase tracking-widest text-white font-medium">
                    Staged Batch Cook Schedule
                  </span>
                </div>
                <span className="font-mono text-[10px] text-neutral-500">3-Stage Protocol</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded border border-white/5 bg-white/[0.02]">
                  <div>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider block">
                      Stage 1 · T-60 min (Core Prep)
                    </span>
                    <span className="font-sans text-xs text-neutral-300">Base gravy, rice steam, dal boil</span>
                  </div>
                  <span className="font-mono text-base font-semibold text-emerald-400">
                    {Math.round(data.batchT60 * customMultiplier)} <span className="text-[10px] text-neutral-500 font-normal">heads</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded border border-white/5 bg-white/[0.02]">
                  <div>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider block">
                      Stage 2 · T-15 min (Live Service)
                    </span>
                    <span className="font-sans text-xs text-neutral-300">Fresh tawa phulkas, paneer roast</span>
                  </div>
                  <span className="font-mono text-base font-semibold text-amber-300">
                    {Math.round(data.batchT15 * customMultiplier)} <span className="text-[10px] text-neutral-500 font-normal">heads</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded border border-white/5 bg-white/[0.02]">
                  <div>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider block">
                      Stage 3 · T+30 min (On-Demand Buffer)
                    </span>
                    <span className="font-sans text-xs text-neutral-300">Triggered if turnstile &gt; q50 at midpoint</span>
                  </div>
                  <span className="font-mono text-base font-semibold text-rose-400">
                    {Math.round(data.batchBuffer * customMultiplier)} <span className="text-[10px] text-neutral-500 font-normal">heads</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Raw Materials Breakdown */}
            <div className="rounded-sm border border-white/10 bg-neutral-950/70 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-emerald-400" />
                  <span className="font-mono text-[11px] uppercase tracking-widest text-white font-medium">
                    Raw Material Procurement
                  </span>
                </div>
                <span className="font-mono text-[10px] text-neutral-500">Calculated for q50</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded border border-white/5 bg-white/[0.01]">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase block">Whole Wheat Atta</span>
                  <span className="font-mono text-base text-neutral-100 font-medium">
                    {(data.flour * customMultiplier).toFixed(1)} <span className="text-[10px] text-neutral-500">kg</span>
                  </span>
                </div>
                <div className="p-2.5 rounded border border-white/5 bg-white/[0.01]">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase block">Basmati Rice</span>
                  <span className="font-mono text-base text-neutral-100 font-medium">
                    {(data.rice * customMultiplier).toFixed(1)} <span className="text-[10px] text-neutral-500">kg</span>
                  </span>
                </div>
                <div className="p-2.5 rounded border border-white/5 bg-white/[0.01]">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase block">Pulses / Dal</span>
                  <span className="font-mono text-base text-neutral-100 font-medium">
                    {(data.dal * customMultiplier).toFixed(1)} <span className="text-[10px] text-neutral-500">kg</span>
                  </span>
                </div>
                <div className="p-2.5 rounded border border-white/5 bg-white/[0.01]">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase block">Paneer / Chicken</span>
                  <span className="font-mono text-base text-neutral-100 font-medium">
                    {(data.dairyPoultry * customMultiplier).toFixed(1)} <span className="text-[10px] text-neutral-500">kg</span>
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
