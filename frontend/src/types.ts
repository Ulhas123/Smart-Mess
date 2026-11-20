export type Role = "student" | "operations"
export type MealPeriod = "Breakfast" | "Lunch" | "Snacks" | "Dinner"
export type SessionStatus = "active" | "expired" | "ended"

export type MealSession = {
  id: string
  mealPeriod: MealPeriod
  startsAt: number
  expiresAt: number
  status: SessionStatus
  endedAt?: number
}

export type MealClaim = {
  studentId: string
  sessionId: string
  claimedAt: number
  studentName?: string
  hostel?: string
  mealPeriod?: string
}

export type ScanResult =
  | { type: "success"; claimedAt: number }
  | { type: "duplicate"; claimedAt: number }
  | { type: "unavailable" }
  | { type: "expired" }
  | { type: "wrong-meal" }

export type MenuDay = {
  day: string
  date: string
  meals: Record<
    MealPeriod,
    {
      time: string
      items: string[]
      tags: string[]
      allergen?: string
    }
  >
}

export type InventoryItem = {
  name: string
  category: string
  required: number
  stock: number
  unit: string
}

export type StaffingItem = {
  station: string
  recommended: number
  assigned: number
}

export type BenchmarkItem = {
  name: string
  mae: string
  rmse: string
  mape: string
  wape: string
  picp: string
  speed: string
  tag: string
}

export type ResearchPlot = {
  id: number
  title: string
  file: string
  desc: string
}

export type FeedbackItem = {
  id: number
  roll: string
  name: string
  rating: number
  comment: string
  meal: string
  timeAgo: string
}
