import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Sliders, 
  CloudRain, 
  Sun, 
  Calendar, 
  UtensilsCrossed, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  ShieldAlert,
  Flame,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import { fetchForecast } from '../services/api';

export default function WhatIfSimulatorView() {
  // Scenario simulation parameters
  const [hostel, setHostel] = useState('BH-2');
  const [slot, setSlot] = useState('dinner');
  const [academicPhase, setAcademicPhase] = useState('Mid-Sem Exam');
  const [daysToExam, setDaysToExam] = useState(2);
  const [tempMax, setTempMax] = useState(32);
  const [isRainy, setIsRainy] = useState(false);
  const [hasDessert, setHasDessert] = useState(true);
  const [isFastFood, setIsFastFood] = useState(false);
  const [isSpecial, setIsSpecial] = useState(true);
  const [hasNonveg, setHasNonveg] = useState(false);
  const [festivalFactor, setFestivalFactor] = useState(0.0);

  const [activePreset, setActivePreset] = useState('exam');
  const [forecast, setForecast] = useState(null);

  // Presets definition
  const presets = [
    {
      id: 'exam',
      title: 'Mid-Sem Exam Rush',
      desc: '+6% academic multiplier (1.06) driving exam attendance peak.',
      icon: Flame,
      color: 'border-amber-500 bg-amber-500/10 text-amber-500',
      apply: () => {
        setHostel('BH-2');
        setSlot('dinner');
        setAcademicPhase('Mid-Sem Exam');
        setDaysToExam(1);
        setTempMax(30);
        setIsRainy(false);
        setHasDessert(true);
        setIsSpecial(true);
        setFestivalFactor(0.0);
        setActivePreset('exam');
      }
    },
    {
      id: 'diwali',
      title: 'Diwali Mass Exodus',
      desc: 'Hawkes festival decay kernel (Diwali a=0.70, half-life b=2.5d) triggering 70% student exodus.',
      icon: ShieldAlert,
      color: 'border-rose-500 bg-rose-500/10 text-rose-500',
      apply: () => {
        setHostel('BH-2');
        setSlot('lunch');
        setAcademicPhase('End-Break');
        setDaysToExam(40);
        setTempMax(28);
        setIsRainy(false);
        setHasDessert(false);
        setIsSpecial(false);
        setFestivalFactor(0.70);
        setActivePreset('diwali');
      }
    },
    {
      id: 'rainy',
      title: 'Rainy Sunday Brunch',
      desc: 'Monsoon morning downpour with weather multiplier 0.82 (-18% friction).',
      icon: CloudRain,
      color: 'border-blue-500 bg-blue-500/10 text-blue-500',
      apply: () => {
        setHostel('BH-2');
        setSlot('breakfast');
        setAcademicPhase('Normal');
        setDaysToExam(25);
        setTempMax(24);
        setIsRainy(true);
        setIsFastFood(true);
        setHasDessert(false);
        setFestivalFactor(0.0);
        setActivePreset('rainy');
      }
    },
    {
      id: 'bh3_feast',
      title: 'BH-3 Special Non-Veg Night',
      desc: 'Friday non-veg pull factor (+7%) and dessert (+6%) in BH-3 non-veg mess.',
      icon: UtensilsCrossed,
      color: 'border-emerald-500 bg-emerald-500/10 text-emerald-500',
      apply: () => {
        setHostel('BH-3');
        setSlot('dinner');
        setAcademicPhase('Normal');
        setDaysToExam(18);
        setTempMax(29);
        setIsRainy(false);
        setHasNonveg(true);
        setHasDessert(true);
        setIsSpecial(true);
        setFestivalFactor(0.0);
        setActivePreset('bh3_feast');
      }
    }
  ];

  // Re-run simulation
  useEffect(() => {
    let isMounted = true;
    async function runSim() {
      const res = await fetchForecast({
        date: '2026-03-20',
        hostel,
        slot,
        academic_phase: academicPhase,
        days_to_exam: daysToExam,
        temp_max: tempMax,
        is_rainy: isRainy,
        has_dessert: hasDessert,
        is_fast_food: isFastFood,
        has_nonveg: hasNonveg,
        is_special: isSpecial,
        festival_factor: festivalFactor
      });
      if (isMounted) setForecast(res);
    }
    runSim();
    return () => { isMounted = false; };
  }, [hostel, slot, academicPhase, daysToExam, tempMax, isRainy, hasDessert, isFastFood, hasNonveg, isSpecial, festivalFactor]);

  const q50 = forecast?.q50 || 180;
  const q10 = forecast?.q10 || 140;
  const q90 = forecast?.q90 || 220;
  const cap = forecast?.capacity || 300;
  const util = forecast?.utilization_pct || 60;
  const breakdown = forecast?.multiplier_breakdown || {};

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-cyan-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
              <Cpu className="w-3.5 h-3.5 text-cyan-500" />
              Machine Learning Simulator
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Concept Drift & Quantile Adaptation
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            Interactive "What-If" Scenario Engine
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Tweak exogenous weather, academic calendars, Hawkes festival kernels, and menu pull factors in real-time to observe dynamic quantile fan predictions.
          </p>
        </div>

        <button
          onClick={() => presets[0].apply()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Controls</span>
        </button>
      </div>

      {/* 1-Click Scenario Presets Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          Instant Scenario Presets
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((p) => {
            const Icon = p.icon;
            const isSelected = activePreset === p.id;
            return (
              <button
                key={p.id}
                onClick={p.apply}
                className={`p-4 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'border-emerald-500 bg-white dark:bg-slate-800 shadow-md ring-1 ring-emerald-500'
                    : 'glass-panel hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${p.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  {p.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {p.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Simulation Workspace: Knobs on Left, Live Fan Chart on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Knobs (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-5 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Sliders className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Simulation Exogenous Knobs
            </h3>
          </div>

          {/* Hostel & Slot */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Hostel</label>
              <select
                value={hostel}
                onChange={(e) => { setHostel(e.target.value); setActivePreset(''); }}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-medium"
              >
                <option value="BH-2">BH-2 (Pure Veg, Cap 300)</option>
                <option value="BH-3">BH-3 (Non-Veg, Cap 300)</option>
                <option value="Combined">Combined Mess (Cap 600)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Meal Slot</label>
              <select
                value={slot}
                onChange={(e) => { setSlot(e.target.value); setActivePreset(''); }}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-medium capitalize"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>
          </div>

          {/* Academic Regime */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
              Academic Calendar Regime
            </label>
            <select
              value={academicPhase}
              onChange={(e) => { setAcademicPhase(e.target.value); setActivePreset(''); }}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-medium"
            >
              <option value="Normal">Normal Academic Week (1.00x)</option>
              <option value="Mid-Sem Exam">Mid-Sem Exam Surge (1.06x)</option>
              <option value="End-Sem Exam">End-Sem Exam Peak (1.07x)</option>
              <option value="Mid-Break">Mid-Sem Break Dip (0.35x)</option>
              <option value="End-Break">End-Sem Vacation Collapse (0.15x)</option>
              <option value="Summer">Summer Term (0.30x)</option>
              <option value="Holiday">Gazetted National Holiday (0.82x)</option>
            </select>
          </div>

          {/* Hawkes Festival Home-Going Kernel */}
          <div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
              <span>Hawkes Festival Decay Kernel</span>
              <span className="font-mono text-rose-500 font-bold">{Math.round(festivalFactor * 100)}% Departure</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={festivalFactor}
              onChange={(e) => { setFestivalFactor(parseFloat(e.target.value)); setActivePreset(''); }}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Simulates mass student exodus around Holi, Diwali, Chhath, and Eid.
            </span>
          </div>

          {/* Days until next exam */}
          <div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
              <span>Anticipatory Days to Next Exam</span>
              <span className="font-mono text-cyan-500 font-bold">{daysToExam} days</span>
            </div>
            <input
              type="range"
              min="0"
              max="45"
              step="1"
              value={daysToExam}
              onChange={(e) => { setDaysToExam(parseInt(e.target.value)); setActivePreset(''); }}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">
              T-3 to T-1 days triggers students returning early to campus.
            </span>
          </div>

          {/* Weather Slider & Rain Toggle */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Monsoon Rain Friction</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRainy}
                  onChange={(e) => { setIsRainy(e.target.checked); setActivePreset(''); }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                <span>Maximum Ambient Temp</span>
                <span className="font-mono text-amber-500 font-bold">{tempMax}°C</span>
              </div>
              <input
                type="range"
                min="10"
                max="48"
                step="1"
                value={tempMax}
                onChange={(e) => { setTempMax(parseInt(e.target.value)); setActivePreset(''); }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Menu Pull Factors */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="text-[11px] font-semibold text-slate-500 block mb-2">
              Menu Pull Factors
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                <input
                  type="checkbox"
                  checked={hasDessert}
                  onChange={(e) => { setHasDessert(e.target.checked); setActivePreset(''); }}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
                <span>Dessert (+6%)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                <input
                  type="checkbox"
                  checked={isFastFood}
                  onChange={(e) => { setIsFastFood(e.target.checked); setActivePreset(''); }}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
                <span>Fast Food (+5%)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                <input
                  type="checkbox"
                  checked={isSpecial}
                  onChange={(e) => { setIsSpecial(e.target.checked); setActivePreset(''); }}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
                <span>Special (+4%)</span>
              </label>

              {hostel === 'BH-3' && (
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                  <input
                    type="checkbox"
                    checked={hasNonveg}
                    onChange={(e) => { setHasNonveg(e.target.checked); setActivePreset(''); }}
                    className="rounded text-rose-500 focus:ring-rose-500"
                  />
                  <span>Non-Veg (+7%)</span>
                </label>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Dynamic Fan Visualizer & Attribution (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Visual Quantile Gauge Card */}
          <div className="glass-panel p-6 border-t-4 border-t-emerald-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Live LightGBM Quantile Forecast
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Headcount Distribution Fan
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {util}% Capacity
              </span>
            </div>

            {/* Dynamic Visual Quantile Fan Graph */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white relative overflow-hidden my-4 border border-slate-800">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <span className="text-xs text-slate-400 font-mono">LOWER BOUND ($q_{10}$)</span>
                  <div className="text-2xl font-black text-emerald-400">{q10}</div>
                </div>
                <div className="text-center">
                  <span className="text-xs text-emerald-400 font-mono font-bold">EXPECTED MEDIAN ($q_{50}$)</span>
                  <div className="text-5xl font-black text-white tracking-tight">{q50}</div>
                  <span className="text-[11px] text-slate-400">diners</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-mono">PEAK SURGE ($q_{90}$)</span>
                  <div className="text-2xl font-black text-cyan-400">{q90}</div>
                </div>
              </div>

              {/* Quantile Cone Bar */}
              <div className="relative w-full h-8 bg-slate-800/80 rounded-xl overflow-hidden p-1 flex items-center">
                {/* 10-90 cone */}
                <div
                  className="h-full rounded-lg bg-gradient-to-r from-emerald-500/30 via-emerald-400 to-cyan-500/40 relative flex items-center justify-center transition-all duration-300"
                  style={{
                    marginLeft: `${(q10 / cap) * 100}%`,
                    width: `${Math.max(5, ((q90 - q10) / cap) * 100)}%`
                  }}
                >
                  {/* q50 marker */}
                  <div className="w-1.5 h-6 bg-white rounded-full shadow-lg"></div>
                </div>
              </div>

              {/* Sub-label ticks */}
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                <span>0 heads</span>
                <span>75 heads</span>
                <span>150 heads</span>
                <span>225 heads</span>
                <span>300 max cap</span>
              </div>
            </div>

            {/* Kitchen Action Dispatch */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block mb-1">Recommended Prep Batch</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {forecast?.cooking_strategy?.initial_cook_batch || 180} portions
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block mb-1">Reserve Mise en Place</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {forecast?.cooking_strategy?.buffer_tray_batch || 40} portions
                </span>
              </div>
            </div>

          </div>

          {/* Mathematical Multiplier Decomposition (Waterfall Table) */}
          <div className="glass-panel p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-500" />
              Mathematical Multiplier Decomposition ($Y_t \sim \mu_t \times \prod m_i$)
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Base Slot Dining Ratio (300 Cap)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{breakdown.base_rate}x</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Academic Regime Shock Multiplier</span>
                <span className={`font-mono font-bold ${breakdown.regime_factor < 1 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {breakdown.regime_factor}x
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Weather & Friction Multiplier</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{breakdown.weather_factor}x</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Menu Pull Factor Aggregation</span>
                <span className="font-mono font-bold text-emerald-500">+{Math.round((breakdown.menu_factor - 1) * 100)}%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Hawkes Festival Exodus Attenuation</span>
                <span className={`font-mono font-bold ${breakdown.festival_factor < 1 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                  {breakdown.festival_factor}x
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
