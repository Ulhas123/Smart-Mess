import { useEffect, useState } from "react"
import {
  ArrowRight,
  BarChart3,
  Check,
  Download,
  Github,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"
import { Brand, Button, Eyebrow } from "./components/UI"
import OperationsConsole from "./features/operations/OperationsConsole"
import StudentPortal from "./features/student/StudentPortal"
import StudentAuth from "./features/auth/StudentAuth"
import VendorAuth from "./features/auth/VendorAuth"
import { WeatherWidget } from "./components/WeatherWidget"
import { student } from "./data/demoData"
import type { MealClaim, MealSession, Role, ScanResult, StudentUser, VendorUser } from "./types"

function RoleLanding({ onSelect }: { onSelect: (role: Role) => void }) {
  return (
    <main className="landing">
      <div className="landing-glow landing-glow-a" />
      <div className="landing-glow landing-glow-b" />
      <header className="landing-header" style={{ width: "100%", maxWidth: 1100, margin: "0 auto", padding: "20px 24px" }}>
        <Brand />
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {/* Live Free Weather API Integration for Prayagraj, UP */}
          <WeatherWidget variant="header" />

          <div className="landing-status">
            <span className="pulse-dot" />
            All dining systems operational
          </div>
          <a
            href="/MinorProject_Presentation.pptx"
            download="MinorProject_Presentation.pptx"
            className="button button-ghost"
            style={{ fontSize: 11, padding: "6px 12px", textDecoration: "none" }}
          >
            <Download size={14} />
            <span>Deck (.pptx)</span>
          </a>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <Eyebrow>Institutional dining management · IIIT Allahabad</Eyebrow>
          <h1>
            Meal service.
            <br />
            <em>Precisely managed.</em>
          </h1>
          <p>
            Predictive mathematical demand modeling, real-time QR turnstile counter telemetry,
            and zero-waste supply allocation for institutional dining.
          </p>
        </div>
        <div className="landing-orbit" aria-hidden="true">
          <div className="orbit-ring orbit-one" />
          <div className="orbit-ring orbit-two" />
          <div className="orbit-core">
            <Sparkles size={28} />
            <span>
              Live
              <br />
              intelligence
            </span>
          </div>
          <span className="orbit-stat orbit-stat-a">
            <strong>96.4%</strong>forecast accuracy
          </span>
          <span className="orbit-stat orbit-stat-b">
            <strong>−18%</strong>food waste
          </span>
          <span className="orbit-stat orbit-stat-c">
            <strong>4 min</strong>queue time
          </span>
        </div>
      </section>

      <section className="role-selector">
        <button
          className="role-card student-role"
          onClick={() => onSelect("student")}
        >
          <span className="role-number">01</span>
          <div className="role-icon">
            <QrCode size={28} />
          </div>
          <div>
            <Eyebrow>For residents (Roll No. Login & ID Card)</Eyebrow>
            <h2>Student portal</h2>
            <p>Sign in with Roll No, upload college ID card during registration, generate meal pass QR code, review weekly menus, and inspect dining occupancy.</p>
          </div>
          <span className="role-action">
            Enter student portal <ArrowRight size={18} />
          </span>
        </button>

        <button
          className="role-card operations-role"
          onClick={() => onSelect("operations")}
        >
          <span className="role-number">02</span>
          <div className="role-icon">
            <BarChart3 size={28} />
          </div>
          <div>
            <Eyebrow>For dining caterers (No Registration Needed)</Eyebrow>
            <h2>Operations & vendor console</h2>
            <p>Scan student QR passes to record attendance, verify allowed students, quantile forecasting, What-If simulator, and procurement planning.</p>
          </div>
          <span className="role-action">
            Open vendor console <ArrowRight size={18} />
          </span>
        </button>
      </section>

      <footer className="landing-footer" style={{ flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-around", width: "100%", flexWrap: "wrap", gap: 16 }}>
          <div>
            <Users size={17} />
            <strong>1,842</strong>
            <span>meals served today</span>
          </div>
          <div>
            <ShieldCheck size={17} />
            <strong>100%</strong>
            <span>verified turnstile access</span>
          </div>
          <div>
            <Check size={17} />
            <strong>19 kg</strong>
            <span>residual waste vs 43 kg baseline</span>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: 12,
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 11,
            color: "rgba(255, 255, 255, 0.5)",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div>
            Department of Electronics and Communication Engineering · Indian Institute of Information Technology, Allahabad
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <span>Dr. Kirtan Gopal Panda (Supervisor)</span>
            <span>·</span>
            <span>Varun Karankar · Aadarsh Singh · Tushar Garg</span>
          </div>
        </div>
      </footer>
    </main>
  )
}

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

  // Route 1: Landing Page
  if (!role) {
    return <RoleLanding onSelect={setRole} />
  }

  // Route 2: Student Flow
  if (role === "student") {
    // If not logged in, show Student Login/Registration
    if (!studentUser) {
      return (
        <StudentAuth
          onLoginSuccess={handleStudentLogin}
          onBack={() => setRole(null)}
        />
      )
    }

    // Once authenticated, show Student Portal
    return (
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

  // Route 3: Vendor / Operations Flow
  // If not logged in, show Vendor Login (no register option)
  if (!vendorUser) {
    return (
      <VendorAuth
        onLoginSuccess={handleVendorLogin}
        onBack={() => setRole(null)}
      />
    )
  }

  // Once authenticated, show Operations & Vendor Console
  return (
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
