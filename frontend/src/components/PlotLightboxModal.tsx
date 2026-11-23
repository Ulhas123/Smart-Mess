'use client';
import React from 'react';
import { X, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ResearchPlot } from '../types';

interface PlotLightboxModalProps {
  plot: ResearchPlot | null;
  onClose: () => void;
  onSelectPlot?: (plot: ResearchPlot) => void;
  allPlots?: ResearchPlot[];
}

export default function PlotLightboxModal({
  plot,
  onClose,
  onSelectPlot,
  allPlots = [],
}: PlotLightboxModalProps) {
  if (!plot) return null;

  const currentIndex = allPlots.findIndex((p) => p.id === plot.id);
  const prevPlot = currentIndex > 0 ? allPlots[currentIndex - 1] : null;
  const nextPlot = currentIndex < allPlots.length - 1 ? allPlots[currentIndex + 1] : null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-8"
      onClick={onClose}
    >
      <div 
        className="relative max-w-5xl w-full max-h-[92vh] flex flex-col rounded-sm border border-white/20 bg-[#09090b] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lightbox Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-amber-400 uppercase tracking-widest">
              Telemetry Figure [0{plot.id}]
            </span>
            <span className="text-white/20">/</span>
            <h3 className="font-display text-lg text-white font-medium">{plot.title}</h3>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={plot.file}
              download={`${plot.title.replace(/\s+/g, '_')}.png`}
              className="p-2 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              title="Download high-resolution telemetry plot"
            >
              <Download size={16} />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Image Frame */}
        <div className="relative flex-1 overflow-auto bg-neutral-950/90 flex items-center justify-center p-4 md:p-8 min-h-[360px]">
          <img
            src={plot.file}
            alt={plot.title}
            className="max-h-[60vh] w-auto object-contain rounded border border-white/10 shadow-2xl"
          />

          {/* Navigation Arrows */}
          {prevPlot && onSelectPlot && (
            <button
              onClick={() => onSelectPlot(prevPlot)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 backdrop-blur transition-all"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {nextPlot && onSelectPlot && (
            <button
              onClick={() => onSelectPlot(nextPlot)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 backdrop-blur transition-all"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Lightbox Footer & Insights */}
        <div className="p-6 border-t border-white/10 bg-neutral-950/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-1">
              Empirical Research Finding & Mathematical Analysis
            </span>
            <p className="font-sans text-xs md:text-sm text-neutral-200 max-w-3xl leading-relaxed">
              {plot.desc}
            </p>
          </div>

          <div className="font-mono text-[11px] text-neutral-500 shrink-0">
            IIIT Allahabad ECE · 642-Day Empirical Cohort
          </div>
        </div>
      </div>
    </div>
  );
}
