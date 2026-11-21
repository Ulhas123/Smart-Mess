import { useMemo, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChefHat,
  Clock3,
  QrCode,
  ScanLine,
  Sparkles,
  Star,
  Send,
  Users,
  Utensils,
  XCircle,
} from "lucide-react"
import confetti from "canvas-confetti"
import { initialFeedbacks, menuDays, student } from "../../data/demoData"
import type {
  FeedbackItem,
  MealClaim,
  MealPeriod,
  MealSession,
  ScanResult,
} from "../../types"
import {
  Brand,
  Button,
  Eyebrow,
  Modal,
  SegmentedControl,
  StatusChip,
} from "../../components/UI"
import { submitSwipe, submitFeedback } from "../../services/api"

type StudentPortalProps = {
  session: MealSession | null
  claim: MealClaim | undefined
  onScan: () => ScanResult
  onSwitch: () => void
}

const mealPeriods: MealPeriod[] = ["Breakfast", "Lunch", "Snacks", "Dinner"]

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp)
}

function ScanModal({
  session,
  onScan,
  onClose,
}: {
  session: MealSession | null
  onScan: () => ScanResult
  onClose: () => void
}) {
  const [result, setResult] = useState<ScanResult | null>(null)

  const copy = useMemo(() => {
    if (!result) return null
    if (result.type === "success")
      return {
        icon: <Check size={34} />,
        title: "Meal access approved",
        text: `Lunch recorded at ${formatTime(result.claimedAt)}. Entry is authorized for ${student.name} (${student.id}).`,
        tone: "success",
      }
    if (result.type === "duplicate")
      return {
        icon: <Check size={34} />,
        title: "Meal already claimed",
        text: `Lunch was recorded at ${formatTime(result.claimedAt)}. Duplicate entry blocked per meal policy.`,
        tone: "duplicate",
      }
    if (result.type === "wrong-meal")
      return {
        icon: <XCircle size={34} />,
        title: "Not valid for this meal",
        text: "The scanned QR applies to a different service slot. Please verify with mess supervisor.",
        tone: "error",
      }
    return {
      icon: <Clock3 size={34} />,
      title:
        result.type === "expired"
          ? "QR session expired"
          : "Meal session has not started",
      text:
        result.type === "expired"
          ? "The two-hour service window has ended. Please speak to the service desk team."
          : "Operations has not opened the lunch session yet. Service opens at 12:30 PM.",
      tone: "error",
    }
  }, [result])

  const handleSimulateScan = () => {
    const res = onScan()
    setResult(res)
    if (res.type === "success") {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        })
      } catch (e) {
        console.log("Confetti trigger", e)
      }
      submitSwipe({
        student_id: student.id,
        hostel: "BH-2",
        slot: "lunch",
      })
    }
  }

  return (
    <Modal title={result ? "Access Verification" : "Scan Vendor Counter QR"} onClose={onClose}>
      {!result ? (
        <div className="scanner-body">
          <div className="scanner-frame">
            <span className="scan-corner corner-a" />
            <span className="scan-corner corner-b" />
            <span className="scan-corner corner-c" />
            <span className="scan-corner corner-d" />
            <ScanLine size={52} strokeWidth={1.2} />
            <div className="scan-line" />
          </div>
          <div className="scanner-copy">
            <h3>Scan the displayed counter QR</h3>
            <p>
              {session?.status === "active"
                ? `Lunch session ${session.id} is live. Align your device with the counter display.`
                : "No active lunch session is available on the counter display."}
            </p>
          </div>
          <Button
            icon={<ScanLine size={18} />}
            onClick={handleSimulateScan}
          >
            Simulate scan
          </Button>
          <small className="prototype-note">
            Integrated Telemetry · Deterministic Verification
          </small>
        </div>
      ) : (
        <div className={`scan-result scan-result-${copy?.tone}`}>
          <div className="result-icon">{copy?.icon}</div>
          <Eyebrow>Student ID · {student.id}</Eyebrow>
          <h3>{copy?.title}</h3>
          <p>{copy?.text}</p>
          <Button onClick={onClose}>
            {result.type === "success" ? "Proceed to dining line" : "Close"}
          </Button>
        </div>
      )}
    </Modal>
  )
}

