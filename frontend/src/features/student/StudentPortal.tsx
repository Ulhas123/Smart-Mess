import React, { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChefHat,
  Clock3,
  Download,
  History,
  IdCard,
  LogOut,
  QrCode as QrCodeIcon,
  RefreshCw,
  ScanLine,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Utensils,
  XCircle,
} from "lucide-react"
import confetti from "canvas-confetti"
import { initialFeedbacks, menuDays } from "../../data/demoData"
import type {
  AttendanceRecord,
  FeedbackItem,
  MealClaim,
  MealPeriod,
  MealSession,
  ScanResult,
  StudentUser,
} from "../../types"
import {
  Brand,
  Button,
  Eyebrow,
  Modal,
  SegmentedControl,
  StatusChip,
} from "../../components/UI"
import { QRCode } from "../../components/QRCode"
import { WeatherWidget } from "../../components/WeatherWidget"
import {
  generateMealPass,
  fetchStudentHistory,
  submitFeedback,
} from "../../services/api"

type StudentPortalProps = {
  studentUser?: StudentUser
  session: MealSession | null
  claim: MealClaim | undefined
  onScan: () => ScanResult
  onSwitch: () => void
  onLogout?: () => void
}

const mealPeriods: MealPeriod[] = ["Breakfast", "Lunch", "Snacks", "Dinner"]

function getCurrentSlot(): MealPeriod {
  const h = new Date().getHours()
  if (h >= 7 && h < 11) return "Breakfast"
  if (h >= 11 && h < 16) return "Lunch"
  if (h >= 16 && h < 18) return "Snacks"
  return "Dinner"
}

