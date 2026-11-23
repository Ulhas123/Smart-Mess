'use client';
import React, { useState } from 'react';
import { 
  ArrowRight, 
  BarChart3, 
  Check, 
  Download, 
  FileText, 
  GraduationCap, 
  Maximize2, 
  QrCode, 
  ShieldCheck, 
  Sparkles, 
  Utensils, 
  Users, 
  Clock, 
  Zap, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { WeatherWidget } from './WeatherWidget';
import PrayagrajClockBadge from './agency/PrayagrajClockBadge';
import MagneticButton from './agency/MagneticButton';
import FloatingMediaReveal, { FloatingItem } from './agency/FloatingMediaReveal';
import InteractiveSimulatorSandbox from './InteractiveSimulatorSandbox';
import PlotLightboxModal from './PlotLightboxModal';
import MultiOrbitTelemetry from './agency/MultiOrbitTelemetry';
import KineticMarquee from './agency/KineticMarquee';
import { researchBenchmarks, researchPlots } from '../data/demoData';
import type { ResearchPlot, Role } from '../types';

interface AgencyLandingProps {
  onSelectRole: (role: Role) => void;
}

const SIGNATURE_DISHES: FloatingItem[] = [
  {
    id: 'D01',
    title: 'Paneer Pyaaz Paratha & Kaju Katli',
    subtitle: 'Flaky whole-wheat layered parathas, spiced onion-cottage cheese stuffing, churned butter & diamond silver-leaf cashew fudge',
    category: 'Friday Dinner · BH-2 & BH-3 Festive Feast',
    meta: 'Protein: 22g · Cal: 540',
    badge: 'Friday Special',
    mediaUrl: '/dishes/paneer_paratha.jpg',
  },
  {
    id: 'D02',
    title: 'Amritsari Chole Bhature & Boondi Raita',
    subtitle: 'Blistered puffed golden bhature, slow-simmered Punjabi chickpea gravy, cumin-roasted boondi dahi',
    category: 'Saturday Lunch Feast · All Hostels',
    meta: 'Protein: 19g · Cal: 580',
    badge: 'Weekend Signature',
    mediaUrl: '/dishes/chole_bhature.jpg',
  },
  {
    id: 'D03',
    title: 'Litti Chokha & Clay-Pot Churned Lassi',
    subtitle: 'Wood-fired sattu dumplings with mustard oil emulsion, roasted baingan chokha, sweet chilled lassi',
    category: 'Tuesday Regional Heritage Lunch',
    meta: 'Protein: 18g · Cal: 460',
    badge: 'Regional Delicacy',
    mediaUrl: '/dishes/litti_chokha.jpg',
  },
  {
    id: 'D04',
    title: 'Kadhai Paneer & Warm Saffron Gulab Jamun',
    subtitle: 'Charred bell peppers, hand-crushed coriander seeds, fresh malai paneer & hot reduced-milk dumplings in rose syrup',
    category: 'Monday Dinner Special',
    meta: 'Protein: 24g · Cal: 490',
    badge: 'Dinner Delight',
    mediaUrl: '/dishes/kadhai_paneer.jpg',
  },
  {
    id: 'D05',
    title: 'Indori Poha + Haldiram Bhujiya & Crispy Jalebi',
    subtitle: 'Steam-tempered flattened rice with fennel, mustard seeds, crunchy sev & spirals of hot syrup-dipped jalebi',
    category: 'Friday Breakfast Tradition',
    meta: 'Carbs: 68g · Cal: 380',
    badge: 'Campus Favorite',
    mediaUrl: '/dishes/poha_jalebi.jpg',
  },
  {
    id: 'D06',
    title: 'Lucknowi Veg Biryani & Aloo Jhol',
    subtitle: 'Aged long-grain basmati, saffron milk infusion, whole brown cardamom, spicy potato gravy & mix raita',
    category: 'Sunday Lunch Feast',
    meta: 'Protein: 15g · Cal: 520',
    badge: 'Sunday Special',
    mediaUrl: '/dishes/veg_biryani.jpg',
  },
  {
    id: 'D07',
    title: 'BH-3 Dhaba Chicken Curry & Jeera Rice',
    subtitle: 'Slow-braised chicken in browned onion, ginger-garlic paste, fragrant cumin-tempered rice (BH-3 Hostel)',
    category: 'Mon & Fri Dinner · Non-Veg',
    meta: 'Protein: 36g · Cal: 560',
    badge: 'Non-Veg Signature',
    mediaUrl: '/dishes/chicken_curry.jpg',
  },
  {
    id: 'D08',
    title: 'Italian Penne / Hakka Noodles & Manchurian',
    subtitle: 'Al dente pasta or wok-tossed vegetable chowmein paired with crispy vegetable manchurian in garlic soya glaze',
    category: 'Sunday Dinner Indulgence',
    meta: 'Carbs: 64g · Cal: 450',
    badge: 'Indo-Chinese',
    mediaUrl: '/dishes/hakka_noodles.jpg',
  },
];

export default function AgencyLanding({ onSelectRole }: AgencyLandingProps) {
  const [selectedPlot, setSelectedPlot] = useState<ResearchPlot | null>(null);

  return (
    <div className="relative w-full min-h-screen bg-[#09090b] text-neutral-100 selection:bg-amber-400 selection:text-black overflow-x-hidden">
      
      {/* Editorial Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[#09090b]/90 border-b border-white/10 px-4 sm:px-8 md:px-16 py-3.5 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          
          {/* Brand Mark */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center font-display text-xl text-white shadow-inner bg-white/5">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-xs font-bold tracking-[0.25em] text-white uppercase">
                MESA <span className="text-amber-400">·</span> IIITA
              </span>
              <span className="font-mono text-[9px] text-neutral-400 tracking-wider uppercase hidden sm:block">
                Institutional Dining Architecture
              </span>
            </div>
          </div>

          {/* Center Micro Navigation Anchors */}
          <nav className="hidden xl:flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400">
            <a href="#radar" className="hover:text-amber-400 transition-colors">Kinetic Radar</a>
            <a href="#gateways" className="hover:text-white transition-colors">Gateways</a>
            <a href="#simulator" className="hover:text-white transition-colors">Simulator</a>
            <a href="#menu" className="hover:text-white transition-colors">Weekly Menu</a>
            <a href="#benchmarks" className="hover:text-white transition-colors">Benchmarks</a>
          </nav>

          {/* Right Status Controls */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Live Prayagraj Clock Badge in Header */}
            <div className="hidden lg:flex items-center">
              <PrayagrajClockBadge />
            </div>

            <WeatherWidget variant="header" className="hidden md:inline-flex" />

            <MagneticButton
              href="/MinorProject_Presentation.pptx"
              download="MinorProject_Presentation.pptx"
              variant="secondary"
              className="hidden sm:inline-flex"
            >
              <Download size={13} />
              <span>Deck (.pptx)</span>
            </MagneticButton>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectRole('student')}
                data-cursor="RESIDENT"
                className="px-4 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white hover:text-black font-mono text-[11px] uppercase tracking-[0.2em] transition-all"
              >
                Resident Pass
              </button>
              <button
                onClick={() => onSelectRole('operations')}
                data-cursor="VAULT"
                className="px-4 py-2 rounded-full border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400 hover:text-black font-mono text-[11px] text-amber-300 uppercase tracking-[0.2em] transition-all"
              >
                Ops Console
              </button>
            </div>
          </div>

        </div>

        {/* Mobile Prayagraj Clock Strip */}
        <div className="flex lg:hidden justify-center pt-2.5 mt-2 border-t border-white/5">
          <PrayagrajClockBadge variant="compact" />
        </div>
      </header>

      {/* Hero Section: Fluid Scale Typography & Research Ticker */}
      <section className="relative w-full pt-16 md:pt-28 pb-20 md:pb-28 px-4 sm:px-8 md:px-16 overflow-hidden">
        
        {/* Ambient subtle glow gradients */}
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          
          {/* Eyebrow metadata */}
          <div className="flex flex-wrap items-center gap-3 md:gap-6 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400 mb-8 border-b border-white/10 pb-4">
            <span className="text-amber-400">[ ECE MINOR PROJECT · 7TH SEMESTER ]</span>
            <span>·</span>
            <span>INDIAN INSTITUTE OF INFORMATION TECHNOLOGY, ALLAHABAD</span>
            <span>·</span>
            <span>HOSTELS: BH-2 (VEG) & BH-3 (NON-VEG)</span>
          </div>

          {/* Primary Massive Editorial Title with Fluid Clamp */}
          <div className="mb-12">
            <h1 className="text-[clamp(3.2rem,7vw,7.5rem)] font-display font-light tracking-[-0.04em] text-white leading-[0.92]">
              Mathematical
              <br />
              <span className="italic font-normal text-neutral-400">Gastronomy.</span>
              <br />
              Instantaneous Recovery.
            </h1>
          </div>

          {/* Editorial Lead Paragraph & Authorship */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-8 border-t border-white/10">
            <div className="lg:col-span-7">
              <p className="font-sans text-base md:text-xl font-light text-neutral-300 leading-relaxed">
                Multi-regime heteroscedastic count modeling with Hawkes self-exciting festival decay kernels, LightGBM multi-quantile interval estimation ($q_{10}, q_{50}, q_{90}$), and real-time cryptographic turnstile telemetry for institutional dining halls.
              </p>

              {/* Research Supervisor & Team */}
              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-[11px]">
                <div>
                  <span className="text-neutral-500 uppercase tracking-[0.2em] block text-[10px] mb-1">
                    Supervisor
                  </span>
                  <strong className="text-white font-medium block">Dr. Kirtan Gopal Panda</strong>
                  <span className="text-neutral-400 block text-[11px] font-sans tracking-normal">Assistant Professor, ECE, IIITA</span>
                </div>

                <div>
                  <span className="text-neutral-500 uppercase tracking-[0.2em] block text-[10px] mb-1">
                    Researchers & Authors
                  </span>
                  <strong className="text-white font-medium block">Varun Karankar · Aadarsh Singh · Tushar Garg</strong>
                  <span className="text-neutral-400 block text-[11px] font-sans tracking-normal">Rolls: IEC2023037 · IEC2023058 · IEC2023059</span>
                </div>
              </div>
            </div>

            {/* Quick Primary Actions */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="p-6 md:p-8 rounded-sm border border-white/10 bg-white/[0.02] backdrop-blur-md">
                <span className="font-mono text-[11px] text-amber-400 uppercase tracking-[0.2em] block mb-2">
                  Instant Access Protocol
                </span>
                <p className="text-xs text-neutral-400 mb-6 font-light leading-relaxed">
                  Choose your terminal below to inspect live demand forecasting, issue meal pass QR tokens, or operate the catering turnstile scanner.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <MagneticButton
                    onClick={() => onSelectRole('student')}
                    variant="primary"
                    className="w-full text-center"
                  >
                    <QrCode size={14} />
                    <span>Resident Portal</span>
                  </MagneticButton>

                  <MagneticButton
                    onClick={() => onSelectRole('operations')}
                    variant="accent"
                    className="w-full text-center"
                  >
                    <BarChart3 size={14} />
                    <span>Ops Console</span>
                  </MagneticButton>
                </div>
              </div>
            </div>
          </div>

          {/* High-Impact Stat Bar (Oversized Metrices) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pt-16 mt-16 border-t border-white/10">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 block mb-1">
                Pinball Loss Coverage
              </span>
              <strong className="font-display text-3xl md:text-4xl text-white font-normal">
                72.4%
              </strong>
              <span className="font-mono text-[10px] text-emerald-400 block mt-1 tracking-wider uppercase">90% Empirical PICP</span>
            </div>

            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 block mb-1">
                Inference Latency
              </span>
              <strong className="font-display text-3xl md:text-4xl text-white font-normal">
                0.8 ms
              </strong>
              <span className="font-mono text-[10px] text-emerald-400 block mt-1 tracking-wider uppercase">Instant LightGBM</span>
            </div>

            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 block mb-1">
                Shortage Rate
              </span>
              <strong className="font-display text-3xl md:text-4xl text-white font-normal">
                6.88%
              </strong>
              <span className="font-mono text-[10px] text-amber-400 block mt-1 tracking-wider uppercase">Down from 21.06%</span>
            </div>

            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 block mb-1">
                Cost Penalty / Meal
              </span>
              <strong className="font-display text-3xl md:text-4xl text-white font-normal">
                ₹70.49
              </strong>
              <span className="font-mono text-[10px] text-emerald-400 block mt-1 tracking-wider uppercase">−52.1% Reduction</span>
            </div>

            <div className="col-span-2 md:col-span-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 block mb-1">
                Annual Food Saved
              </span>
              <strong className="font-display text-3xl md:text-4xl text-white font-normal">
                5,100+ kg
              </strong>
              <span className="font-mono text-[10px] text-emerald-400 block mt-1 tracking-wider uppercase">Across BH-2 & BH-3</span>
            </div>
          </div>

        </div>
      </section>

      {/* Kinetic Infinite Mathematical Marquee */}
      <KineticMarquee />

      {/* Multi-Orbit Real-Time Kinetic Radar System */}
      <div id="radar">
        <MultiOrbitTelemetry />
      </div>

      {/* Asymmetric Role Selection Showcase (01 & 02) */}
      <section id="gateways" className="relative w-full py-20 px-4 sm:px-8 md:px-16 bg-[#0c0c0e] border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex justify-between items-end border-b border-white/10 pb-6 mb-12">
            <span className="font-mono text-[11px] tracking-[0.2em] text-neutral-400 uppercase">
              Operational Gateways // Select Active Mode
            </span>
            <span className="font-mono text-[11px] tracking-[0.2em] text-neutral-500 uppercase">
              Index [ 02 ]
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Role 01: Student Terminal */}
            <div
              onClick={() => onSelectRole('student')}
              data-cursor="ENTER"
              className="group relative rounded-sm border border-white/10 hover:border-white/30 bg-neutral-950/60 p-8 md:p-12 transition-all duration-500 cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 text-neutral-800 font-display text-7xl md:text-9xl pointer-events-none select-none group-hover:text-neutral-600 transition-colors">
                01
              </div>

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
                    <QrCode size={20} />
                  </div>
                  <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-amber-400">
                    Resident Terminal
                  </span>
                </div>

                <h3 className="font-display text-3xl md:text-5xl text-white font-light mb-4 group-hover:translate-x-2 transition-transform duration-500">
                  Student Portal & Pass
                </h3>
                <p className="font-sans text-sm md:text-base text-neutral-400 max-w-md font-light leading-relaxed mb-8">
                  Sign in with Roll No, upload student ID card, generate encrypted QR meal pass with countdown timer, explore weekly menus, and inspect dining crowd occupancy.
                </p>

                <div className="flex flex-wrap gap-2 font-mono text-[10px] text-neutral-400 uppercase tracking-wider mb-8">
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Roll No Auth</span>
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">ID Card Verification</span>
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Rotating Dynamic QR</span>
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Dish Rating</span>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white group-hover:text-amber-400 transition-colors">
                <span>Enter Resident Terminal</span>
                <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </div>

            {/* Role 02: Operations Console */}
            <div
              onClick={() => onSelectRole('operations')}
              data-cursor="ACCESS"
              className="group relative rounded-sm border border-white/10 hover:border-amber-400/40 bg-neutral-950/60 p-8 md:p-12 transition-all duration-500 cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 text-neutral-800 font-display text-7xl md:text-9xl pointer-events-none select-none group-hover:text-amber-500/30 transition-colors">
                02
              </div>

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full border border-amber-400/30 bg-amber-400/10 flex items-center justify-center text-amber-300 group-hover:bg-amber-400 group-hover:text-black transition-colors">
                    <BarChart3 size={20} />
                  </div>
                  <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-amber-300">
                    Dining Caterer Vault
                  </span>
                </div>

                <h3 className="font-display text-3xl md:text-5xl text-white font-light mb-4 group-hover:translate-x-2 transition-transform duration-500">
                  Operations Console
                </h3>
                <p className="font-sans text-sm md:text-base text-neutral-400 max-w-md font-light leading-relaxed mb-8">
                  Hardware turnstile scanner with audio verification, live student database whitelist checks, LightGBM quantile demand bounds, and dynamic ingredient procurement planning.
                </p>

                <div className="flex flex-wrap gap-2 font-mono text-[10px] text-neutral-400 uppercase tracking-wider mb-8">
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Webcam Scanner</span>
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Audio Beep Feedback</span>
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Allowed Roster Check</span>
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Quantile Forecaster</span>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-amber-300 group-hover:text-white transition-colors">
                <span>Access Caterer Console</span>
                <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Interactive What-If Scenario ML Sandbox */}
      <div id="simulator">
        <InteractiveSimulatorSandbox />
      </div>

      {/* Curated Culinary Menu with Floating Media Reveal */}
      <section id="menu" className="relative w-full py-24 px-4 sm:px-8 md:px-16 bg-[#09090b]">
        <div className="max-w-7xl mx-auto">
          <FloatingMediaReveal
            items={SIGNATURE_DISHES}
            label="Curated Culinary Architecture // Weekly Signature Menu"
            sublabel="Tactile Cursor Reveal"
          />
        </div>
      </section>

      {/* Academic Benchmarks & Research Telemetry Plots */}
      <section id="benchmarks" className="relative w-full py-24 px-4 sm:px-8 md:px-16 bg-[#0c0c0e] border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400 block mb-2">
                Empirical Evaluation // 612 Unseen Holdout Meal Events
              </span>
              <h2 className="text-3xl md:text-6xl font-display font-light text-white">
                Benchmark Rigor.
              </h2>
            </div>
            <span className="font-mono text-[11px] text-neutral-500 uppercase tracking-[0.2em]">
              Longitudinal IIITA Dataset (11,718 Total Events)
            </span>
          </div>

          {/* Benchmark Table */}
          <div className="overflow-x-auto mb-16 rounded-sm border border-white/10">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-neutral-400 uppercase tracking-[0.16em] text-[10px]">
                  <th className="p-4">Model / Algorithm</th>
                  <th className="p-4">MAE (Heads)</th>
                  <th className="p-4">RMSE (Heads)</th>
                  <th className="p-4">MAPE</th>
                  <th className="p-4">WAPE</th>
                  <th className="p-4">90% Coverage (PICP)</th>
                  <th className="p-4">Latency</th>
                  <th className="p-4">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {researchBenchmarks.map((b, i) => {
                  const isTop = i === 0;
                  return (
                    <tr
                      key={b.name}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isTop ? 'bg-amber-400/[0.05] text-white font-medium' : 'text-neutral-300'
                      }`}
                    >
                      <td className="p-4 flex items-center gap-2">
                        {isTop && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                        <span>{b.name}</span>
                      </td>
                      <td className="p-4 font-bold">{b.mae}</td>
                      <td className="p-4">{b.rmse}</td>
                      <td className="p-4">{b.mape}</td>
                      <td className="p-4 text-emerald-400">{b.wape}</td>
                      <td className="p-4">{b.picp}</td>
                      <td className="p-4">{b.speed}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] ${
                          isTop ? 'bg-amber-400/20 text-amber-300' : 'bg-white/5 text-neutral-400'
                        }`}>
                          {b.tag}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Research Telemetry Plots Gallery */}
          <div id="telemetry" className="mt-20">
            <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-8">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-400 block mb-1">
                  Research Telemetry Gallery // 11 Verified Plots
                </span>
                <h3 className="font-display text-2xl md:text-3xl text-white font-light">
                  Click Figure to Inspect High-Resolution Findings
                </h3>
              </div>
              <span className="font-mono text-[11px] text-neutral-500 uppercase tracking-[0.2em] hidden sm:inline-block">
                [ Full-Screen Lightbox Available ]
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {researchPlots.map((plot) => (
                <div
                  key={plot.id}
                  onClick={() => setSelectedPlot(plot)}
                  data-cursor="INSPECT"
                  className="group rounded-sm border border-white/10 hover:border-white/30 bg-neutral-950/80 overflow-hidden cursor-pointer transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-[16/10] bg-neutral-900 overflow-hidden">
                    <img
                      src={plot.file}
                      alt={plot.title}
                      className="w-full h-full object-cover grayscale-[25%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                    />
                    <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white/70 group-hover:text-white backdrop-blur">
                      <Maximize2 size={12} />
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between border-t border-white/5">
                    <div>
                      <span className="font-mono text-[9px] text-amber-400 uppercase tracking-[0.2em] block mb-1">
                        Plot [0{plot.id}]
                      </span>
                      <h4 className="font-display text-base text-white font-medium mb-2 group-hover:text-amber-300 transition-colors">
                        {plot.title}
                      </h4>
                      <p className="font-sans text-xs text-neutral-400 line-clamp-2 font-light">
                        {plot.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-neutral-500 font-mono text-[10px]">
                      <span>Inspect Telemetry</span>
                      <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Editorial Footer */}
      <footer className="w-full py-16 px-4 sm:px-8 md:px-16 border-t border-white/10 bg-[#09090b]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-sm font-bold text-white tracking-[0.25em]">MESA</span>
              <span className="text-white/20">/</span>
              <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-[0.2em]">
                IIIT Allahabad Institutional Dining
              </span>
            </div>
            <p className="font-sans text-xs text-neutral-500 max-w-lg font-light leading-relaxed">
              Department of Electronics and Communication Engineering · Indian Institute of Information Technology, Allahabad. Supervised by Dr. Kirtan Gopal Panda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 font-mono text-[11px] tracking-[0.16em] text-neutral-400">
            <a
              href="/MinorProject_Presentation.pptx"
              download
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Project Deck (.pptx)</span>
            </a>
            <span className="hidden sm:inline text-white/20">·</span>
            <span>Varun Karankar (IEC2023037)</span>
            <span className="hidden sm:inline text-white/20">·</span>
            <span>Aadarsh Singh (IEC2023058)</span>
            <span className="hidden sm:inline text-white/20">·</span>
            <span>Tushar Garg (IEC2023059)</span>
          </div>
        </div>
      </footer>

      {/* Plot Full-Screen Lightbox */}
      <PlotLightboxModal
        plot={selectedPlot}
        onClose={() => setSelectedPlot(null)}
        onSelectPlot={(p) => setSelectedPlot(p)}
        allPlots={researchPlots}
      />

    </div>
  );
}
