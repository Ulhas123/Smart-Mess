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

export type StudentUser = {
  roll: string
  name: string
  email?: string
  hostel: string
  is_allowed: boolean
  id_card_data?: string
  id_card_filename?: string
  registered_at?: string
}

export type VendorUser = {
  vendor_id: string
  name: string
  hostel: string
}

export type WeatherData = {
  city: string
  state: string
  country: string
  coordinates?: { latitude: number; longitude: number }
  temperature: number
  apparent_temperature: number
  humidity: number
  precipitation_mm: number
  wind_speed_kmh: number
  weather_code: number
  condition: string
  icon: string
  is_day?: number
  is_rainy: boolean
  temp_max: number
  temp_min: number
  source?: string
  updated_at: string
}

export type AttendanceRecord = {
  id: number
  roll: string
  name: string
  hostel: string
  slot: string
  date: string
  timestamp: string
  status: "APPROVED" | "DENIED" | "DUPLICATE"
  reason?: string
  id_card_data?: string
}

export type AttendanceScanResult = {
  status: "APPROVED" | "DENIED" | "DUPLICATE"
  roll: string
  name: string
  hostel: string
  slot: string
  timestamp: string
  allowed: boolean
  reason: string
  id_card_data?: string
  claimed_at?: string
}
