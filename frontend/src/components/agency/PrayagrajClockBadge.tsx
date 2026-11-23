'use client';
import React, { useEffect, useState } from 'react';
import { 
  getIstParts, 
  getIstTimeStr, 
  getIstDateStr, 
  getActiveMealSlot, 
  MealSlotName 
} from '../../utils/time';

export interface ClockInfo {
  timeStr: string;
  activeSlot: string;
  isActive: boolean;
  dateStr: string;
  mealPeriod: MealSlotName | 'Closed';
}

export function computePrayagrajTime(): ClockInfo {
  const now = new Date();
  const timeStr = getIstTimeStr(now);
  const dateStr = getIstDateStr(now);
  const activeSlotName = getActiveMealSlot(now);
  const { weekday, hour, minute } = getIstParts(now);

  const totalMinutes = hour * 60 + minute;
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';
  const isSunday = weekday === 'Sun';

  const bfStart = isWeekend ? 510 : 450;
  const lunchStart = 780;
  const dinStart = isSunday ? 1200 : 1170;
  const dinEnd = 1290;

  let activeSlot = '';
  let isActive = false;
  let mealPeriod: MealSlotName | 'Closed' = 'Closed';

  if (activeSlotName) {
    activeSlot = `${activeSlotName.toUpperCase()} ACTIVE`;
    isActive = true;
    mealPeriod = activeSlotName;
  } else {
    // Upcoming service slot transition
    if (totalMinutes < bfStart) {
      activeSlot = `NEXT: BREAKFAST (${isWeekend ? '08:30' : '07:30'})`;
    } else if (totalMinutes < lunchStart) {
      activeSlot = 'NEXT: LUNCH (13:00)';
    } else if (totalMinutes < dinStart) {
      activeSlot = `NEXT: DINNER (${isSunday ? '20:00' : '19:30'})`;
    } else {
      activeSlot = 'CLOSED (NEXT: BREAKFAST)';
    }
    isActive = false;
    mealPeriod = 'Closed';
  }

  return { timeStr, activeSlot, isActive, dateStr, mealPeriod };
}

interface PrayagrajClockBadgeProps {
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
}

export default function PrayagrajClockBadge({
  className = '',
  variant = 'default',
}: PrayagrajClockBadgeProps) {
  const [clock, setClock] = useState<ClockInfo>(computePrayagrajTime);

  useEffect(() => {
    // Tick every 1000ms
    const interval = setInterval(() => {
      setClock(computePrayagrajTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { timeStr, activeSlot, isActive, dateStr } = clock;

  if (variant === 'minimal') {
    return (
      <div
        className={`inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-neutral-300 ${className}`}
        title={`Prayagraj IST (${dateStr}): ${activeSlot}`}
      >
        <span className="relative flex h-2 w-2">
          {isActive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isActive
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
            }`}
          />
        </span>
        <span>IST [{timeStr}]</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-200 shadow-sm ${className}`}
        title={`Prayagraj IST: ${dateStr}`}
      >
        <span className="relative flex h-2 w-2">
          {isActive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isActive
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
            }`}
          />
        </span>
        <span className="hidden sm:inline text-neutral-400">IST</span>
        <span className="font-semibold text-white">[{timeStr}]</span>
        <span className="text-neutral-500">·</span>
        <span className={isActive ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
          {activeSlot}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] backdrop-blur-md transition-colors font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-300 shadow-sm ${className}`}
      title={`Indian Institute of Information Technology, Allahabad · ${dateStr}`}
    >
      {/* Animated glowing pulse dot */}
      <span className="relative flex h-2 w-2">
        {isActive && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isActive
              ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]'
              : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]'
          }`}
        />
      </span>

      {/* Structured Location, IST Time, and Active Slot */}
      <span className="whitespace-nowrap flex items-center gap-1.5">
        <span className="text-neutral-400 hidden sm:inline">PRAYAGRAJ</span>
        <span className="text-neutral-600 hidden sm:inline">·</span>
        <span className="text-neutral-300">
          IST <span className="text-white font-medium">[{timeStr}]</span>
        </span>
        <span className="text-neutral-600">·</span>
        <span
          className={
            isActive
              ? 'text-emerald-400 font-semibold tracking-[0.16em]'
              : 'text-amber-400 font-medium tracking-[0.16em]'
          }
        >
          {activeSlot}
        </span>
      </span>
    </div>
  );
}
