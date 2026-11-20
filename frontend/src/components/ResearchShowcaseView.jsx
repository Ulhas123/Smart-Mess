import React, { useState } from 'react';
import { 
  GraduationCap, 
  FileText, 
  Download, 
  BookOpen, 
  Award, 
  BarChart3, 
  CheckCircle2, 
  Layers, 
  ExternalLink,
  Sigma,
  Zap,
  Eye,
  Maximize2
} from 'lucide-react';

export default function ResearchShowcaseView() {
  const [selectedPlot, setSelectedPlot] = useState(null);

  const benchmarks = [
    { name: 'LightGBM (All Features)', mae: '41.54', rmse: '53.23', mape: '32.14%', wape: '25.95%', picp: '72.4%', speed: '0.4 ms', tag: 'Best Overall' },
    { name: 'LightGBM (No Weather Ablation)', mae: '41.67', rmse: '53.33', mape: '32.08%', wape: '26.03%', picp: '72.1%', speed: '0.4 ms', tag: 'Ablation' },
    { name: 'LightGBM (No Calendar Ablation)', mae: '47.28', rmse: '60.89', mape: '38.09%', wape: '29.54%', picp: '68.3%', speed: '0.3 ms', tag: '+5.74 MAE' },
    { name: 'LightGBM Asymmetric (q75 Target)', mae: '48.54', rmse: '61.49', mape: '44.32%', wape: '30.33%', picp: '84.2%', speed: '0.4 ms', tag: 'Zero Shortage' },
    { name: 'Seasonal-Naive Baseline', mae: '68.20', rmse: '85.77', mape: '65.57%', wape: '42.61%', picp: '—', speed: '0.1 ms', tag: 'Baseline' },
    { name: 'Holt-Winters Smoothing', mae: '69.56', rmse: '83.47', mape: '58.16%', wape: '33.58%', picp: '—', speed: '12.3 ms', tag: 'Classical' },
    { name: 'SARIMA (2,1,1)(1,1,1)', mae: '72.88', rmse: '86.01', mape: '58.93%', wape: '35.18%', picp: '—', speed: '145.0 ms', tag: 'Classical' },
  ];

  const researchPlots = [
    { id: 1, title: 'Plot 1: Meal Slot Fluctuations', file: '/plots/plot1_jan2025.png', desc: 'Slot attendance hierarchy: Dinner (76%), Lunch (67%), Breakfast (42%).' },
    { id: 2, title: 'Plot 2: Day-of-Week Seasonality', file: '/plots/plot2_weekday_slot_avg.png', desc: 'Weekend drop-offs: 20–35% cooking batch reduction recommended.' },
    { id: 3, title: 'Plot 3: Academic Calendar Regimes', file: '/plots/plot3_academic_phase.png', desc: 'Vacation demand collapse (10–15%) vs Exam surges (78–81%).' },
    { id: 4, title: 'Plot 4: 642-Day Longitudinal Series', file: '/plots/plot4_full_timeseries.png', desc: 'Continuous simulation across 11,718 events (Jan 2025 – Oct 2026).' },
    { id: 5, title: 'Plot 5: OLS Parameter Recovery', file: '/plots/plot5_effect_recovery.png', desc: 'Identifiability proof: OLS recovers true simulation parameters.' },
    { id: 6, title: 'Plot 6: 9-Grid Robustness Sweeps', file: '/plots/plot6_robustness.png', desc: 'Dispersion robustness across varying student behavioral volatility.' },
    { id: 7, title: 'Plot 7: 3-Week Rolling Quantile Forecast', file: '/plots/plot7_3week_forecast.png', desc: 'Pinball loss bounds (q10 to q90) bounding unseen test events.' },
    { id: 8, title: 'Plot 8: Feature Gain Importance', file: '/plots/plot8_feature_importance.png', desc: 'Autoregressive lags and Hawkes festival kernels driving model splits.' },
    { id: 9, title: 'Plot 9: Empirical Quantile Calibration', file: '/plots/plot9_calibration.png', desc: 'Reliability diagram confirming 72.4% interval coverage without crossing.' },
    { id: 10, title: 'Plot 10: Procurement Operations Simulation', file: '/plots/plot10_ops_simulation.png', desc: 'Quantile blend cuts waste & cost penalties by 52.1% over guesswork.' },
    { id: 11, title: 'Plot 11: Cumulative Procurement vs Actual', file: '/plots/plot11_procurement_vs_actual.png', desc: 'Longitudinal serving tracking across 97,955 student meals.' },
  ];

  return (
    <div className="space-y-10 animate-fadeIn pb-16">
      
      {/* Academic Header & Authorship Card */}
      <div className="glass-panel p-8 border-l-4 border-l-iiita-600 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-iiita-100 text-iiita-900 dark:bg-iiita-950 dark:text-iiita-200">
                Department of Electronics & Communication Engineering
              </span>
              <span className="text-xs text-slate-500 font-medium">
                IIIT Allahabad
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Predictive Mathematical Modeling & Smart App for Mess Management
            </h1>
            
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Institutional dining demand forecasting tackling extreme non-stationarity from academic calendar shocks, Hawkes festival kernels, and asymmetric quantile loss.
            </p>
          </div>

          <a
            href="/MinorProject_Presentation.pptx"
            download="MinorProject_Presentation.pptx"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-iiita-900 hover:bg-iiita-800 text-white font-bold text-xs shadow-lg transition flex-shrink-0"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Presentation Deck (.pptx)</span>
          </a>
        </div>

        {/* Project Authors & Supervisor Badge Deck */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Project Supervisor
            </span>
            <div className="font-extrabold text-sm text-slate-900 dark:text-white">
              Dr. Kirtan Gopal Panda
            </div>
            <div className="text-xs text-slate-500">Assistant Professor, ECE</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
              Researcher & Presenter
            </span>
            <div className="font-extrabold text-sm text-slate-900 dark:text-white">
              Tushar Garg
            </div>
            <div className="text-xs text-slate-500 font-mono">Roll No. IEC2023059</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block mb-1">
              Researcher & Presenter
            </span>
            <div className="font-extrabold text-sm text-slate-900 dark:text-white">
              Varun Karankar
            </div>
            <div className="text-xs text-slate-500 font-mono">Roll No. IEC2023037</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
              Researcher & Presenter
            </span>
            <div className="font-extrabold text-sm text-slate-900 dark:text-white">
              Aadarsh Singh
            </div>
            <div className="text-xs text-slate-500 font-mono">Roll No. IEC2023058</div>
          </div>
        </div>
      </div>

      {/* Mathematical Formulations Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
            <Sigma className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Core Mathematical Engine Formulations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Formulation 1: Hawkes Event Intensity Kernel */}
          <div className="glass-panel p-6 border-t-2 border-t-emerald-500">
            <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
              [Hawkes 1971; Khan & Erdoğdu 2025]
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Exponential Festival Departure Kernel
            </h3>
            <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-xs my-3 overflow-x-auto">
              <code>λ(t) = μ₀ + ∑ αᵢ · exp(-βᵢ · (t - tᵢ))</code>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Models violent student departures prior to major cultural festivals (Diwali, Holi, Eid, Chhath). While standard retail models assume smooth trends, self-exciting point decay captures sudden institutional exoduses where dining collapses by up to 85%.
            </p>
          </div>

          {/* Formulation 2: Negative Binomial Count Model */}
          <div className="glass-panel p-6 border-t-2 border-t-cyan-500">
            <div className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
              [Cameron & Trivedi 2013; McCullagh & Nelder]
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Heteroscedastic Negative Binomial Count Modeling
            </h3>
            <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-xs my-3 overflow-x-auto">
              <code>Y_t ~ NegBin(μ_t, α_t) | Var(Y_t) = μ_t + α_t · μ_t²</code>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Standard Poisson models assume equidispersion (Var = Mean). Our stochastic engine parameterizes quadratic variance inflation, reflecting heightened student behavioral volatility and departure uncertainty during examination transitions.
            </p>
          </div>

          {/* Formulation 3: Quantile Pinball Loss */}
          <div className="glass-panel p-6 border-t-2 border-t-indigo-500">
            <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              [Koenker & Bassett 1978; Ke et al. 2017]
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Multi-Quantile Pinball Loss Objective
            </h3>
            <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-xs my-3 overflow-x-auto">
              <code>ℒ_τ(y, ŷ) = max( τ·(y - ŷ),  (1 - τ)·(ŷ - y) )</code>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Traditional symmetric loss functions (MSE/MAE) penalize over-cooking and under-cooking equally. Pinball loss produces non-crossing quantiles (q10, q50, q90), enabling kitchen staff to operate with calibrated safety-stock buffers (q75) that eliminate student food shortages.
            </p>
          </div>

          {/* Formulation 4: WAPE vs MAPE under zero-denominators */}
          <div className="glass-panel p-6 border-t-2 border-t-amber-500">
            <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
              [Hyndman & Koehler 2006]
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Volume-Weighted WAPE vs MAPE Metric Rigor
            </h3>
            <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-xs my-3 overflow-x-auto">
              <code>WAPE = ∑ |y_t - ŷ_t| / ∑ y_t  (Weighted by volume)</code>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              During semester vacations, attendance collapses to 15–30 students. An error of only 10 portions results in an artificial 66% MAPE penalty despite negligible food waste. Volume-weighted WAPE aligns mathematical loss directly with kilograms of food wasted.
            </p>
          </div>

        </div>
      </div>

      {/* Empirical Benchmark Comparison Table */}
      <div className="glass-panel p-6 border-t-4 border-t-iiita-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Chronological Test Benchmark Evaluation
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Evaluated strictly on unseen holdout events (July 1 – October 10, 2026; 612 meal events across BH-2 & BH-3)
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold font-mono">
            39.1% MAE Reduction over Naive
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Model / Configuration</th>
                <th className="pb-3">MAE (Heads)</th>
                <th className="pb-3">RMSE (Heads)</th>
                <th className="pb-3">MAPE (%)</th>
                <th className="pb-3">WAPE (%)</th>
                <th className="pb-3">90% Coverage (PICP)</th>
                <th className="pb-3">Inference Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {benchmarks.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={`transition ${idx === 0 ? 'bg-emerald-50/60 dark:bg-emerald-950/30 font-bold' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'}`}
                >
                  <td className="py-3.5 flex items-center gap-2 text-slate-900 dark:text-white">
                    {idx === 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>}
                    {row.name}
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {row.tag}
                    </span>
                  </td>
                  <td className="py-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{row.mae}</td>
                  <td className="py-3.5 font-mono text-slate-700 dark:text-slate-300">{row.rmse}</td>
                  <td className="py-3.5 font-mono text-slate-700 dark:text-slate-300">{row.mape}</td>
                  <td className="py-3.5 font-mono text-cyan-600 dark:text-cyan-400 font-bold">{row.wape}</td>
                  <td className="py-3.5 font-mono text-slate-700 dark:text-slate-300">{row.picp}</td>
                  <td className="py-3.5 font-mono text-slate-500">{row.speed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generated Research Plots Gallery */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-500" />
              High-Fidelity Research Artifacts & Generated Figures
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Click any generated research artifact to inspect high-resolution visual telemetry and analytical insights.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {researchPlots.map((plot) => (
            <div
              key={plot.id}
              onClick={() => setSelectedPlot(plot)}
              className="glass-panel overflow-hidden group cursor-pointer hover:border-emerald-500 transition-all duration-200"
            >
              <div className="aspect-video bg-slate-950 relative overflow-hidden">
                <img
                  src={plot.file}
                  alt={plot.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="p-2 rounded-xl bg-white/90 text-slate-900 flex items-center gap-1.5 text-xs font-bold shadow-lg">
                    <Maximize2 className="w-4 h-4" />
                    <span>Expand</span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  {plot.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {plot.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal for Expanded Plot */}
      {selectedPlot && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPlot(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedPlot.title}</h3>
                <p className="text-xs text-slate-500">{selectedPlot.desc}</p>
              </div>
              <button
                onClick={() => setSelectedPlot(null)}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-950">
              <img src={selectedPlot.file} alt={selectedPlot.title} className="max-h-[70vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Project References & Academic Citations */}
      <div className="glass-panel p-6 border-t-2 border-t-slate-300 dark:border-t-slate-700">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          Academic References & Theoretical Literature
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div>
            <strong>[1]</strong> S. A. Khan & A. Erdoğdu (2025). Stacking ensemble model for food demand forecasting. <em>Cleaner Logistics and Supply Chain</em>, Elsevier.
          </div>
          <div>
            <strong>[6]</strong> Q. Pham et al. (2022). Learning Fast and Slow for Online Time Series Forecasting (FSNet). <em>arXiv:2202.11672</em>.
          </div>
          <div>
            <strong>[8]</strong> G. Ke et al. (2017). LightGBM: Highly Efficient Gradient Boosting Decision Tree. <em>NeurIPS</em>.
          </div>
          <div>
            <strong>[9]</strong> R. Koenker & G. Bassett (1978). Regression Quantiles. <em>Econometrica</em>, vol. 46, no. 1.
          </div>
          <div>
            <strong>[11]</strong> A. C. Cameron & P. K. Trivedi (2013). <em>Regression Analysis of Count Data</em>, 2nd ed., Cambridge University Press.
          </div>
          <div>
            <strong>[12]</strong> A. G. Hawkes (1971). Spectra of some self-exciting point processes. <em>Biometrika</em>.
          </div>
        </div>
      </div>

    </div>
  );
}
