import { useEffect, useState } from "react"
import AgencyLanding from "./components/AgencyLanding"
import OperationsConsole from "./features/operations/OperationsConsole"
import StudentPortal from "./features/student/StudentPortal"
import StudentAuth from "./features/auth/StudentAuth"
import VendorAuth from "./features/auth/VendorAuth"
import SmoothScroll from "./components/agency/SmoothScroll"
import CustomCursor from "./components/agency/CustomCursor"
import FilmGrainOverlay from "./components/agency/FilmGrainOverlay"
import { student } from "./data/demoData"
import type { MealClaim, MealSession, Role, ScanResult, StudentUser, VendorUser } from "./types"

export default function App() {
  const [role, setRole] = useState<Role | null>(null)
  
  // Authenticated user state with localStorage caching
  const [studentUser, setStudentUser] = useState<StudentUser | null>(() => {
    try {
      const saved = localStorage.getItem("iiita_mess_student")
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [vendorUser, setVendorUser] = useState<VendorUser | null>(() => {
    try {
      const saved = localStorage.getItem("iiita_mess_vendor")
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const handleStudentLogin = (st: StudentUser) => {
    setStudentUser(st)
    try {
      localStorage.setItem("iiita_mess_student", JSON.stringify(st))
    } catch {}
  }

  const handleStudentLogout = () => {
    setStudentUser(null)
    setRole(null)
    try {
      localStorage.removeItem("iiita_mess_student")
    } catch {}
  }

  const handleVendorLogin = (vd: VendorUser) => {
    setVendorUser(vd)
    try {
      localStorage.setItem("iiita_mess_vendor", JSON.stringify(vd))
    } catch {}
  }

  const handleVendorLogout = () => {
    setVendorUser(null)
    setRole(null)
    try {
      localStorage.removeItem("iiita_mess_vendor")
    } catch {}
  }

  // Active meal session
  const [session, setSession] = useState<MealSession | null>(() => {
    const now = Date.now()
    return {
      id: "LN-2026-0612-A",
      mealPeriod: "Lunch",
      startsAt: now - 30 * 60 * 1000,
      expiresAt: now + 90 * 60 * 1000,
      status: "active",
    }
  })

  const [claims, setClaims] = useState<MealClaim[]>([])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const closeButton = document.querySelector<HTMLButtonElement>(
          ".modal-panel .icon-button",
        )
        closeButton?.click()
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [])

  const generateSession = () => {
    if (session?.status === "active" && session.expiresAt > Date.now()) return
    const now = Date.now()
    setSession({
      id: `LN-${new Date(now).toISOString().slice(5, 10).replace("-", "")}-A`,
      mealPeriod: "Lunch",
      startsAt: now,
      expiresAt: now + 2 * 60 * 60 * 1000,
      status: "active",
    })
  }

  const endSession = () => {
    setSession((current) =>
      current ? { ...current, status: "ended", endedAt: Date.now() } : current,
    )
  }

  const scanSession = (): ScanResult => {
    if (!session) return { type: "unavailable" }
    if (session.mealPeriod !== "Lunch") return { type: "wrong-meal" }
    const currentRoll = studentUser?.roll || student.id
    const existing = claims.find(
      (claim) =>
        claim.studentId === currentRoll && claim.sessionId === session.id,
    )
    if (existing) return { type: "duplicate", claimedAt: existing.claimedAt }
    if (session.status !== "active" || session.expiresAt <= Date.now())
      return { type: "expired" }
    const claim: MealClaim = {
      studentId: currentRoll,
      sessionId: session.id,
      claimedAt: Date.now(),
      studentName: studentUser?.name || student.name,
      hostel: studentUser?.hostel || student.residence,
      mealPeriod: session.mealPeriod,
    }
    setClaims((current) => [...current, claim])
    return { type: "success", claimedAt: claim.claimedAt }
  }

  const currentRoll = studentUser?.roll || student.id
  const activeClaim = session
    ? claims.find(
        (claim) =>
          claim.studentId === currentRoll && claim.sessionId === session.id,
      )
    : undefined

  let content = null

  if (!role) {
    content = <AgencyLanding onSelectRole={setRole} />
  } else if (role === "student") {
    if (!studentUser) {
      content = (
        <StudentAuth
          onLoginSuccess={handleStudentLogin}
          onBack={() => setRole(null)}
        />
      )
    } else {
      content = (
        <StudentPortal
          studentUser={studentUser}
          session={session}
          claim={activeClaim}
          onScan={scanSession}
          onSwitch={() => setRole(null)}
          onLogout={handleStudentLogout}
        />
      )
    }
  } else {
    // operations role
    if (!vendorUser) {
      content = (
        <VendorAuth
          onLoginSuccess={handleVendorLogin}
          onBack={() => setRole(null)}
        />
      )
    } else {
      content = (
        <OperationsConsole
          vendorUser={vendorUser}
          session={session}
          claims={claims}
          onGenerateSession={generateSession}
          onEndSession={endSession}
          onSwitch={() => setRole(null)}
          onLogout={handleVendorLogout}
        />
      )
    }
  }

  return (
    <SmoothScroll>
      <CustomCursor />
      <FilmGrainOverlay />
      {content}
    </SmoothScroll>
  )
}
