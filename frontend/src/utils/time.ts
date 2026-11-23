/**
 * frontend/src/utils/time.ts
 * Prayagraj Timezone (Asia/Kolkata) Synchronization Utilities
 *
 * Official KMK Global IIIT Prayagraj BH-2 & BH-3 Mess Schedule:
 * - Breakfast: Mon-Fri (07:30 - 09:30 IST), Sat-Sun (08:30 - 10:30 IST)
 * - Lunch: Everyday (13:00 - 15:00 IST)
 * - Dinner: Mon-Sat (19:30 - 21:30 IST), Sun (20:00 - 21:30 IST)
 * Decommissioned: Obsolete 'Snacks' slot removed.
 */

export const PRAYAGRAJ_TIMEZONE = "Asia/Kolkata";

export type MealSlotName = "Breakfast" | "Lunch" | "Dinner";

export interface TimeContext {
  timezone: string;
  city: string;
  iso: string;
  date: string;
  time: string;
  weekday: string;
  isWeekend: boolean;
  activeSlot: MealSlotName | null;
  currentSlot: MealSlotName;
  activeTiming: string;
  isActiveServing: boolean;
}

/**
 * Returns the current date in Asia/Kolkata
 */
export function getIstNow(): Date {
  return new Date();
}

/**
 * Formats date as YYYY-MM-DD in Prayagraj timezone
 */
export function getIstDateStr(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PRAYAGRAJ_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  let year = "";
  let month = "";
  let day = "";
  for (const p of parts) {
    if (p.type === "year") year = p.value;
    if (p.type === "month") month = p.value;
    if (p.type === "day") day = p.value;
  }
  return `${year}-${month}-${day}`;
}

/**
 * Formats time as HH:MM:SS in Prayagraj timezone (24-hour)
 */
export function getIstTimeStr(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: PRAYAGRAJ_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Returns { weekday, hour, minute, second } in Prayagraj timezone
 */
export function getIstParts(date: Date = new Date()): {
  weekday: string;
  hour: number;
  minute: number;
  second: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PRAYAGRAJ_TIMEZONE,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(date);

  let weekday = "Mon";
  let hour = 0;
  let minute = 0;
  let second = 0;

  for (const part of parts) {
    if (part.type === "weekday") weekday = part.value;
    if (part.type === "hour") hour = parseInt(part.value, 10) % 24;
    if (part.type === "minute") minute = parseInt(part.value, 10);
    if (part.type === "second") second = parseInt(part.value, 10);
  }

  return { weekday, hour, minute, second };
}

/**
 * Return 'Breakfast', 'Lunch', or 'Dinner' if strictly inside serving hours, else null
 */
export function getActiveMealSlot(date: Date = new Date()): MealSlotName | null {
  const { weekday, hour, minute } = getIstParts(date);
  const totalMinutes = hour * 60 + minute;
  const isWeekend = weekday === "Sat" || weekday === "Sun";
  const isSunday = weekday === "Sun";

  const bfStart = isWeekend ? 510 : 450; // 8:30 vs 7:30
  const bfEnd = isWeekend ? 630 : 570;   // 10:30 vs 9:30
  const lunchStart = 780;                // 13:00
  const lunchEnd = 900;                  // 15:00
  const dinStart = isSunday ? 1200 : 1170; // 20:00 vs 19:30
  const dinEnd = 1290;                   // 21:30

  if (totalMinutes >= bfStart && totalMinutes < bfEnd) return "Breakfast";
  if (totalMinutes >= lunchStart && totalMinutes < lunchEnd) return "Lunch";
  if (totalMinutes >= dinStart && totalMinutes < dinEnd) return "Dinner";

  return null;
}

/**
 * Returns current operational meal slot
 */
export function getCurrentMealSlot(date: Date = new Date()): MealSlotName {
  const active = getActiveMealSlot(date);
  if (active) return active;

  const { weekday, hour, minute } = getIstParts(date);
  const totalMinutes = hour * 60 + minute;
  const isWeekend = weekday === "Sat" || weekday === "Sun";

  const bfCutoff = isWeekend ? 660 : 630; // 11:00 vs 10:30
  const lunchCutoff = 960; // 16:00

  if (totalMinutes < bfCutoff) return "Breakfast";
  if (totalMinutes < lunchCutoff) return "Lunch";
  return "Dinner";
}

/**
 * Returns human-readable serving timing for given slot
 */
export function getSlotTimingDisplay(slot: string, date: Date = new Date()): string {
  const { weekday } = getIstParts(date);
  const isWeekend = weekday === "Sat" || weekday === "Sun";
  const isSunday = weekday === "Sun";
  const s = slot.toLowerCase();

  if (s === "breakfast") {
    return isWeekend ? "08:30 – 10:30 IST" : "07:30 – 09:30 IST";
  }
  if (s === "lunch") {
    return "13:00 – 15:00 IST";
  }
  if (s === "dinner") {
    return isSunday ? "20:00 – 21:30 IST" : "19:30 – 21:30 IST";
  }
  return "N/A";
}

/**
 * Full context object for UI components and headers
 */
export function getTimeContext(date: Date = new Date()): TimeContext {
  const activeSlot = getActiveMealSlot(date);
  const currentSlot = getCurrentMealSlot(date);
  const { weekday } = getIstParts(date);
  const isWeekend = weekday === "Sat" || weekday === "Sun";

  return {
    timezone: PRAYAGRAJ_TIMEZONE,
    city: "Prayagraj",
    iso: date.toISOString(),
    date: getIstDateStr(date),
    time: getIstTimeStr(date),
    weekday,
    isWeekend,
    activeSlot,
    currentSlot,
    activeTiming: getSlotTimingDisplay(currentSlot, date),
    isActiveServing: activeSlot !== null,
  };
}