export default function StudentPortal({
  session,
  claim,
  onScan,
  onSwitch,
}: StudentPortalProps) {
  const [section, setSection] = useState<"today" | "menu">("today")
  const [scannerOpen, setScannerOpen] = useState(false)
  const [dayIndex, setDayIndex] = useState(0)
  const [period, setPeriod] = useState<MealPeriod>("Lunch")
  const [hostel, setHostel] = useState<"BH-2" | "BH-3">("BH-2")

  // Feedback state
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(initialFeedbacks)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  const currentMenu =
    menuDays[dayIndex]?.meals?.[period] || menuDays[0].meals.Lunch
  const sessionActive =
    session?.status === "active" &&
    session.expiresAt > Date.now() &&
    session.startsAt <= Date.now()

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    const newFeedback: FeedbackItem = {
      id: Date.now(),
      roll: student.id,
      name: student.name,
      rating,
      comment: comment.trim(),
      meal: "Lunch",
      timeAgo: "Just now",
    }

    setFeedbacks([newFeedback, ...feedbacks])
    setComment("")
    setFeedbackSubmitted(true)
    submitFeedback({
      roll: student.id,
      rating,
      comment: comment.trim(),
      meal: "Lunch",
    })
  }

  return (
    <div className="student-app">
      <header className="student-header">
        <Brand />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="segmented-control" style={{ padding: 2 }}>
            <button
              className={hostel === "BH-2" ? "is-active" : ""}
              onClick={() => setHostel("BH-2")}
              style={{ padding: "4px 10px", fontSize: 11 }}
            >
              BH-2
            </button>
            <button
              className={hostel === "BH-3" ? "is-active" : ""}
              onClick={() => setHostel("BH-3")}
              style={{ padding: "4px 10px", fontSize: 11 }}
            >
              BH-3
            </button>
          </div>
          <button className="profile-button" onClick={onSwitch}>
            <span>TG</span>
            <span className="profile-copy">
              <strong>{student.name}</strong>
              <small>{hostel} · Switch workspace</small>
            </span>
          </button>
        </div>
      </header>

      <main className="student-main">
        {section === "today" ? (
          <>
            <section className="student-intro">
              <div>
                <Eyebrow>Thursday · 12 June · {hostel}</Eyebrow>
                <h1>Lunch service</h1>
                <p>Real-time meal pass, occupancy tracking, and chef's menu.</p>
              </div>
              <div className="service-pill">
                <span className={sessionActive ? "pulse-dot" : "quiet-dot"} />
                {sessionActive ? "Lunch service live" : "Session not started"}
              </div>
            </section>

            <section className="student-hero-grid">
              <article className="meal-pass-card">
                <div className="meal-pass-top">
                  <div>
                    <Eyebrow>Digital Meal Pass</Eyebrow>
                    <h2>{claim ? "Lunch recorded" : "Meal access status"}</h2>
                  </div>
                  <QrCode size={30} />
                </div>
                <div className="meal-pass-time">
                  <Clock3 size={18} />
                  <span>12:30 – 14:30</span>
                </div>
                <p>
                  {claim
                    ? `Verified at ${formatTime(claim.claimedAt)}. Rescanning will confirm your previous claim.`
                    : sessionActive
                      ? "Scan the counter QR code at the dining hall entrance to claim entry."
                      : "The dining supervisor will activate the counter QR code at service opening."}
                </p>
                <Button
                  variant={claim ? "secondary" : "primary"}
                  icon={claim ? <Check size={18} /> : <ScanLine size={18} />}
                  onClick={() => setScannerOpen(true)}
                >
                  {claim ? "View claim pass" : "Scan meal QR"}
                </Button>
                <span className="card-serial">
                  MESA / {student.id} / LUNCH / {hostel}
                </span>
              </article>

              <article className="occupancy-card">
                <div className="card-heading">
                  <div>
                    <Eyebrow>{hostel} Dining Floor</Eyebrow>
                    <h2>Moderate occupancy</h2>
                  </div>
                  <StatusChip tone="good">Live</StatusChip>
                </div>
                <div className="occupancy-figure">
                  <strong>62%</strong>
                  <span>310 of 500 seats</span>
                </div>
                <div className="capacity-track">
                  <span style={{ width: "62%" }} />
                </div>
                <div className="occupancy-meta">
                  <span>
                    <Clock3 size={16} /> ~4 min queue wait
                  </span>
                  <span>
                    <Sparkles size={16} /> Optimal arrival after 1:40 PM
                  </span>
                </div>
              </article>
            </section>

            <section className="today-menu">
              <div className="section-heading">
                <div>
                  <Eyebrow>Chef’s selection</Eyebrow>
                  <h2>Today’s lunch</h2>
                </div>
                <button
                  className="text-button"
                  onClick={() => setSection("menu")}
                >
                  Full weekly schedule <ArrowLeft size={16} className="arrow-forward" />
                </button>
              </div>
              <div className="menu-feature">
                <div className="menu-visual">
                  <ChefHat size={34} />
                  <span>05</span>
                  <small>crafted items</small>
                </div>
                <div className="menu-list">
                  {menuDays[0].meals.Lunch.items.map((item, index) => (
                    <div key={item}>
                      <span>0{index + 1}</span>
                      <strong>{item}</strong>
                    </div>
                  ))}
                </div>
                <div className="dietary-note">
                  <StatusChip tone="good">Pure Vegetarian</StatusChip>
                  <p>Prepared in accordance with institutional dietary guidelines.</p>
                </div>
              </div>
            </section>

            {/* Meal Feedback & Rating Section */}
            <section className="feedback-section">
              <div className="section-heading" style={{ marginBottom: 12 }}>
                <div>
                  <Eyebrow>Quality Telemetry</Eyebrow>
                  <h2 style={{ fontSize: 20 }}>Rate today's meal</h2>
                </div>
                {feedbackSubmitted && (
                  <StatusChip tone="good">Feedback recorded</StatusChip>
                )}
              </div>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 12px" }}>
                Student reviews directly inform procurement quantities and chef preparation adjustments.
              </p>

              <form onSubmit={handleFeedbackSubmit}>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`star-btn ${s <= rating ? "is-filled" : ""}`}
                      onClick={() => setRating(s)}
                      aria-label={`Rate ${s} stars`}
                    >
                      <Star size={24} fill={s <= rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                  <span style={{ fontSize: 12, marginLeft: 8, alignSelf: "center", fontWeight: 600 }}>
                    {rating === 5 ? "Exceptional" : rating === 4 ? "Very Good" : rating === 3 ? "Satisfactory" : "Needs Improvement"}
                  </span>
                </div>

                <div className="feedback-input-row">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share feedback on preparation, portion, temperature, or service..."
                  />
                  <Button type="submit" icon={<Send size={16} />}>
                    Submit
                  </Button>
                </div>
              </form>

              <div className="feedback-stream">
                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                  Recent Student Feedback
                </span>
                {feedbacks.slice(0, 3).map((f) => (
                  <div key={f.id} className="feedback-stream-item">
                    <div>
                      <strong>{f.comment}</strong>
                      <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>
                        {f.name} · {f.meal} · {f.timeAgo}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 2, color: "#c99c37" }}>
                      {[...Array(f.rating)].map((_, i) => (
                        <Star key={i} size={12} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="menu-page">
            <div className="student-intro">
              <div>
                <Eyebrow>{hostel} dining roster</Eyebrow>
                <h1>Weekly menu</h1>
                <p>Complete weekly meal schedule, dietary categorizations, and allergens.</p>
              </div>
            </div>
            <div className="day-tabs">
              {menuDays.map((day, index) => (
                <button
                  key={day.date}
                  className={dayIndex === index ? "is-active" : ""}
                  onClick={() => setDayIndex(index)}
                >
                  <strong>{day.day}</strong>
                  <span>{day.date}</span>
                </button>
              ))}
            </div>
            <SegmentedControl
              items={mealPeriods}
              value={period}
              onChange={setPeriod}
            />
            <article className="menu-detail-card">
              <div className="menu-detail-head">
                <div>
                  <Eyebrow>
                    {menuDays[dayIndex].day} · {currentMenu.time}
                  </Eyebrow>
                  <h2>{period}</h2>
                </div>
                <Utensils size={26} />
              </div>
              <div className="dish-grid">
                {currentMenu.items.map((item, index) => (
                  <div className="dish-item" key={item}>
                    <span>0{index + 1}</span>
                    <strong>{item}</strong>
                  </div>
                ))}
              </div>
              <div className="menu-detail-foot">
                <div>
                  {currentMenu.tags.map((tag) => (
                    <StatusChip key={tag} tone="good">
                      {tag}
                    </StatusChip>
                  ))}
                </div>
                <p>
                  {currentMenu.allergen
                    ? `Allergens: ${currentMenu.allergen}`
                    : "No major allergens declared"}
                </p>
              </div>
            </article>
          </section>
        )}
      </main>

      <nav className="student-nav" aria-label="Student navigation">
        <button
          className={section === "today" ? "is-active" : ""}
          onClick={() => setSection("today")}
        >
          <Users size={19} />
          <span>Today</span>
        </button>
        <button
          className={section === "menu" ? "is-active" : ""}
          onClick={() => setSection("menu")}
        >
          <CalendarDays size={19} />
          <span>Menu</span>
        </button>
      </nav>

      {scannerOpen && (
        <ScanModal
          session={session}
          onScan={onScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  )
}
