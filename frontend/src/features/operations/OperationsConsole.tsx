import { useEffect, useMemo, useState } from "react"
import { fetchForecast, fetchProcurement } from "../../services/api"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CalendarDays,
  Check,
  ChevronDown,
  CircleGauge,
  Clock3,
  Download,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Maximize2,
  Menu,
  PackageCheck,
  QrCode,
  RefreshCcw,
  Settings2,
  ShoppingBasket,
  Sigma,
  Sparkles,
  Trash2,
  Users,
  Utensils,
  X,
  Zap,
} from "lucide-react"
import {
  baselineCheckIns,
  demandPoints,
  initialStaffing,
  inventory,
  researchBenchmarks,
  researchPlots,
  wasteTrend,
} from "../../data/demoData"
import type {
  MealClaim,
  MealSession,
  ResearchPlot,
  StaffingItem,
} from "../../types"
import {
  Brand,
  Button,
  Eyebrow,
  Metric,
  Modal,
  StatusChip,
} from "../../components/UI"
import { QRCode } from "../../components/QRCode"

type Section =
  | "overview"
  | "forecast"
  | "procurement"
  | "staffing"
  | "waste"
  | "research"

type OperationsProps = {
  session: MealSession | null
  claims: MealClaim[]
  onGenerateSession: () => void
  onEndSession: () => void
  onSwitch: () => void
}

const navItems: {
  id: Section
  label: string
  icon: typeof LayoutDashboard
}[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "forecast", label: "Forecast & Simulator", icon: BarChart3 },
  { id: "procurement", label: "Procurement", icon: ShoppingBasket },
  { id: "staffing", label: "Staffing & service", icon: Users },
  { id: "waste", label: "Waste & efficiency", icon: Trash2 },
  { id: "research", label: "Research & Benchmarks", icon: GraduationCap },
]

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp)
}

function DemandChart({ adjustment = 0 }: { adjustment?: number }) {
  const width = 620
  const height = 190
  const max = 340
  const path = (key: "forecast" | "actual") =>
    demandPoints
      .map((point, index) => {
        const rawValue =
          key === "forecast" ? point[key] * (1 + adjustment / 100) : point[key]
        const value = Math.max(0, rawValue)
        const x = (index / (demandPoints.length - 1)) * width
        const y = Math.max(12, Math.min(height - 12, height - (value / max) * (height - 24) - 12))
        return `${index === 0 ? "M" : "L"} ${x} ${y}`
      })
      .join(" ")

  return (
    <div className="demand-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Forecast versus actual lunch demand"
      >
        <defs>
          <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity=".22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((line) => (
          <line
            key={line}
            x1="0"
            y1={height * line}
            x2={width}
            y2={height * line}
            className="chart-grid"
          />
        ))}
        <path
          d={`${path("forecast")} L ${width} ${height} L 0 ${height} Z`}
          className="chart-area"
        />
        <path d={path("forecast")} className="chart-line chart-forecast" />
        <path d={path("actual")} className="chart-line chart-actual" />
      </svg>
      <div className="chart-labels">
        {demandPoints.map((point) => (
          <span key={point.time}>{point.time}</span>
        ))}
      </div>
    </div>
  )
}

