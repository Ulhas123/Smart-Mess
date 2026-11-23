import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Zap, 
  Activity, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Flame, 
  Scale, 
  ChefHat, 
  Maximize2,
  Sparkles,
  Compass,
  Database,
  ArrowUpRight
} from 'lucide-react';
import { getIstNow, getIstTimeStr } from '../../utils/time';

interface OrbitNode {
  id: string;
  orbitIndex: number; // 0: inner, 1: middle, 2: outer
  angleOffset: number; // in radians
  title: string;
  metric: string;
  sublabel: string;
  badge: string;
  tone: 'emerald' | 'amber' | 'sky' | 'rose';
  formula: string;
  details: string;
  impact: string;
  icon: React.ReactNode;
}

export default function MultiOrbitTelemetry() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 700 });
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [proximityFactor, setProximityFactor] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<OrbitNode | null>(null);
  const [isWarpMode, setIsWarpMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [liveIstTime, setLiveIstTime] = useState(getIstTimeStr());

  // Animation angle states
  const anglesRef = useRef({ orbit0: 0, orbit1: Math.PI / 3, orbit2: Math.PI / 6 });
  const speedMultiplierRef = useRef(1.0);
  const targetSpeedRef = useRef(1.0);
  const [currentSpeedDisplay, setCurrentSpeedDisplay] = useState(1.0);

  // Resize listener
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(320, rect.width),
          height: Math.max(500, Math.min(740, rect.width * 0.85))
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Update IST clock
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveIstTime(getIstTimeStr());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Responsive radii based on container width
  const { r0, r1, r2, center } = useMemo(() => {
    const minDim = Math.min(dimensions.width, dimensions.height);
    const scale = minDim / 700;
    return {
      r0: Math.max(90, 130 * scale),
      r1: Math.max(160, 230 * scale),
      r2: Math.max(230, 320 * scale),
      center: { x: dimensions.width / 2, y: dimensions.height / 2 }
    };
  }, [dimensions]);

  // Orbital Nodes Data
  const nodes: OrbitNode[] = useMemo(() => [
    // Orbit 0: Inner Core (2 nodes)
    {
      id: 'node-q50',
      orbitIndex: 0,
      angleOffset: 0,
      title: 'LightGBM Median Headcount',
      metric: 'q50 = 242 heads',
      sublabel: 'Bounds [112, 300] diners',
      badge: 'Multi-Quantile Core',
      tone: 'emerald',
      formula: 'y_hat = argmin sum_t L_tau(y_t, y)',
      details: 'Pinball loss optimization yielding non-crossing prediction intervals with sub-millisecond inference.',
      impact: 'Eliminates meal stockouts while keeping surplus preparation bounded within tight margins.',
      icon: <Activity size={14} className="text-emerald-400" />
    },
    {
      id: 'node-service',
      orbitIndex: 0,
      angleOffset: Math.PI,
      title: 'Prayagraj Telemetry Clock',
      metric: '07:30 – 09:30 IST',
      sublabel: 'Breakfast Window Active',
      badge: 'Asia/Kolkata Sync',
      tone: 'sky',
      formula: 'dt_ist = UTC + 05:30',
      details: 'Strict institutional calendar and service window timing synchronized across turnstiles and vendor tablet.',
      impact: 'Prevents out-of-schedule QR pass redemption and synchronizes kitchen batch cooking schedules.',
      icon: <Clock size={14} className="text-sky-400" />
    },

    // Orbit 1: Middle Orbit (3 nodes)
    {
      id: 'node-hawkes',
      orbitIndex: 1,
      angleOffset: 0,
      title: 'Hawkes Festival Exodus Kernel',
      metric: '-70% Shock (Diwali)',
      sublabel: 'Half-Life b = 2.5 days',
      badge: 'Event Intensity',
      tone: 'amber',
      formula: 'lambda(t) = mu_0 + sum alpha_i * exp(-beta_i * (t - t_i))',
      details: 'Self-exciting point process modeling exponential campus home-going departure surge prior to major festivals.',
      impact: 'Prevents bulk cooking during sudden student holiday exoduses, saving thousands of discarded portions.',
      icon: <Flame size={14} className="text-amber-400" />
    },
    {
      id: 'node-wape',
      orbitIndex: 1,
      angleOffset: (2 * Math.PI) / 3,
      title: 'Volume-Weighted Error',
      metric: '25.95% WAPE',
      sublabel: 'MAE: 41.54 heads (0.8ms)',
      badge: 'Benchmark Superiority',
      tone: 'emerald',
      formula: 'WAPE = sum |y_t - y_hat_t| / sum y_t',
      details: 'Volume-weighted metric resolving zero-denominator vacation errors where a 10-head error distorts percentage MAPE.',
      impact: 'Outperforms Seasonal Naive (42.61%) and classical Holt-Winters (33.58%) by 39.1% lower MAE.',
      icon: <TrendingUp size={14} className="text-emerald-400" />
    },
    {
      id: 'node-newsvendor',
      orbitIndex: 1,
      angleOffset: (4 * Math.PI) / 3,
      title: 'Asymmetric Newsvendor Rule A',
      metric: '-52.1% Cost Penalty',
      sublabel: 'Shortage 6.88% (down from 21%)',
      badge: 'Economic Optimum',
      tone: 'rose',
      formula: 'Q* = q50 + 0.50 * (q90 - q50) | tau* = 0.75',
      details: 'Asymmetric ratio (3:1 shortage vs waste penalty) matching theoretical critical fractile tau* = 0.75.',
      impact: 'Reduces total loss units from 89,997 down to 43,138, virtually eliminating student dining crises.',
      icon: <Scale size={14} className="text-rose-400" />
    },

    // Orbit 2: Outer Orbit (4 nodes)
    {
      id: 'node-bh2',
      orbitIndex: 2,
      angleOffset: 0,
      title: 'BH-2 Pure Veg Hostel',
      metric: '300 Capacity',
      sublabel: 'Pure Veg Dietary Profile',
      badge: 'Resident Sector A',
      tone: 'emerald',
      formula: 'Cap = 300 | Base_Lunch = 0.67',
      details: 'Hostel 2 catering purely vegetarian menu with South Indian breakfasts and regional North Indian lunches.',
      impact: 'Procurement items calculated dynamically per student with zero inventory discrepancies.',
      icon: <ShieldCheck size={14} className="text-emerald-400" />
    },
    {
      id: 'node-bh3',
      orbitIndex: 2,
      angleOffset: Math.PI / 2,
      title: 'BH-3 Non-Veg Hostel',
      metric: '300 Capacity',
      sublabel: '+7% Friday Non-Veg Pull',
      badge: 'Resident Sector B',
      tone: 'amber',
      formula: 'Cap = 300 | NonVeg_Pull = +7%',
      details: 'Hostel 3 offering dual counters: Dhaba Chicken Curry alongside Paneer-Pyaaz Paratha on Mon & Fri dinners.',
      impact: 'Quantile model captures prominent meal-slot attendance spikes driven by dietary pull factors.',
      icon: <ChefHat size={14} className="text-amber-400" />
    },
    {
      id: 'node-tolerances',
      orbitIndex: 2,
      angleOffset: Math.PI,
      title: 'Commercial Pan Tolerances',
      metric: '66.99% within ±50',
      sublabel: '50.33% within ±35 pan',
      badge: 'Kitchen Staging',
      tone: 'sky',
      formula: 'Margin = +/-35 portions (~1 serving pan)',
      details: 'Commercial batch preparation boundaries allowing head-cooks to stage second steam batches with confidence.',
      impact: 'Guarantees two-thirds of all meals are accurately bounded, eliminating culinary guesswork.',
      icon: <Zap size={14} className="text-sky-400" />
    },
    {
      id: 'node-foodsaved',
      orbitIndex: 2,
      angleOffset: (3 * Math.PI) / 2,
      title: 'Annual Campus Food Saved',
      metric: '5,100+ kg / year',
      sublabel: 'Across BH-2 & BH-3',
      badge: 'Sustainability Impact',
      tone: 'emerald',
      formula: 'Delta_Waste = sum (Waste_Heuristic - Waste_Quantile)',
      details: 'Preventative inventory procurement reducing post-consumer and prep waste by over 5.1 metric tonnes.',
      impact: 'Directly aligns operational cafeteria logistics with UN Sustainable Development Goal 12.3.',
      icon: <Sparkles size={14} className="text-emerald-400" />
    }
  ], []);

  // Mouse move handler for proximity acceleration
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Distance to orbital center
    const dx = x - center.x;
    const dy = y - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Proximity factor: closer = faster speed (from 1x up to 5.2x)
    const maxRadius = r2 + 120;
    if (dist < maxRadius) {
      const proximity = Math.max(0, (maxRadius - dist) / maxRadius);
      // Non-linear acceleration curve
      const speed = 1.0 + Math.pow(proximity, 1.8) * 4.2;
      targetSpeedRef.current = isWarpMode ? speed * 2 : speed;
      setProximityFactor(Number(speed.toFixed(2)));
    } else {
      targetSpeedRef.current = isWarpMode ? 2.5 : 1.0;
      setProximityFactor(1.0);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    targetSpeedRef.current = isWarpMode ? 2.5 : 1.0;
    setProximityFactor(1.0);
  };

  // Continuous RequestAnimationFrame loop with inertia physics
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      if (!isPaused) {
        // Smooth speed interpolation (inertia damping)
        const lerpFactor = 0.08;
        const currentTarget = hoveredNode ? 0.25 : targetSpeedRef.current;
        speedMultiplierRef.current += (currentTarget - speedMultiplierRef.current) * lerpFactor;
        setCurrentSpeedDisplay(Number(speedMultiplierRef.current.toFixed(2)));

        const currentSpeed = speedMultiplierRef.current;

        // Base angular velocities (radians/sec)
        // Orbit 0 (Inner): fastest base
        // Orbit 1 (Middle): counter-rotation or medium
        // Orbit 2 (Outer): majestic outer rotation
        const v0 = (2 * Math.PI) / 28; // 28s revolution
        const v1 = -(2 * Math.PI) / 44; // 44s counter revolution
        const v2 = (2 * Math.PI) / 60; // 60s outer revolution

        anglesRef.current.orbit0 += v0 * currentSpeed * dt;
        anglesRef.current.orbit1 += v1 * currentSpeed * dt;
        anglesRef.current.orbit2 += v2 * currentSpeed * dt;
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, hoveredNode]);

  // Compute live node positions
  const computedNodes = useMemo(() => {
    return nodes.map((n) => {
      let baseAngle = 0;
      let radius = r0;
      if (n.orbitIndex === 0) {
        baseAngle = anglesRef.current.orbit0;
        radius = r0;
      } else if (n.orbitIndex === 1) {
        baseAngle = anglesRef.current.orbit1;
        radius = r1;
      } else {
        baseAngle = anglesRef.current.orbit2;
        radius = r2;
      }

      const angle = baseAngle + n.angleOffset;
      // Slightly elliptical perspective: stretch X by 1.08, compress Y by 0.92
      const x = center.x + Math.cos(angle) * radius * 1.06;
      const y = center.y + Math.sin(angle) * radius * 0.92;

      return {
        ...n,
        x,
        y,
        angle
      };
    });
  }, [nodes, r0, r1, r2, center, currentSpeedDisplay]);

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full py-24 px-4 sm:px-8 md:px-16 bg-[#070709] border-t border-b border-white/10 overflow-hidden select-none"
    >
      {/* Background ambient lighting */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{
          background: isWarpMode 
            ? 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, rgba(245, 158, 11, 0.2) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(14, 165, 233, 0.15) 50%, transparent 70%)',
          transform: `translate(-50%, -50%) scale(${1 + (currentSpeedDisplay - 1) * 0.12})`,
          transition: 'transform 0.3s ease-out'
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-6 mb-12">
          <div>
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-amber-400 mb-2">
              <Compass size={14} className="animate-spin" style={{ animationDuration: '12s' }} />
              <span>Multi-Orbit Real-Time Kinetic Radar // Mathematical Telemetry</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-light text-white tracking-tight">
              Dynamic Gravitational Telemetry.
            </h2>
            <p className="text-sm font-sans text-neutral-400 max-w-xl font-light mt-2">
              Move your mouse closer to the orbital core to accelerate telemetry velocities. Hover over any orbiting node to pause and inspect live research formulations.
            </p>
          </div>

          {/* Interactive HUD Controls */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {/* Speedometer Badge */}
            <div className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-neutral-400 uppercase tracking-widest text-[10px]">Orbital Velocity:</span>
              <strong className={`font-mono text-sm ${currentSpeedDisplay > 2.5 ? 'text-amber-400 font-bold' : 'text-emerald-400'}`}>
                {currentSpeedDisplay.toFixed(2)}×
              </strong>
            </div>

            {/* Warp Button */}
            <button
              onClick={() => setIsWarpMode(!isWarpMode)}
              className={`px-3.5 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                isWarpMode 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 border border-rose-400' 
                  : 'bg-white/5 border border-white/15 text-neutral-300 hover:bg-white/10'
              }`}
            >
              <Zap size={12} />
              <span>{isWarpMode ? 'Warp Active' : 'Engage Warp'}</span>
            </button>

            {/* Pause Toggle */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-neutral-400 hover:text-white font-mono text-[11px] uppercase tracking-wider transition-colors"
            >
              {isPaused ? 'Resume' : 'Freeze'}
            </button>
          </div>
        </div>

        {/* Orbit Canvas Viewport */}
        <div 
          className="relative w-full rounded-2xl border border-white/10 bg-[#0a0a0d]/90 backdrop-blur-xl overflow-hidden shadow-2xl"
          style={{ height: dimensions.height }}
        >
          {/* Subtle Coordinate Grid Lines */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}
          />

          {/* SVG Orbit Tracks & Reticles */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="orbit-grad-0" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="orbit-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="orbit-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
              </linearGradient>
            </defs>

            {/* Crosshairs at Center */}
            <line 
              x1={center.x - 30} y1={center.y} 
              x2={center.x + 30} y2={center.y} 
              stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" 
            />
            <line 
              x1={center.x} y1={center.y - 30} 
              x2={center.x} y2={center.y + 30} 
              stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" 
            />

            {/* Orbit 0 Track (Inner) */}
            <ellipse 
              cx={center.x} cy={center.y} 
              rx={r0 * 1.06} ry={r0 * 0.92} 
              fill="none" 
              stroke="url(#orbit-grad-0)" 
              strokeWidth="1.2" 
              strokeDasharray="4 6" 
            />

            {/* Orbit 1 Track (Middle) */}
            <ellipse 
              cx={center.x} cy={center.y} 
              rx={r1 * 1.06} ry={r1 * 0.92} 
              fill="none" 
              stroke="url(#orbit-grad-1)" 
              strokeWidth="1.2" 
              strokeDasharray="6 8" 
            />

            {/* Orbit 2 Track (Outer) */}
            <ellipse 
              cx={center.x} cy={center.y} 
              rx={r2 * 1.06} ry={r2 * 0.92} 
              fill="none" 
              stroke="url(#orbit-grad-2)" 
              strokeWidth="1.2" 
              strokeDasharray="8 12" 
            />

            {/* Radar sweep beam from center */}
            <line
              x1={center.x}
              y1={center.y}
              x2={center.x + Math.cos(anglesRef.current.orbit0 * 2) * (r2 * 1.06)}
              y2={center.y + Math.sin(anglesRef.current.orbit0 * 2) * (r2 * 0.92)}
              stroke="rgba(16, 185, 129, 0.25)"
              strokeWidth="1"
            />
          </svg>

          {/* Central Pulsing Telemetry Nucleus */}
          <div 
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-auto"
            style={{ left: center.x, top: center.y }}
          >
            {/* Outer spinning ring */}
            <div 
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-emerald-500/30 border-dashed absolute animate-spin"
              style={{ animationDuration: '24s' }}
            />
            {/* Inner glowing core */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-500/20 via-neutral-900 to-black border border-emerald-400/50 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20 backdrop-blur-md z-10 transition-transform duration-300 hover:scale-110">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping mb-1" />
              <span className="font-mono text-[9px] font-bold text-white tracking-widest uppercase">MESA</span>
              <span className="font-mono text-[7px] text-emerald-400 tracking-wider">CORE</span>
            </div>
            
            {/* Live Core Status */}
            <div className="mt-2 text-center pointer-events-none">
              <span className="font-mono text-[9px] text-neutral-400 block tracking-widest uppercase">
                IST {liveIstTime}
              </span>
              <span className="font-mono text-[8px] text-emerald-400/80 uppercase tracking-widest">
                IIITA · 25.43°N
              </span>
            </div>
          </div>

          {/* Orbiting Interactive Nodes */}
          {computedNodes.map((node) => {
            const isHovered = hoveredNode?.id === node.id;
            
            // Tone color mappings
            const toneBorder = {
              emerald: 'border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/40',
              amber: 'border-amber-500/40 hover:border-amber-400 bg-amber-950/40',
              sky: 'border-sky-500/40 hover:border-sky-400 bg-sky-950/40',
              rose: 'border-rose-500/40 hover:border-rose-400 bg-rose-950/40',
            }[node.tone];

            const toneText = {
              emerald: 'text-emerald-400',
              amber: 'text-amber-400',
              sky: 'text-sky-400',
              rose: 'text-rose-400',
            }[node.tone];

            return (
              <div
                key={node.id}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-20 ${
                  isHovered ? 'scale-125 z-40' : 'hover:scale-110'
                }`}
                style={{ 
                  left: node.x, 
                  top: node.y,
                }}
              >
                {/* Node Pill Card */}
                <div 
                  className={`px-3 py-2 rounded-xl border backdrop-blur-xl shadow-xl transition-all flex items-center gap-2.5 ${toneBorder}`}
                  style={{
                    boxShadow: isHovered 
                      ? '0 0 25px rgba(255, 255, 255, 0.2), 0 10px 30px rgba(0,0,0,0.8)' 
                      : '0 4px 15px rgba(0,0,0,0.5)'
                  }}
                >
                  {/* Glowing Node Dot */}
                  <div className="relative flex items-center justify-center">
                    <div className={`w-2 h-2 rounded-full ${node.tone === 'emerald' ? 'bg-emerald-400' : node.tone === 'amber' ? 'bg-amber-400' : node.tone === 'sky' ? 'bg-sky-400' : 'bg-rose-400'}`} />
                    {isHovered && (
                      <div className="w-4 h-4 rounded-full border border-white/40 absolute animate-ping" />
                    )}
                  </div>

                  {/* Micro Metric Preview */}
                  <div className="flex flex-col text-left">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 max-w-[130px] sm:max-w-[160px] truncate">
                      {node.title}
                    </span>
                    <strong className={`font-mono text-xs font-semibold ${toneText} truncate`}>
                      {node.metric}
                    </strong>
                  </div>

                  <ArrowUpRight size={11} className="text-neutral-500 opacity-60 ml-0.5" />
                </div>
              </div>
            );
          })}

          {/* Hover Telemetry HUD Modal Popup (Bottom HUD) */}
          {hoveredNode && (
            <div 
              className="absolute bottom-4 left-4 right-4 md:left-8 md:right-8 p-5 rounded-xl border border-white/20 bg-neutral-950/95 backdrop-blur-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg border border-white/20 bg-white/5 flex items-center justify-center shrink-0">
                  {hoveredNode.icon}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400 font-bold">
                      {hoveredNode.badge}
                    </span>
                    <span className="text-neutral-600">·</span>
                    <span className="font-mono text-[11px] text-neutral-400">
                      ORBIT LAYER 0{hoveredNode.orbitIndex + 1}
                    </span>
                  </div>
                  <h4 className="text-xl font-display font-medium text-white mt-0.5">
                    {hoveredNode.title} — <span className="text-emerald-400 font-mono text-lg">{hoveredNode.metric}</span>
                  </h4>
                  <p className="font-sans text-xs text-neutral-300 font-light mt-1 max-w-2xl leading-relaxed">
                    {hoveredNode.details}
                  </p>
                </div>
              </div>

              {/* Formula & Operational Impact Pill */}
              <div className="flex flex-col md:items-end shrink-0 gap-1.5 font-mono text-xs">
                <div className="px-3 py-1 rounded bg-white/5 border border-white/10 text-neutral-300 text-[11px]">
                  <code>{hoveredNode.formula}</code>
                </div>
                <span className="text-[10px] text-emerald-400 max-w-xs text-left md:text-right font-sans">
                  ✓ {hoveredNode.impact}
                </span>
              </div>
            </div>
          )}

          {/* Bottom Left Status Footer */}
          <div className="absolute bottom-3 left-4 pointer-events-none hidden sm:flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500">
            <span>Orbits: 3 Concentric Tracks</span>
            <span>·</span>
            <span>Nodes: 9 Live Telemetry Probes</span>
            <span>·</span>
            <span>Speed Damp: Smooth Inertia</span>
          </div>

          {/* Bottom Right Mouse Distance Indicator */}
          <div className="absolute bottom-3 right-4 pointer-events-none hidden sm:flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-400">
            <Database size={11} className="text-emerald-400" />
            <span>Gravitational Acceleration Active</span>
          </div>
        </div>

      </div>
    </section>
  );
}