export default function StudentPortal({
  studentUser,
  session,
  claim,
  onScan,
  onSwitch,
  onLogout,
}: StudentPortalProps) {
  // Use passed studentUser or fallback to default student
  const [currentStudent, setCurrentStudent] = useState<StudentUser>(() => studentUser || {
    roll: "IEC2023059",
    name: "Tushar Garg",
    hostel: "BH-2",
    is_allowed: true,
    email: "iec2023059@iiita.ac.in",
  })
  const activeStudent = currentStudent

  const [section, setSection] = useState<"today" | "menu" | "history">("today")
  const [dayIndex, setDayIndex] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState<MealPeriod>(getCurrentSlot())
  const [hostel, setHostel] = useState<string>(activeStudent.hostel || "BH-2")

  // QR Pass State
  const [passData, setPassData] = useState<any | null>(null)
  const [qrString, setQrString] = useState<string>("")
  const [passLoading, setPassLoading] = useState(false)
  const [passExpiryTimer, setPassExpiryTimer] = useState<number>(1800) // 30 min timer
  const [showIdCardModal, setShowIdCardModal] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)

  // Attendance History State
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Feedback State
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(initialFeedbacks)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  // Sync latest student status (is_allowed) from backend on mount
  useEffect(() => {
    let mounted = true
    fetchStudentHistory(activeStudent.roll).then((res) => {
      if (mounted && res?.student) {
        setCurrentStudent((prev) => ({
          ...prev,
          name: res.student.name || prev.name,
          hostel: res.student.hostel || prev.hostel,
          is_allowed: Boolean(res.student.is_allowed),
        }))
        if (res.history) {
          setHistoryRecords(res.history)
        }
      }
    }).catch(() => {})
    return () => { mounted = false }
  }, [activeStudent.roll])

  const handleGeneratePass = async (slot: MealPeriod) => {
    setPassLoading(true)
    try {
      const res = await generateMealPass(activeStudent.roll, slot)
      setPassData(res.pass_data)
      setQrString(res.qr_string)
      setPassExpiryTimer(1800)
    } catch (err) {
      console.warn("Pass generation error", err)
    } finally {
      setPassLoading(false)
    }
  }

  // Auto-generate QR pass on load if allowed
  useEffect(() => {
    if (activeStudent.is_allowed) {
      handleGeneratePass(selectedSlot)
    }
  }, [selectedSlot, activeStudent.roll, activeStudent.is_allowed])

  // Countdown timer for active pass
  useEffect(() => {
    if (!passData) return
    const interval = setInterval(() => {
      setPassExpiryTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [passData])

  const downloadQrPass = () => {
    const qrImg = document.querySelector(".qr-code-wrapper img") as HTMLImageElement
    if (qrImg && qrImg.src) {
      const a = document.createElement("a")
      a.href = qrImg.src
      a.download = `IIITA_Pass_${activeStudent.roll}_${selectedSlot}.png`
      a.click()
    }
  }

  const copyQrToken = () => {
    if (qrString) {
      navigator.clipboard.writeText(qrString)
      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 2000)
    }
  }

  const loadAttendanceHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await fetchStudentHistory(activeStudent.roll)
      if (res && res.history) {
        setHistoryRecords(res.history)
      }
    } catch (e) {
      console.warn("History load error", e)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    const newFeedback: FeedbackItem = {
      id: Date.now(),
      roll: activeStudent.roll,
      name: activeStudent.name,
      rating,
      comment: comment.trim(),
      meal: selectedSlot,
      timeAgo: "Just now",
    }

    setFeedbacks([newFeedback, ...feedbacks])
    setComment("")
    setFeedbackSubmitted(true)
    submitFeedback({
      roll: activeStudent.roll,
      rating,
      comment: comment.trim(),
      meal: selectedSlot,
    })
  }

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? "0" : ""}${s}`
  }

  const currentMenu =
    menuDays[dayIndex]?.meals?.[selectedSlot] || menuDays[0].meals.Lunch

  return (
    <div className="student-app" style={{ minHeight: "100vh", background: "var(--ivory)" }}>
      {/* Top Header */}
      <header 
        className="student-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid var(--line)",
          background: "var(--paper)",
          flexWrap: "wrap",
          gap: 12
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Brand />
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, background: "rgba(0,0,0,0.04)", padding: "4px 10px", borderRadius: 20 }}>
            <span className="pulse-dot" />
            <span>Student Portal</span>
          </div>
        </div>

        {/* Live Weather Widget for Prayagraj, UP */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <WeatherWidget variant="compact" />

          {/* Student Profile Pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button 
              className="profile-button" 
              onClick={() => setShowIdCardModal(true)}
              title="Click to view official College ID Card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 24,
                border: "1px solid var(--line)",
                background: "var(--paper)",
                cursor: "pointer"
              }}
            >
              <div 
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#0f172a",
                  color: "#ffffff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                {activeStudent.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                <strong style={{ fontSize: 13, display: "block" }}>{activeStudent.name}</strong>
                <small style={{ fontSize: 10, color: "var(--muted)" }}>{activeStudent.roll} · {activeStudent.hostel}</small>
              </div>
            </button>

            <button
              onClick={onLogout || onSwitch}
              className="button button-ghost"
              style={{ padding: "6px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
              title="Sign Out of Student Account"
            >
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="student-main" style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        
        {/* Navigation Bar / Tabs */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setSection("today")}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: "none",
                background: section === "today" ? "#0f172a" : "rgba(0,0,0,0.06)",
                color: section === "today" ? "#ffffff" : "var(--ink)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <QrCodeIcon size={16} />
              <span>Digital Meal Pass</span>
            </button>

            <button
              onClick={() => setSection("menu")}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: "none",
                background: section === "menu" ? "#0f172a" : "rgba(0,0,0,0.06)",
                color: section === "menu" ? "#ffffff" : "var(--ink)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <CalendarDays size={16} />
              <span>Mess Menu</span>
            </button>

            <button
              onClick={() => {
                setSection("history")
                loadAttendanceHistory()
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: "none",
                background: section === "history" ? "#0f172a" : "rgba(0,0,0,0.06)",
                color: section === "history" ? "#ffffff" : "var(--ink)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <History size={16} />
              <span>My Attendance History</span>
            </button>
          </div>

          {/* College ID Card Quick Trigger */}
          <button
            onClick={() => setShowIdCardModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(56, 189, 248, 0.1)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              color: "#0284c7",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <IdCard size={15} />
            <span>View College ID Card</span>
          </button>
        </div>

        {/* SECTION: TODAY / DIGITAL MEAL PASS WITH QR CODE */}
        {section === "today" && (
          <>
            {/* Eligibility Banner */}
            {!activeStudent.is_allowed ? (
              <div 
                style={{
                  background: "#fee2e2",
                  border: "1px solid #ef4444",
                  borderRadius: 12,
                  padding: "16px 20px",
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  color: "#991b1b"
                }}
              >
                <ShieldAlert size={28} style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: 15, display: "block" }}>Mess Access Restricted (Not Allowed)</strong>
                  <p style={{ fontSize: 13, margin: "2px 0 0" }}>
                    Your student account is currently blocked from dining hall entry due to pending mess fee dues or unverified identity card. Please contact the warden's office.
                  </p>
                </div>
              </div>
            ) : (
              <div 
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 12,
                  padding: "12px 18px",
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "#166534",
                  fontSize: 13
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ShieldCheck size={20} style={{ color: "#16a34a" }} />
                  <div>
                    <strong>Authorized Mess Member</strong> · All service turnstiles active for {activeStudent.hostel}
                  </div>
                </div>
                <span style={{ fontSize: 11, background: "#dcfce7", padding: "4px 8px", borderRadius: 6, fontWeight: 600 }}>
                  Active Enrolled Resident
                </span>
              </div>
            )}

            {/* Grid: QR Code Generator Pass & Prayagraj Weather + Occupancy */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, marginBottom: 28 }}>
              
              {/* PRIMARY FEATURE: DYNAMIC QR CODE PASS GENERATOR */}
              <article 
                style={{
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  borderRadius: 18,
                  padding: 24,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <Eyebrow>Turnstile Verification Pass</Eyebrow>
                      <h2 style={{ fontSize: 22, marginTop: 4 }}>Student Entry QR Pass</h2>
                      <p style={{ fontSize: 12, color: "var(--muted)" }}>
                        Present this QR code to the mess vendor counter to mark attendance.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 4 }}>
                      {mealPeriods.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            padding: "4px 8px",
                            fontSize: 11,
                            borderRadius: 6,
                            border: "none",
                            background: selectedSlot === slot ? "#0f172a" : "rgba(0,0,0,0.05)",
                            color: selectedSlot === slot ? "#ffffff" : "var(--ink)",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* QR Code Presentation Box */}
                  <div 
                    style={{
                      background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
                      border: "1px dashed rgba(0,0,0,0.15)",
                      borderRadius: 14,
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center"
                    }}
                  >
                    {activeStudent.is_allowed ? (
                      <>
                        <div style={{ marginBottom: 12 }}>
                          <QRCode 
                            value={qrString || `${activeStudent.roll}:${selectedSlot}`} 
                            size={180} 
                          />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#15803d", fontWeight: 600, marginBottom: 4 }}>
                          <CheckCircle2 size={16} />
                          <span>Pass Active for {selectedSlot}</span>
                        </div>

                        <div style={{ fontSize: 11, color: "var(--muted)" }}>
                          Roll: <strong>{activeStudent.roll}</strong> · {activeStudent.name} ({activeStudent.hostel})
                        </div>

                        <div 
                          style={{
                            marginTop: 10,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            background: "rgba(0,0,0,0.06)",
                            padding: "3px 10px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontFamily: "monospace"
                          }}
                        >
                          <Clock3 size={12} />
                          <span>Session countdown: {formatTimer(passExpiryTimer)}</span>
                        </div>

                        {/* Quick action buttons for QR Pass */}
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                          <button
                            type="button"
                            onClick={downloadQrPass}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              background: "rgba(0,0,0,0.05)",
                              border: "1px solid var(--line)",
                              borderRadius: 6,
                              padding: "4px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                            title="Download QR code image to upload into vendor turnstile scanner"
                          >
                            <Download size={12} />
                            <span>Download Pass</span>
                          </button>

                          <button
                            type="button"
                            onClick={copyQrToken}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              background: copiedToken ? "#dcfce7" : "rgba(0,0,0,0.05)",
                              border: copiedToken ? "1px solid #86efac" : "1px solid var(--line)",
                              color: copiedToken ? "#15803d" : "inherit",
                              borderRadius: 6,
                              padding: "4px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                            title="Copy QR token string to paste into vendor scanner"
                          >
                            <Check size={12} />
                            <span>{copiedToken ? "Copied!" : "Copy Token"}</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: 20, textAlign: "center", color: "#991b1b" }}>
                        <XCircle size={44} style={{ margin: "0 auto 10px" }} />
                        <strong>QR Pass Disabled</strong>
                        <p style={{ fontSize: 12, marginTop: 4 }}>
                          You are currently barred from generating meal access codes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    onClick={() => handleGeneratePass(selectedSlot)}
                    disabled={passLoading || !activeStudent.is_allowed}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "none",
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 12,
                      cursor: "pointer"
                    }}
                  >
                    <RefreshCw size={13} className={passLoading ? "spin" : ""} />
                    <span>Regenerate QR</span>
                  </button>

                  <span style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Turnstile QR Pass · IIITA Dining
                  </span>
                </div>
              </article>

              {/* SECONDARY COLUMN: PRAYAGRAJ WEATHER & FLOOR OCCUPANCY */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Live Weather Widget for Prayagraj, UP */}
                <WeatherWidget variant="card" />

                {/* Occupancy card */}
                <article 
                  style={{
                    background: "var(--paper)",
                    border: "1px solid var(--line)",
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.04)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <Eyebrow>{activeStudent.hostel} Dining Hall</Eyebrow>
                      <h3 style={{ fontSize: 18, marginTop: 2 }}>Current Hall Occupancy</h3>
                    </div>
                    <StatusChip tone="good">Real-Time</StatusChip>
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                    <strong style={{ fontSize: 32, fontWeight: 700 }}>58%</strong>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>290 of 500 seated</span>
                  </div>

                  <div className="capacity-track" style={{ height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ width: "58%", height: "100%", background: "#0f172a", borderRadius: 3 }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock3 size={13} /> ~3 min wait line
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Sparkles size={13} /> Fast turnstile clearance
                    </span>
                  </div>
                </article>
              </div>

            </div>

            {/* Menu Feature for Current Meal */}
            <section 
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderRadius: 16,
                padding: 24,
                marginBottom: 28
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <Eyebrow>Chef's Service</Eyebrow>
                  <h3 style={{ fontSize: 20, marginTop: 2 }}>Today's {selectedSlot} Menu</h3>
                </div>
                <button
                  onClick={() => setSection("menu")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0284c7",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  View full week menu →
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                {currentMenu.items.map((item, idx) => (
                  <div 
                    key={item}
                    style={{
                      background: "rgba(0,0,0,0.02)",
                      border: "1px solid var(--line)",
                      borderRadius: 10,
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>0{idx + 1}</span>
                    <strong style={{ fontSize: 13 }}>{item}</strong>
                  </div>
                ))}
              </div>
            </section>

            {/* Student Feedback Section */}
            <section 
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderRadius: 16,
                padding: 24
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <Eyebrow>Quality Assurance</Eyebrow>
                  <h3 style={{ fontSize: 18, marginTop: 2 }}>Rate Today's {selectedSlot}</h3>
                </div>
                {feedbackSubmitted && (
                  <StatusChip tone="good">Feedback Logged</StatusChip>
                )}
              </div>

              <form onSubmit={handleFeedbackSubmit}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: s <= rating ? "#f59e0b" : "#cbd5e1",
                        padding: 2
                      }}
                    >
                      <Star size={24} fill={s <= rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                  <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 8 }}>
                    {rating === 5 ? "Exceptional" : rating === 4 ? "Very Good" : rating === 3 ? "Satisfactory" : "Needs Improvement"}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share feedback on taste, preparation, portion, or hygiene..."
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "1px solid var(--line)",
                      fontSize: 13,
                      outline: "none"
                    }}
                  />
                  <Button type="submit" icon={<Send size={15} />}>
                    Submit Review
                  </Button>
                </div>
              </form>
            </section>
          </>
        )}

        {/* SECTION: WEEKLY MENU */}
        {section === "menu" && (
          <section style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <Eyebrow>{hostel} Weekly Dining</Eyebrow>
              <h2 style={{ fontSize: 24, marginTop: 4 }}>Weekly Chef Schedule</h2>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>
                Nutritionally balanced menus prepared daily per IIIT Allahabad mess committee.
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 6 }}>
              {menuDays.map((day, idx) => (
                <button
                  key={day.date}
                  onClick={() => setDayIndex(idx)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    border: "none",
                    background: dayIndex === idx ? "#0f172a" : "rgba(0,0,0,0.05)",
                    color: dayIndex === idx ? "#ffffff" : "var(--ink)",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <div style={{ fontSize: 13 }}>{day.day}</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{day.date}</div>
                </button>
              ))}
            </div>

            <SegmentedControl
              items={mealPeriods}
              value={selectedSlot}
              onChange={setSelectedSlot}
            />

            <div style={{ marginTop: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                {currentMenu.items.map((item, idx) => (
                  <div 
                    key={item}
                    style={{
                      background: "rgba(0,0,0,0.02)",
                      border: "1px solid var(--line)",
                      borderRadius: 10,
                      padding: 14
                    }}
                  >
                    <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>ITEM 0{idx + 1}</span>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{item}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, display: "flex", gap: 8, alignItems: "center" }}>
                {currentMenu.tags?.map((t) => (
                  <StatusChip key={t} tone="good">{t}</StatusChip>
                ))}
                {currentMenu.allergen && (
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>Allergens: {currentMenu.allergen}</span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SECTION: ATTENDANCE HISTORY */}
        {section === "history" && (
          <section style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <Eyebrow>Institutional Attendance Records</Eyebrow>
                <h2 style={{ fontSize: 24, marginTop: 4 }}>Meal Attendance Log</h2>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>
                  Verified entries recorded when the vendor scanned your QR code at the turnstile.
                </p>
              </div>

              <button
                onClick={loadAttendanceHistory}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  background: "none",
                  fontSize: 12,
                  cursor: "pointer"
                }}
              >
                <RefreshCw size={13} className={historyLoading ? "spin" : ""} />
                <span>Refresh Logs</span>
              </button>
            </div>

            {historyRecords.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
                <Clock3 size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                <p>No turnstile scans recorded yet for {activeStudent.roll}. Generate your QR code and have the vendor scan it at entry!</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--line)", color: "var(--muted)", fontSize: 11, textTransform: "uppercase" }}>
                      <th style={{ padding: 10 }}>Date</th>
                      <th style={{ padding: 10 }}>Meal Slot</th>
                      <th style={{ padding: 10 }}>Scan Time</th>
                      <th style={{ padding: 10 }}>Dining Hostel</th>
                      <th style={{ padding: 10 }}>Turnstile Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRecords.map((r) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                        <td style={{ padding: 12, fontWeight: 500 }}>{r.date}</td>
                        <td style={{ padding: 12, fontWeight: 600 }}>{r.slot}</td>
                        <td style={{ padding: 12, color: "var(--muted)" }}>{r.timestamp}</td>
                        <td style={{ padding: 12 }}>{r.hostel}</td>
                        <td style={{ padding: 12 }}>
                          <span 
                            style={{
                              background: r.status === "APPROVED" ? "#dcfce7" : "#fee2e2",
                              color: r.status === "APPROVED" ? "#166534" : "#991b1b",
                              padding: "4px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600
                            }}
                          >
                            {r.status === "APPROVED" ? "Verified Entered" : r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {/* College Identity Card Preview Modal */}
      {showIdCardModal && (
        <Modal title="College Identity Card" onClose={() => setShowIdCardModal(false)}>
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
              Official IIIT Allahabad student credential uploaded during registration.
            </p>

            <div 
              style={{
                maxWidth: 340,
                margin: "0 auto",
                borderRadius: 12,
                overflow: "hidden",
                border: "2px solid rgba(0,0,0,0.1)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
              }}
            >
              {activeStudent.id_card_data ? (
                <img 
                  src={activeStudent.id_card_data} 
                  alt="Student ID Card" 
                  style={{ width: "100%", height: "auto", display: "block" }} 
                />
              ) : (
                <div style={{ background: "#0f172a", color: "#ffffff", padding: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>IIIT ALLAHABAD</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>STUDENT IDENTITY CARD</div>
                  <div style={{ marginTop: 20, fontSize: 16, fontWeight: 700 }}>{activeStudent.name}</div>
                  <div style={{ fontSize: 13, color: "#38bdf8", fontFamily: "monospace" }}>{activeStudent.roll}</div>
                  <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>Hostel: {activeStudent.hostel}</div>
                  <div style={{ marginTop: 14, fontSize: 10, color: "#4ade80", fontWeight: 700 }}>VERIFIED MESS RESIDENT</div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, fontSize: 12, color: "var(--muted)" }}>
              Status: <strong style={{ color: activeStudent.is_allowed ? "#16a34a" : "#dc2626" }}>
                {activeStudent.is_allowed ? "Allowed for Mess Access" : "Barred / Payment Hold"}
              </strong>
            </div>

            <div style={{ marginTop: 16 }}>
              <Button onClick={() => setShowIdCardModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