function SessionModal({
  session,
  claimCount,
  onClose,
  onEnd,
}: {
  session: MealSession
  claimCount: number
  onClose: () => void
  onEnd: () => void
}) {
  const [confirmEnd, setConfirmEnd] = useState(false)
  const minutesRemaining = Math.max(
    0,
    Math.round((session.expiresAt - Date.now()) / 60000),
  )
  const active = session.status === "active" && minutesRemaining > 0

  return (
    <Modal title="Dining Counter QR Display" onClose={onClose} wide>
      <div className="session-presentation">
        <div className="session-qr-column">
          <div className="qr-frame">
            <QRCode />
          </div>
          <p>Display at the dining hall entrance turnstile</p>
        </div>
        <div className="session-details">
          <StatusChip tone={active ? "good" : "danger"}>
            {active ? "Counter Session Live" : "Session Ended"}
          </StatusChip>
          <h3>
            {active
              ? `${minutesRemaining} minutes remaining in window`
              : "No longer accepting student scans"}
          </h3>
          <p>
            Valid today from {formatTime(session.startsAt)} to{" "}
            {formatTime(session.expiresAt)} for lunch service.
          </p>
          <div className="session-stat-grid">
            <div>
              <span>Unique check-ins</span>
              <strong>{claimCount}</strong>
            </div>
            <div>
              <span>Session ID</span>
              <strong>{session.id}</strong>
            </div>
          </div>
          {active && !confirmEnd && (
            <Button
              variant="danger"
              icon={<X size={17} />}
              onClick={() => setConfirmEnd(true)}
            >
              End session early
            </Button>
          )}
          {confirmEnd && (
            <div className="end-confirm">
              <p>
                New student scans will be immediately rejected. Recorded swipes
                are safely preserved.
              </p>
              <div>
                <Button variant="ghost" onClick={() => setConfirmEnd(false)}>
                  Keep live
                </Button>
                <Button variant="danger" onClick={onEnd}>
                  End now
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

function Overview({
  session,
  claimCount,
  onGenerate,
  onViewSession,
}: {
  session: MealSession | null
  claimCount: number
  onGenerate: () => void
  onViewSession: () => void
}) {
  const checkIns = baselineCheckIns + claimCount
  const sessionActive =
    session?.status === "active" && session.expiresAt > Date.now()

  return (
    <>
      <div className="page-title-row">
        <div>
          <Eyebrow>Operations command</Eyebrow>
          <h1>Lunch service overview</h1>
          <p>Real-time demand tracking, turnstile telemetry, and active operational alerts.</p>
        </div>
        <div className="period-select">
          <CalendarDays size={17} />
          <span>Thu, 12 June</span>
          <span className="period-divider" />
          <strong>Lunch (BH-2 / BH-3)</strong>
          <ChevronDown size={16} />
        </div>
      </div>

      <section className="metric-grid">
        <Metric label="Forecast covers" value="748" detail="96.4% confidence (q50)" />
        <Metric
          label="Actual check-ins"
          value={String(checkIns)}
          detail={`+${((claimCount / baselineCheckIns) * 100).toFixed(1)}% session increment`}
          accent
        />
        <Metric
          label="Current occupancy"
          value="62%"
          detail="310 / 500 dining seats"
        />
        <Metric label="Predicted waste" value="2.6%" detail="↓ 18% vs baseline" />
      </section>

      <section className="ops-primary-grid">
        <article className="ops-card demand-card">
          <div className="card-heading">
            <div>
              <Eyebrow>Demand intelligence</Eyebrow>
              <h2>Forecast vs actual turnout</h2>
            </div>
            <div className="legend">
              <span>
                <i className="legend-forecast" /> Forecast (LightGBM)
              </span>
              <span>
                <i className="legend-actual" /> Telemetry actuals
              </span>
            </div>
          </div>
          <DemandChart />
          <div className="insight-strip">
            <Sparkles size={18} />
            <p>
              <strong>Peak arrival detected at 13:28.</strong> Queue throughput
              remains well within target SLA.
            </p>
          </div>
        </article>

        <article
          className={`ops-card session-card ${
            sessionActive ? "session-live" : ""
          }`}
        >
          <div className="card-heading">
            <div>
              <Eyebrow>Turnstile telemetry</Eyebrow>
              <h2>Vendor QR session</h2>
            </div>
            <QrCode size={24} />
          </div>
          {session ? (
            <>
              <div className="session-status-visual">
                <div className="mini-qr">
                  <QRCode light />
                </div>
                <div>
                  <StatusChip tone={sessionActive ? "good" : "danger"}>
                    {sessionActive ? "Live now" : "Ended"}
                  </StatusChip>
                  <strong>
                    {sessionActive ? "2-hour service window" : "Session closed"}
                  </strong>
                  <span>
                    {formatTime(session.startsAt)} –{" "}
                    {formatTime(session.expiresAt)}
                  </span>
                </div>
              </div>
              <div className="session-card-stats">
                <span>
                  Unique scans <strong>{claimCount}</strong>
                </span>
                <span>
                  Anti-duplicate <Check size={15} />
                </span>
              </div>
              <Button variant="secondary" onClick={onViewSession}>
                View counter display
              </Button>
            </>
          ) : (
            <>
              <div className="empty-session">
                <Clock3 size={30} />
                <strong>No lunch session active</strong>
                <p>Generate one shared cryptographic code for the two-hour lunch window.</p>
              </div>
              <Button icon={<QrCode size={18} />} onClick={onGenerate}>
                Generate meal QR
              </Button>
            </>
          )}
        </article>
      </section>

      <section className="ops-lower-grid">
        <article className="ops-card">
          <div className="card-heading">
            <div>
              <Eyebrow>Dining floor</Eyebrow>
              <h2>Queue & occupancy</h2>
            </div>
            <StatusChip tone="good">Optimal</StatusChip>
          </div>
          <div className="occupancy-ring-wrap">
            <div className="occupancy-ring">
              <strong>62%</strong>
              <span>occupied</span>
            </div>
            <div className="floor-stats">
              <div>
                <span>Estimated wait</span>
                <strong>4 min</strong>
              </div>
              <div>
                <span>Throughput</span>
                <strong>5.8/min</strong>
              </div>
              <div>
                <span>Available seats</span>
                <strong>190</strong>
              </div>
            </div>
          </div>
        </article>
        <article className="ops-card alerts-card">
          <div className="card-heading">
            <div>
              <Eyebrow>Operational Attention</Eyebrow>
              <h2>Active alerts</h2>
            </div>
            <span className="alert-count">3</span>
          </div>
          <div className="alert-list">
            <div>
              <span className="alert-icon warn">
                <AlertTriangle size={17} />
              </span>
              <p>
                <strong>Fresh Paneer below safety stock</strong>
                <small>16 kg procurement gap for dinner</small>
              </p>
            </div>
            <div>
              <span className="alert-icon danger">
                <Users size={17} />
              </span>
              <p>
                <strong>Main serving line understaffed</strong>
                <small>2 staff below peak recommendation</small>
              </p>
            </div>
            <div>
              <span className="alert-icon good">
                <CircleGauge size={17} />
              </span>
              <p>
                <strong>Queue pressure easing</strong>
                <small>Down 12% following initial surge</small>
              </p>
            </div>
          </div>
        </article>
      </section>
    </>
  )
}

function Forecast() {
  const [adjustment, setAdjustment] = useState(0)
  const [event, setEvent] = useState(false)
  const [activePreset, setActivePreset] = useState("normal")
  const [liveQuantiles, setLiveQuantiles] = useState<{ q10: number; q50: number; q90: number } | null>(null)

  const effectiveAdjustment = adjustment + (event ? 8 : 0)
  const projected = Math.round(748 * (1 + effectiveAdjustment / 100))

  useEffect(() => {
    let active = true
    const params = {
      date: new Date().toISOString().split("T")[0],
      hostel: "BH-2",
      slot: "lunch",
      academic_phase: activePreset === "exam" ? "Mid-Sem Exam" : "Normal",
      is_rainy: activePreset === "rain",
      festival_factor: activePreset === "diwali" ? 0.9 : 0.0,
      is_special: event
    }
    fetchForecast(params).then((res) => {
      if (active && res && res.q50) {
        const scale = 748 / 300
        setLiveQuantiles({
          q10: Math.round(res.q10 * scale * (1 + adjustment / 100)),
          q50: Math.round(res.q50 * scale * (1 + adjustment / 100)),
          q90: Math.round(res.q90 * scale * (1 + adjustment / 100))
        })
      }
    }).catch(() => {})
    return () => { active = false }
  }, [activePreset, adjustment, event])

  // Quantile bounds derived from empirical ratios or live backend forecast
  const q10 = liveQuantiles?.q10 ?? Math.round(projected * 0.88)
  const q50 = liveQuantiles?.q50 ?? projected
  const q90 = liveQuantiles?.q90 ?? Math.round(projected * 1.12)

  const applyPreset = (preset: string) => {
    setActivePreset(preset)
    if (preset === "exam") {
      setAdjustment(15)
      setEvent(false)
    } else if (preset === "diwali") {
      setAdjustment(-75)
      setEvent(false)
    } else if (preset === "rain") {
      setAdjustment(-10)
      setEvent(false)
    } else if (preset === "normal") {
      setAdjustment(0)
      setEvent(false)
    }
  }

  return (
    <>
      <div className="page-title-row">
        <div>
          <Eyebrow>Planning intelligence</Eyebrow>
          <h1>Service demand planning & simulator</h1>
          <p>
            Evaluate quantile regression bounds (q10, q50, q90) and simulate non-stationary institutional shocks.
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<RefreshCcw size={16} />}
          onClick={() => {
            setAdjustment(0)
            setEvent(false)
            setActivePreset("normal")
          }}
        >
          Reset baseline
        </Button>
      </div>

      {/* Quantile Output Row */}
      <section className="quantile-row">
        <div className="quantile-card">
          <span>q10 · Lower Bound</span>
          <strong>{q10} covers</strong>
          <small>10th percentile conservative attendance</small>
        </div>
        <div className="quantile-card quantile-accent">
          <span>q50 · Median Target</span>
          <strong>{q50} covers</strong>
          <small>Expected attendance for standard cooking</small>
        </div>
        <div className="quantile-card">
          <span>q90 · Safety Buffer</span>
          <strong>{q90} covers</strong>
          <small>Zero-shortage guaranteed procurement ceiling</small>
        </div>
      </section>

      <section className="scenario-layout">
        <article className="ops-card scenario-controls">
          <Eyebrow>Simulation Presets</Eyebrow>
          <h2>Institutional Scenarios</h2>

          <div className="preset-grid">
            <button
              className={`preset-chip ${activePreset === "normal" ? "is-active" : ""}`}
              onClick={() => applyPreset("normal")}
            >
              <strong>Normal Weekday</strong>
              <small>Standard term attendance</small>
            </button>
            <button
              className={`preset-chip ${activePreset === "exam" ? "is-active" : ""}`}
              onClick={() => applyPreset("exam")}
            >
              <strong>Mid-Sem Exam Rush</strong>
              <small>+15% high presence surge</small>
            </button>
            <button
              className={`preset-chip ${activePreset === "diwali" ? "is-active" : ""}`}
              onClick={() => applyPreset("diwali")}
            >
              <strong>Diwali Hawkes Exodus</strong>
              <small>-75% mass departure collapse</small>
            </button>
            <button
              className={`preset-chip ${activePreset === "rain" ? "is-active" : ""}`}
              onClick={() => applyPreset("rain")}
            >
              <strong>Monsoon Rainstorm</strong>
              <small>-10% morning dip</small>
            </button>
          </div>

          <div className="range-header" style={{ marginTop: 20 }}>
            <span>Manual adjustment</span>
            <strong>
              {adjustment > 0 ? "+" : ""}
              {adjustment}%
            </strong>
          </div>
          <input
            aria-label="Attendance adjustment"
            type="range"
            min="-80"
            max="30"
            step="5"
            value={adjustment}
            onChange={(event) => {
              setAdjustment(Number(event.target.value))
              setActivePreset("custom")
            }}
          />
          <div className="range-bounds">
            <span>−80% (Break)</span>
            <span>Baseline</span>
            <span>+30% (Exam Surge)</span>
          </div>
          <label className="toggle-row" style={{ marginTop: 14 }}>
            <span>
              <strong>Campus Tech Event (Aparoksha)</strong>
              <small>Adds an 8% attendance uplift</small>
            </span>
            <input
              type="checkbox"
              checked={event}
              onChange={(e) => setEvent(e.target.checked)}
            />
            <i />
          </label>
        </article>

        <article className="ops-card scenario-chart">
          <div className="card-heading">
            <div>
              <Eyebrow>Thursday · Lunch</Eyebrow>
              <h2>Adjusted Demand Curve</h2>
            </div>
            <StatusChip tone={Math.abs(effectiveAdjustment) > 10 ? "warn" : "good"}>
              {effectiveAdjustment === 0 ? "Baseline Plan" : "Simulated Scenario"}
            </StatusChip>
          </div>
          <DemandChart adjustment={effectiveAdjustment} />
          <div className="derived-plan">
            <div>
              <Boxes size={19} />
              <span>Derived Raw Supply</span>
              <strong>
                {Math.round(292 * (1 + effectiveAdjustment / 100))} kg
              </strong>
            </div>
            <div>
              <Users size={19} />
              <span>Recommended Team</span>
              <strong>
                {effectiveAdjustment > 10 ? 23 : effectiveAdjustment < -30 ? 12 : 20} staff
              </strong>
            </div>
            <div>
              <Clock3 size={19} />
              <span>Expected Peak</span>
              <strong>13:15 – 13:45</strong>
            </div>
          </div>
        </article>
      </section>
    </>
  )
}

function Procurement() {
  const [filter, setFilter] = useState<"All" | "Shortage" | "Adequate">("All")
  const [review, setReview] = useState(false)
  const [ordered, setOrdered] = useState(false)
  const visible = inventory.filter((item) => {
    if (filter === "Shortage") return item.stock < item.required
    if (filter === "Adequate") return item.stock >= item.required
    return true
  })
  const shortages = inventory.filter((item) => item.stock < item.required)

  return (
    <>
      <div className="page-title-row">
        <div>
          <Eyebrow>Supply chain optimization</Eyebrow>
          <h1>Procurement requirements</h1>
          <p>
            Forecast-driven raw material inventory balance preventing institutional shortages.
          </p>
        </div>
        <Button
          icon={<PackageCheck size={17} />}
          onClick={() => setReview(true)}
          disabled={ordered}
        >
          {ordered ? "Order dispatched" : "Prepare PO order"}
        </Button>
      </div>
      <section className="procurement-summary">
        <Metric
          label="Required today"
          value="413 kg"
          detail="Across 7 essential categories"
        />
        <Metric label="In store stock" value="357 kg" detail="86.4% stock coverage" />
        <Metric
          label="To purchase"
          value="56 kg"
          detail="3 shortage line items"
          accent
        />
      </section>
      <article className="ops-card table-card">
        <div className="card-heading">
          <div>
            <Eyebrow>Live store inventory</Eyebrow>
            <h2>Ingredient requirements</h2>
          </div>
          <div className="filter-pills">
            {(["All", "Shortage", "Adequate"] as const).map((item) => (
              <button
                key={item}
                className={filter === item ? "is-active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Required</th>
                <th>In stock</th>
                <th>Suggested purchase</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const gap = Math.max(0, item.required - item.stock)
                return (
                  <tr key={item.name}>
                    <td>
                      <strong>{item.name}</strong>
                      <small>{item.category}</small>
                    </td>
                    <td>
                      {item.required} {item.unit}
                    </td>
                    <td>
                      {item.stock} {item.unit}
                    </td>
                    <td>
                      <strong>
                        {gap || "—"} {gap ? item.unit : ""}
                      </strong>
                    </td>
                    <td>
                      <StatusChip tone={gap ? "warn" : "good"}>
                        {gap ? "Shortage" : "Covered"}
                      </StatusChip>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </article>
      {review && (
        <Modal
          title="Review Vendor Purchase Order"
          onClose={() => setReview(false)}
        >
          <div className="order-review">
            <p>
              Generated using quantile q75 buffer against tomorrow's anticipated menu.
            </p>
            {shortages.map((item) => (
              <div key={item.name} style={{ display: "flex", justifyContent: "space-between", margin: "6px 0" }}>
                <span>{item.name}</span>
                <strong>
                  {item.required - item.stock} {item.unit}
                </strong>
              </div>
            ))}
            <div className="order-total" style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 12 }}>
              <span>Total Estimated PO</span>
              <strong>₹18,460</strong>
            </div>
            <Button
              icon={<Check size={17} />}
              onClick={() => {
                setOrdered(true)
                setReview(false)
              }}
              style={{ marginTop: 16, width: "100%" }}
            >
              Confirm Purchase Dispatch
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

function Staffing() {
  const [staff, setStaff] = useState<StaffingItem[]>(initialStaffing)
  const [pool, setPool] = useState(3)
  const update = (index: number, delta: number) => {
    if (delta > 0 && pool === 0) return
    setStaff((current) =>
      current.map((item, i) =>
        i === index
          ? { ...item, assigned: Math.max(0, item.assigned + delta) }
          : item,
      ),
    )
    setPool((current) => current - delta)
  }

  return (
    <>
      <div className="page-title-row">
        <div>
          <Eyebrow>Human resources & line balancing</Eyebrow>
          <h1>Staffing allocation</h1>
          <p>Station headcount allocation aligned to queue arrival velocity.</p>
        </div>
        <div className="available-pool">
          <Users size={18} />
          <span>Available buffer pool</span>
          <strong>{pool} workers</strong>
        </div>
      </div>
      <section className="staff-layout">
        <article className="ops-card">
          <div className="card-heading">
            <div>
              <Eyebrow>Lunch shift deployment</Eyebrow>
              <h2>Station coverage</h2>
            </div>
            <StatusChip
              tone={
                staff.some((s) => s.assigned < s.recommended) ? "warn" : "good"
              }
            >
              {staff.some((s) => s.assigned < s.recommended)
                ? "Gaps Remain"
                : "Fully Covered"}
            </StatusChip>
          </div>
          <div className="staff-list">
            {staff.map((item, index) => {
              const gap = item.recommended - item.assigned
              return (
                <div className="staff-row" key={item.station}>
                  <div>
                    <strong>{item.station}</strong>
                    <span>{gap > 0 ? `${gap} below recommended` : "Optimal staffing"}</span>
                  </div>
                  <div className="staff-stepper">
                    <button
                      aria-label={`Remove staff from ${item.station}`}
                      onClick={() => update(index, -1)}
                      disabled={item.assigned === 0}
                    >
                      −
                    </button>
                    <strong>
                      {item.assigned}
                      <small> / {item.recommended}</small>
                    </strong>
                    <button
                      aria-label={`Add staff to ${item.station}`}
                      onClick={() => update(index, 1)}
                      disabled={pool === 0}
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </article>
        <article className="ops-card pressure-card">
          <div className="card-heading">
            <div>
              <Eyebrow>Live turnstile velocity</Eyebrow>
              <h2>Queue pressure timeline</h2>
            </div>
            <StatusChip tone="good">Optimal Pace</StatusChip>
          </div>
          <div className="pressure-bars">
            {[58, 72, 88, 76, 62, 48, 34].map((height, index) => (
              <div key={index}>
                <span style={{ height: `${height}%` }} />
                <small>{12 + index * 0.25}:00</small>
              </div>
            ))}
          </div>
          <div className="throughput-highlight">
            <CircleGauge size={25} />
            <div>
              <span>Current serving throughput</span>
              <strong>5.8 students / min</strong>
            </div>
            <ArrowDownRight size={20} />
          </div>
        </article>
      </section>
    </>
  )
}

function Waste() {
  const max = Math.max(...wasteTrend.map((day) => day.waste))
  return (
    <>
      <div className="page-title-row">
        <div>
          <Eyebrow>Sustainability ledger</Eyebrow>
          <h1>Waste performance & recovery</h1>
          <p>
            Continuous audit of prepared, served, and residual kitchen surplus.
          </p>
        </div>
        <StatusChip tone="good">18% waste reduction</StatusChip>
      </div>
      <section className="metric-grid waste-metrics">
        <Metric
          label="Waste today"
          value="19 kg"
          detail="2.6% of prepared volume"
          accent
        />
        <Metric
          label="Avoided this week"
          value="54 kg"
          detail="vs heuristic guessing"
        />
        <Metric label="Monthly saving" value="₹12,800" detail="Cost avoided" />
        <Metric label="Model accuracy" value="96.4%" detail="+2.1 points gained" />
      </section>
      <section className="waste-layout">
        <article className="ops-card waste-chart-card">
          <div className="card-heading">
            <div>
              <Eyebrow>Five-day audit</Eyebrow>
              <h2>Residual waste trend (kg)</h2>
            </div>
            <div className="trend-badge">
              <ArrowDownRight size={16} /> −56%
            </div>
          </div>
          <div className="waste-bars">
            {wasteTrend.map((day) => (
              <div key={day.day} className="waste-day">
                <div className="waste-bar-track">
                  <span style={{ height: `${(day.waste / max) * 100}%` }}>
                    <i>{day.waste}</i>
                  </span>
                </div>
                <strong>{day.day}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="ops-card">
          <div className="card-heading">
            <div>
              <Eyebrow>Preparation balance</Eyebrow>
              <h2>Kitchen food utilization</h2>
            </div>
            <Utensils size={23} />
          </div>
          <div className="balance-figure">
            <strong>97.4%</strong>
            <span>of prepared food consumed</span>
          </div>
          <div className="balance-track">
            <span />
          </div>
          <div className="balance-list">
            <div>
              <span>Prepared</span>
              <strong>746 kg</strong>
            </div>
            <div>
              <span>Served</span>
              <strong>727 kg</strong>
            </div>
            <div>
              <span>Remaining</span>
              <strong>19 kg</strong>
            </div>
          </div>
          <div className="insight-strip">
            <Sparkles size={18} />
            <p>Rice and breads account for 61% of remaining surplus volume.</p>
          </div>
        </article>
      </section>
    </>
  )
}

function Research() {
  const [activePlot, setActivePlot] = useState<ResearchPlot | null>(null)

  return (
    <>
      <div className="page-title-row">
        <div>
          <Eyebrow>IIIT Allahabad ECE Minor Project</Eyebrow>
          <h1>Research & Empirical Benchmarks</h1>
          <p>
            Rigorous mathematical modeling benchmarking LightGBM against classical time-series models across 11,718 events.
          </p>
        </div>
        <a
          href="/MinorProject_Presentation.pptx"
          download="MinorProject_Presentation.pptx"
          className="button button-primary"
          style={{ textDecoration: "none" }}
        >
          <Download size={16} />
          <span>Presentation Deck (.pptx)</span>
        </a>
      </div>

      {/* Model Benchmark Table */}
      <article className="ops-card table-card">
        <div className="card-heading">
          <div>
            <Eyebrow>Empirical Comparison</Eyebrow>
            <h2>Model Evaluation Leaderboard</h2>
          </div>
          <StatusChip tone="good">72.4% PICP Coverage</StatusChip>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model Architecture</th>
                <th>MAE</th>
                <th>RMSE</th>
                <th>MAPE</th>
                <th>WAPE</th>
                <th>PICP (80%)</th>
                <th>Inference</th>
                <th>Classification</th>
              </tr>
            </thead>
            <tbody>
              {researchBenchmarks.map((b) => (
                <tr key={b.name}>
                  <td>
                    <strong>{b.name}</strong>
                    <small>{b.tag}</small>
                  </td>
                  <td><strong>{b.mae}</strong></td>
                  <td>{b.rmse}</td>
                  <td>{b.mape}</td>
                  <td>{b.wape}</td>
                  <td>{b.picp}</td>
                  <td>{b.speed}</td>
                  <td>
                    <StatusChip
                      tone={b.tag === "Best Model" ? "good" : b.tag === "Classical" ? "warn" : "neutral"}
                    >
                      {b.tag}
                    </StatusChip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {/* Mathematical Formulations */}
      <div className="math-grid">
        <div className="math-card">
          <Eyebrow>[Hawkes 1971; Khan & Erdoğdu 2025]</Eyebrow>
          <h3>Hawkes Festival Departure Kernel</h3>
          <code>λ(t) = μ₀ + ∑ αᵢ · exp(-βᵢ · (t - tᵢ))</code>
          <p>
            Self-exciting point process captures abrupt student exodus before cultural festivals (Diwali, Holi), preventing severe over-preparation.
          </p>
        </div>

        <div className="math-card">
          <Eyebrow>[Cameron & Trivedi 2013]</Eyebrow>
          <h3>Heteroscedastic Negative Binomial Count</h3>
          <code>Y_t ~ NegBin(μ_t, α_t) | Var = μ + α·μ²</code>
          <p>
            Parameterizes quadratic variance inflation, capturing heightened student behavioral volatility during exam period transitions.
          </p>
        </div>

        <div className="math-card">
          <Eyebrow>[Koenker & Bassett 1978]</Eyebrow>
          <h3>Multi-Quantile Pinball Loss</h3>
          <code>ℒ_τ(y, ŷ) = max( τ·(y - ŷ), (1 - τ)·(ŷ - y) )</code>
          <p>
            Simultaneous quantile regression (q10, q50, q90) generates non-crossing prediction intervals without distributional assumptions.
          </p>
        </div>
      </div>

      {/* 11 Research Plots Gallery */}
      <div style={{ marginTop: 32 }}>
        <div className="card-heading" style={{ marginBottom: 12 }}>
          <div>
            <Eyebrow>Empirical Validation</Eyebrow>
            <h2 style={{ fontSize: 20 }}>Longitudinal Research Visualizations</h2>
          </div>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>Click any plot to expand</span>
        </div>

        <div className="plots-grid">
          {researchPlots.map((plot) => (
            <div
              key={plot.id}
              className="plot-card"
              onClick={() => setActivePlot(plot)}
            >
              <img src={plot.file} alt={plot.title} loading="lazy" />
              <div className="plot-card-body">
                <h4>{plot.title}</h4>
                <p>{plot.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plot Fullscreen Modal */}
      {activePlot && (
        <Modal
          title={activePlot.title}
          onClose={() => setActivePlot(null)}
          wide
        >
          <div style={{ textAlign: "center" }}>
            <img
              src={activePlot.file}
              alt={activePlot.title}
              className="plot-modal-img"
            />
            <p style={{ marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
              {activePlot.desc}
            </p>
          </div>
        </Modal>
      )}
    </>
  )
}

export default function OperationsConsole({
  session,
  claims,
  onGenerateSession,
  onEndSession,
  onSwitch,
}: OperationsProps) {
  const [section, setSection] = useState<Section>("overview")
  const [mobileNav, setMobileNav] = useState(false)
  const [sessionModal, setSessionModal] = useState(false)
  const sessionClaims = useMemo(
    () =>
      session
        ? claims.filter((claim) => claim.sessionId === session.id).length
        : 0,
    [claims, session],
  )

  const renderSection = () => {
    if (section === "forecast") return <Forecast />
    if (section === "procurement") return <Procurement />
    if (section === "staffing") return <Staffing />
    if (section === "waste") return <Waste />
    if (section === "research") return <Research />
    return (
      <Overview
        session={session}
        claimCount={sessionClaims}
        onGenerate={() => {
          onGenerateSession()
          setTimeout(() => setSessionModal(true), 0)
        }}
        onViewSession={() => setSessionModal(true)}
      />
    )
  }

  return (
    <div className="ops-app">
      <aside className={`ops-sidebar ${mobileNav ? "is-open" : ""}`}>
        <div className="sidebar-top">
          <Brand />
          <button className="mobile-close" onClick={() => setMobileNav(false)}>
            <X size={20} />
          </button>
        </div>
        <nav aria-label="Operations navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={section === item.id ? "is-active" : ""}
                onClick={() => {
                  setSection(item.id)
                  setMobileNav(false)
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {item.id === "overview" && <i />}
              </button>
            )
          })}
        </nav>
        <div className="sidebar-status">
          <div>
            <span className="pulse-dot" />
            <strong>System healthy</strong>
          </div>
          <p>Telemetry & ML engine online</p>
        </div>
        <button className="operator-profile" onClick={onSwitch}>
          <span>VK</span>
          <div>
            <strong>Varun Karankar</strong>
            <small>Operations Lead · Switch</small>
          </div>
          <Settings2 size={17} />
        </button>
      </aside>
      <div className="ops-content-shell">
        <header className="ops-mobile-header">
          <button onClick={() => setMobileNav(true)}>
            <Menu size={21} />
          </button>
          <Brand compact />
          <span>Operations Console</span>
        </header>
        <main className="ops-main">{renderSection()}</main>
      </div>
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      {sessionModal && session && (
        <SessionModal
          session={session}
          claimCount={sessionClaims}
          onClose={() => setSessionModal(false)}
          onEnd={() => {
            onEndSession()
            setSessionModal(false)
          }}
        />
      )}
    </div>
  )
}
