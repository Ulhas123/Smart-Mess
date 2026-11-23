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
  LogOut,
  Maximize2,
  Menu,
  PackageCheck,
  Play,
  RefreshCcw,
  ScanLine,
  Settings2,
  ShieldCheck,
  ShoppingBasket,
  Sigma,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  Utensils,
  X,
  Zap,
} from "lucide-react"
import {
  baselineCheckIns,
  cookingTolerances,
  demandPoints,
  testSeriesPoints,
  testSeriesLunchPoints,
  initialStaffing,
  inventory,
  newsvendorSummary,
  regimeMatrixData,
  researchBenchmarks,
  researchPlots,
  wasteTrend,
} from "../../data/demoData"
import type {
  MealClaim,
  MealSession,
  ResearchPlot,
  StaffingItem,
  VendorUser,
  TestSeriesPoint,
  IntradayDemandPoint,
} from "../../types"
import {
  Brand,
  Button,
  Eyebrow,
  Metric,
  Modal,
  StatusChip,
} from "../../components/UI"
import { WeatherWidget } from "../../components/WeatherWidget"
import PrayagrajClockBadge from "../../components/agency/PrayagrajClockBadge"
import TurnstileScanner from "./TurnstileScanner"
import AllowedStudents from "./AllowedStudents"

type Section =
  | "overview"
  | "scanner"
  | "students"
  | "forecast"
  | "procurement"
  | "staffing"
  | "waste"
  | "research"

type OperationsProps = {
  vendorUser?: VendorUser
  session: MealSession | null
  claims: MealClaim[]
  onGenerateSession: () => void
  onEndSession: () => void
  onSwitch: () => void
  onLogout?: () => void
}

const navItems: {
  id: Section
  label: string
  icon: typeof LayoutDashboard
}[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "scanner", label: "Turnstile Scanner", icon: ScanLine },
  { id: "students", label: "Allowed Students", icon: UserCheck },
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

function DemandChart({
  adjustment = 0,
  initialMode = "testWindow",
}: {
  adjustment?: number
  initialMode?: "testWindow" | "intraday"
}) {
  const [chartMode, setChartMode] = useState<"testWindow" | "intraday">(initialMode)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [seriesSlot, setSeriesSlot] = useState<"dinner" | "lunch">("dinner")

  const width = 640
  const height = 210
  const paddingX = 30
  const paddingY = 24

  const activeTestPoints = seriesSlot === "dinner" ? testSeriesPoints : testSeriesLunchPoints

  // Calculations for testWindow (21 days from holdout evaluation set)
  const maxTestVal = 340
  const testPointsCount = activeTestPoints.length

  const getTestX = (index: number) =>
    paddingX + (index / (testPointsCount - 1)) * (width - 2 * paddingX)

  const getTestY = (val: number) => {
    const clamped = Math.max(0, Math.min(maxTestVal, val))
    return height - paddingY - (clamped / maxTestVal) * (height - 2 * paddingY)
  }

  // 90% Prediction Interval polygon path (q10 to q90 uncertainty envelope)
  const piUpperPath = activeTestPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getTestX(i)} ${getTestY(p.q90)}`)
    .join(" ")
  const piLowerPath = [...activeTestPoints]
    .reverse()
    .map(
      (p, i) =>
        `L ${getTestX(testPointsCount - 1 - i)} ${getTestY(p.q10)}`,
    )
    .join(" ")
  const piPolygonPath = `${piUpperPath} ${piLowerPath} Z`

  // LightGBM point forecast line (q50) with dynamic adjustment
  const forecastTestPath = activeTestPoints
    .map((p, i) => {
      const adjustedForecast =
        adjustment !== 0
          ? Math.round(p.forecast * (1 + adjustment / 100))
          : p.forecast
      return `${i === 0 ? "M" : "L"} ${getTestX(i)} ${getTestY(adjustedForecast)}`
    })
    .join(" ")

  // Actual turnout telemetry path
  const actualTestPath = activeTestPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getTestX(i)} ${getTestY(p.actual)}`)
    .join(" ")

  // Calculations for intraday 20-min service curve
  const maxIntradayVal = 180
  const intradayCount = demandPoints.length

  const getIntraX = (index: number) =>
    paddingX + (index / (intradayCount - 1)) * (width - 2 * paddingX)

  const getIntraY = (val: number) => {
    const clamped = Math.max(0, Math.min(maxIntradayVal, val))
    return height - paddingY - (clamped / maxIntradayVal) * (height - 2 * paddingY)
  }

  // Intraday tolerance band (+/-35 pan margin around forecast)
  const intraUpper = demandPoints
    .map((p, i) => {
      const f = Math.round(p.forecast * (1 + adjustment / 100))
      return `${i === 0 ? "M" : "L"} ${getIntraX(i)} ${getIntraY(f + 35)}`
    })
    .join(" ")
  const intraLower = [...demandPoints]
    .reverse()
    .map((p, i) => {
      const f = Math.round(p.forecast * (1 + adjustment / 100))
      return `L ${getIntraX(intradayCount - 1 - i)} ${getIntraY(Math.max(0, f - 35))}`
    })
    .join(" ")
  const intraTolPolygon = `${intraUpper} ${intraLower} Z`

  const forecastIntraPath = demandPoints
    .map((p, i) => {
      const f = Math.round(p.forecast * (1 + adjustment / 100))
      return `${i === 0 ? "M" : "L"} ${getIntraX(i)} ${getIntraY(f)}`
    })
    .join(" ")

  const actualIntraPath = demandPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getIntraX(i)} ${getIntraY(p.actual)}`)
    .join(" ")

  const activeHoverTest =
    hoveredIdx !== null && chartMode === "testWindow"
      ? activeTestPoints[hoveredIdx]
      : null
  const activeHoverIntra =
    hoveredIdx !== null && chartMode === "intraday"
      ? demandPoints[hoveredIdx]
      : null

  return (
    <div className="demand-chart-container" style={{ width: "100%", marginTop: 16 }}>
      {/* Chart Control Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            background: "rgba(255,255,255,0.05)",
            padding: 3,
            borderRadius: 8,
            border: "1px solid var(--line)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setChartMode("testWindow")
              setHoveredIdx(null)
            }}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              background:
                chartMode === "testWindow" ? "var(--emerald)" : "transparent",
              color: chartMode === "testWindow" ? "#000" : "var(--muted)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            3-Week Test Window (Plot 7 · 612 Holdout Meals)
          </button>
          <button
            type="button"
            onClick={() => {
              setChartMode("intraday")
              setHoveredIdx(null)
            }}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              background:
                chartMode === "intraday" ? "var(--emerald)" : "transparent",
              color: chartMode === "intraday" ? "#000" : "var(--muted)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Intraday Service Dynamics (20-min Telemetry)
          </button>
        </div>

        {chartMode === "testWindow" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Slot:</span>
            <select
              value={seriesSlot}
              onChange={(e) => setSeriesSlot(e.target.value as any)}
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line)",
                color: "var(--foreground)",
                padding: "4px 8px",
                borderRadius: 6,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              <option value="dinner">BH-2 Dinner (Plot 7 Ground Truth · 28.0% WAPE)</option>
              <option value="lunch">BH-2 Lunch (36.2% WAPE)</option>
            </select>
          </div>
        )}
      </div>

      {/* SVG Canvas Viewport */}
      <div
        style={{
          position: "relative",
          width: "100%",
          overflow: "hidden",
          background: "rgba(0,0,0,0.25)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "10px 0",
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          role="img"
          aria-label="Forecast versus real actual attendance trajectory"
        >
          <defs>
            <linearGradient id="pi90Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="panTolGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
            <line
              key={ratio}
              x1={paddingX}
              y1={height * ratio}
              x2={width - paddingX}
              y2={height * ratio}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeDasharray="3 3"
            />
          ))}

          {chartMode === "testWindow" ? (
            <>
              {/* 90% Prediction Interval Shaded Envelope */}
              <path d={piPolygonPath} fill="url(#pi90Grad)" />

              {/* LightGBM Forecast Line (q50) */}
              <path
                d={forecastTestPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Actual Headcount Line */}
              <path
                d={actualTestPath}
                fill="none"
                stroke="#d4af37"
                strokeWidth="1.8"
                strokeDasharray="4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points for Actual */}
              {activeTestPoints.map((p, idx) => {
                const cx = getTestX(idx)
                const cy = getTestY(p.actual)
                const isHovered = hoveredIdx === idx
                return (
                  <circle
                    key={p.date}
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : 3.5}
                    fill={isHovered ? "#fff" : "#d4af37"}
                    stroke="#09090b"
                    strokeWidth="1.5"
                    style={{ cursor: "pointer", transition: "r 0.15s ease" }}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                )
              })}
            </>
          ) : (
            <>
              {/* Commercial +/-35 Pan Margin Shaded Envelope */}
              <path d={intraTolPolygon} fill="url(#panTolGrad)" />

              {/* Forecast Line */}
              <path
                d={forecastIntraPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Actual Line */}
              <path
                d={actualIntraPath}
                fill="none"
                stroke="#d4af37"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />

              {/* Intraday actual markers */}
              {demandPoints.map((p, idx) => {
                const cx = getIntraX(idx)
                const cy = getIntraY(p.actual)
                const isHovered = hoveredIdx === idx
                return (
                  <circle
                    key={p.time}
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : 4}
                    fill={isHovered ? "#fff" : "#d4af37"}
                    stroke="#09090b"
                    strokeWidth="1.5"
                    style={{ cursor: "pointer", transition: "r 0.15s ease" }}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                )
              })}
            </>
          )}
        </svg>

        {/* Dynamic Hover HUD Tooltip */}
        {activeHoverTest && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 14,
              background: "rgba(18, 18, 20, 0.95)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 8,
              padding: "7px 12px",
              fontSize: 11,
              color: "#fff",
              backdropFilter: "blur(12px)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
              display: "flex",
              gap: 14,
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <div>
              <span style={{ color: "var(--muted)", display: "block", fontSize: 9 }}>
                {activeHoverTest.date} · {activeHoverTest.phase}
              </span>
              <strong>
                Actual: <span style={{ color: "#d4af37" }}>{activeHoverTest.actual} heads</span>
              </strong>
            </div>
            <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: 12 }}>
              <span style={{ color: "var(--muted)", display: "block", fontSize: 9 }}>
                LightGBM q50: <span style={{ color: "#10b981" }}>{activeHoverTest.forecast}</span>
              </span>
              <span style={{ color: "#94a3b8", fontSize: 10 }}>
                90% PI: [{activeHoverTest.q10}, {activeHoverTest.q90}]
              </span>
            </div>
            <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: 12, textAlign: "right" }}>
              <span style={{ color: "var(--muted)", display: "block", fontSize: 9 }}>Residual Error</span>
              <strong style={{ color: activeHoverTest.error <= 35 ? "#10b981" : "#f59e0b" }}>
                {activeHoverTest.error} heads {activeHoverTest.error <= 35 ? "✓ (±35 pan)" : "⚠ (surge)"}
              </strong>
            </div>
          </div>
        )}

        {activeHoverIntra && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 14,
              background: "rgba(18, 18, 20, 0.95)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 8,
              padding: "7px 12px",
              fontSize: 11,
              color: "#fff",
              backdropFilter: "blur(12px)",
              display: "flex",
              gap: 14,
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <div>
              <span style={{ color: "var(--muted)", display: "block", fontSize: 9 }}>
                Slot: {activeHoverIntra.time}
              </span>
              <strong>
                Actual: <span style={{ color: "#d4af37" }}>{activeHoverIntra.actual} arrivals</span>
              </strong>
            </div>
            <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: 12 }}>
              <span style={{ color: "var(--muted)", display: "block", fontSize: 9 }}>Forecast (q50)</span>
              <strong style={{ color: "#10b981" }}>
                {Math.round(activeHoverIntra.forecast * (1 + adjustment / 100))} arrivals
              </strong>
            </div>
            <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: 12, textAlign: "right" }}>
              <span style={{ color: "var(--muted)", display: "block", fontSize: 9 }}>Arrival Gap</span>
              <strong
                style={{
                  color:
                    Math.abs(
                      activeHoverIntra.actual -
                        Math.round(activeHoverIntra.forecast * (1 + adjustment / 100)),
                    ) <= 35
                      ? "#10b981"
                      : "#f59e0b",
                }}
              >
                {Math.abs(
                  activeHoverIntra.actual -
                    Math.round(activeHoverIntra.forecast * (1 + adjustment / 100)),
                )}{" "}
                heads
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* X-Axis Labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "var(--muted)",
          fontSize: 9,
          marginTop: 6,
          padding: `0 ${paddingX}px`,
        }}
      >
        {chartMode === "testWindow"
          ? activeTestPoints
              .filter((_, idx) => idx % 3 === 0 || idx === activeTestPoints.length - 1)
              .map((p) => <span key={p.date}>{p.display}</span>)
          : demandPoints.map((p) => <span key={p.time}>{p.time}</span>)}
      </div>

      {/* Legend & Rigor Status Pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid var(--line)",
          fontSize: 11,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 3, background: "#10b981", borderRadius: 2 }} />
            <span style={{ color: "var(--foreground)" }}>LightGBM Forecast (q50)</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 2, borderTop: "2px dashed #d4af37" }} />
            <span style={{ color: "var(--foreground)" }}>Actual Telemetry Check-ins</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 10,
                background: "rgba(16, 185, 129, 0.2)",
                borderRadius: 2,
                border: "1px solid rgba(16, 185, 129, 0.4)",
              }}
            />
            <span style={{ color: "var(--muted)" }}>
              {chartMode === "testWindow"
                ? "90% Prediction Interval (q10–q90)"
                : "±35 Pan Margin"}
            </span>
          </span>
        </div>

        {/* Rigor Indicators */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 10,
            fontFamily: "var(--mono)",
          }}
        >
          <span
            style={{
              background: "rgba(255,255,255,0.05)",
              padding: "2px 6px",
              borderRadius: 4,
              color: "#10b981",
            }}
          >
            WAPE: 25.95%
          </span>
          <span
            style={{
              background: "rgba(255,255,255,0.05)",
              padding: "2px 6px",
              borderRadius: 4,
              color: "#38bdf8",
            }}
          >
            MAE: 41.54 heads
          </span>
          <span
            style={{
              background: "rgba(255,255,255,0.05)",
              padding: "2px 6px",
              borderRadius: 4,
              color: "#f59e0b",
            }}
          >
            ±35 Pan: 50.33%
          </span>
        </div>
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
    <Modal title="Dining Counter Session Monitor" onClose={onClose} wide>
      <div className="session-presentation">
        <div className="session-gate-column" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 20px", background: "var(--card-bg, #f8fafc)", borderRadius: "16px", border: "1px solid var(--border-color, #e2e8f0)" }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: active ? "#ecfdf5" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: active ? "#059669" : "#dc2626", marginBottom: 16 }}>
            <ScanLine size={44} />
          </div>
          <strong style={{ fontSize: 16, color: "var(--text-primary, #0f172a)" }}>
            {active ? "Turnstiles Active" : "Gate Offline"}
          </strong>
          <p style={{ marginTop: 6, fontSize: 11, color: "var(--muted, #64748b)", textAlign: "center" }}>
            {active ? "Accepting student NFC & token verification" : "Service window inactive"}
          </p>
        </div>
        <div className="session-details">
          <StatusChip tone={active ? "good" : "danger"}>
            {active ? "Counter Session Live" : "Session Ended"}
          </StatusChip>
          <h3>
            {active
              ? `${minutesRemaining} minutes remaining in window`
              : "No longer accepting student check-ins"}
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
  onOpenScanner,
}: {
  session: MealSession | null
  claimCount: number
  onGenerate: () => void
  onViewSession: () => void
  onOpenScanner?: () => void
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onOpenScanner && (
            <Button
              variant="primary"
              icon={<ScanLine size={16} />}
              onClick={onOpenScanner}
              style={{ padding: "8px 14px", fontSize: 13 }}
            >
              Turnstile Scanner
            </Button>
          )}
          <div className="period-select">
            <CalendarDays size={17} />
            <span>Thu, 12 June</span>
            <span className="period-divider" />
            <strong>Lunch (BH-2 / BH-3)</strong>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Prominent Live Weather for Prayagraj, UP */}
      <div style={{ marginBottom: 20 }}>
        <WeatherWidget variant="card" />
      </div>

      <section className="metric-grid">
        <Metric label="Forecast covers" value="402" detail="67.0% base capacity (q50)" />
        <Metric
          label="Actual check-ins"
          value={String(checkIns)}
          detail={`+${((claimCount / baselineCheckIns) * 100).toFixed(1)}% session increment`}
          accent
        />
        <Metric
          label="Current occupancy"
          value="65%"
          detail="390 / 600 dining seats"
        />
        <Metric label="Residual waste" value="13.98%" detail="-52.1% loss vs heuristic (26.7%)" />
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
              <h2>Dining service session</h2>
            </div>
            <ScanLine size={24} />
          </div>
          {session ? (
            <>
              <div className="session-status-visual">
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: sessionActive ? "#ecfdf5" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: sessionActive ? "#059669" : "#dc2626", flexShrink: 0 }}>
                  <ScanLine size={28} />
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
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="secondary" onClick={onViewSession}>
                  Session monitor
                </Button>
                {onOpenScanner && (
                  <Button variant="primary" icon={<ScanLine size={16} />} onClick={onOpenScanner}>
                    Turnstile Scanner
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="empty-session">
                <Clock3 size={30} />
                <strong>No lunch session active</strong>
                <p>Initialize turnstile telemetry for the two-hour lunch service window.</p>
              </div>
              <Button icon={<Play size={18} />} onClick={onGenerate}>
                Open Lunch Session
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
              <strong>65%</strong>
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
                <strong>210</strong>
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
  const [selectedHostel, setSelectedHostel] = useState<"Combined" | "BH-2" | "BH-3">("Combined")
  const [selectedSlot, setSelectedSlot] = useState<"breakfast" | "lunch" | "dinner">("lunch")
  const [adjustment, setAdjustment] = useState(0)
  const [event, setEvent] = useState(false)
  const [activePreset, setActivePreset] = useState("normal")
  const [liveData, setLiveData] = useState<{
    q10: number
    q50: number
    q75: number
    q90: number
    newsvendor_procure_q: number
    capacity: number
    utilization_pct: number
    regime_classification?: { class: string; action: string; badge: string }
  } | null>(null)

  // Grounded capacities: BH-2 = 300, BH-3 = 300, Combined = 600
  const capacity = selectedHostel === "Combined" ? 600 : 300
  // Base rates from MinorProject_Final_Updated.pptx: Breakfast=0.42, Lunch=0.67, Dinner=0.76
  const baseRate = selectedSlot === "breakfast" ? 0.42 : selectedSlot === "lunch" ? 0.67 : 0.76
  const baseCovers = Math.round(capacity * baseRate)

  const effectiveAdjustment = adjustment + (event ? 4 : 0) // Special menu pull factor +4%
  const fallbackProjected = Math.round(baseCovers * (1 + effectiveAdjustment / 100))

  useEffect(() => {
    let active = true
    const params = {
      date: new Date().toISOString().split("T")[0],
      hostel: selectedHostel,
      slot: selectedSlot,
      academic_phase: activePreset === "exam" ? "Mid-Sem Exam" : "Normal",
      is_rainy: activePreset === "rain",
      festival_factor: activePreset === "diwali" ? 0.70 : 0.0,
      is_special: event,
      has_dessert: true,
      has_nonveg: selectedHostel === "BH-3" || selectedHostel === "Combined"
    }
    fetchForecast(params).then((res) => {
      if (active && res && res.q50) {
        const mult = 1 + adjustment / 100
        setLiveData({
          q10: Math.round(res.q10 * mult),
          q50: Math.round(res.q50 * mult),
          q75: Math.round(res.q75 * mult),
          q90: Math.round(res.q90 * mult),
          newsvendor_procure_q: Math.round((res.newsvendor_procure_q || (res.q50 + 0.5 * (res.q90 - res.q50))) * mult),
          capacity: res.capacity || capacity,
          utilization_pct: res.utilization_pct || Math.round((res.q50 / capacity) * 100),
          regime_classification: res.regime_classification
        })
      }
    }).catch(() => {})
    return () => { active = false }
  }, [selectedHostel, selectedSlot, activePreset, adjustment, event, capacity])

  // Quantile bounds derived from empirical ratios or live backend forecast
  const q10 = liveData?.q10 ?? Math.round(fallbackProjected * 0.85)
  const q50 = liveData?.q50 ?? fallbackProjected
  const q75 = liveData?.q75 ?? Math.round(fallbackProjected * 1.08)
  const q90 = liveData?.q90 ?? Math.round(fallbackProjected * 1.15)
  const newsvendorQ = liveData?.newsvendor_procure_q ?? Math.round(q50 + 0.5 * (q90 - q50))

  // 3-Class Regime Matrix: Dip <=90 (per 300), Normal 91-209, Surge >=210
  const dipLimit = selectedHostel === "Combined" ? 180 : 90
  const surgeLimit = selectedHostel === "Combined" ? 420 : 210
  const regimeClass = liveData?.regime_classification?.class ?? (
    q50 <= dipLimit ? "Vacation Dip" : q50 >= surgeLimit ? "Peak Surge" : "Normal Service"
  )
  const regimeAction = liveData?.regime_classification?.action ?? (
    q50 <= dipLimit
      ? "Thermal burner shutdown; halt bulk cooking (F1 72.24%, eliminate food waste)"
      : q50 >= surgeLimit
      ? "Initiate secondary steam kettle cooking (F1 56.97%, 0 False Negative Surges)"
      : "Standard single-batch staging line operation"
  )

  const applyPreset = (preset: string) => {
    setActivePreset(preset)
    if (preset === "exam") {
      setAdjustment(6) // Presentation: Exam multiplier = 1.06 (+6%)
      setEvent(false)
    } else if (preset === "diwali") {
      setAdjustment(-70) // Presentation: Hawkes shock a = 0.70 (-70%)
      setEvent(false)
    } else if (preset === "rain") {
      setAdjustment(selectedSlot === "breakfast" ? -18 : -4) // Weather multiplier: Rain breakfast 0.82 (-18%), Lunch 0.96 (-4%)
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
          <Eyebrow>Planning intelligence · Minor Project Grounded</Eyebrow>
          <h1>Service demand planning & simulator</h1>
          <p>
            Evaluate LightGBM quantile regression bounds (q10, q50, q75, q90) and simulate non-stationary institutional shocks.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <select
            value={selectedHostel}
            onChange={(e) => setSelectedHostel(e.target.value as any)}
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              color: "var(--foreground)",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <option value="Combined">Combined Mess (600 seats)</option>
            <option value="BH-2">BH-2 Pure Veg (300 seats)</option>
            <option value="BH-3">BH-3 Non-Veg (300 seats)</option>
          </select>
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value as any)}
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              color: "var(--foreground)",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            <option value="breakfast">Breakfast (42% base)</option>
            <option value="lunch">Lunch (67% base)</option>
            <option value="dinner">Dinner (76% base)</option>
          </select>
          <Button
            variant="secondary"
            icon={<RefreshCcw size={16} />}
            onClick={() => {
              setAdjustment(0)
              setEvent(false)
              setActivePreset("normal")
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Operational Regime Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: regimeClass === "Peak Surge"
            ? "rgba(239, 68, 68, 0.1)"
            : regimeClass === "Vacation Dip"
            ? "rgba(59, 130, 246, 0.1)"
            : "rgba(16, 185, 129, 0.1)",
          border: `1px solid ${
            regimeClass === "Peak Surge"
              ? "rgba(239, 68, 68, 0.3)"
              : regimeClass === "Vacation Dip"
              ? "rgba(59, 130, 246, 0.3)"
              : "rgba(16, 185, 129, 0.3)"
          }`,
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <StatusChip
            tone={regimeClass === "Peak Surge" ? "danger" : regimeClass === "Vacation Dip" ? "neutral" : "good"}
          >
            {regimeClass.toUpperCase()}
          </StatusChip>
          <div>
            <strong style={{ fontSize: 14 }}>{regimeClass}: {regimeAction}</strong>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              {regimeClass === "Peak Surge"
                ? "Surge criteria: Y ≥ 70% capacity (F1: 56.97% · 0 Critical False Negative Surges)"
                : regimeClass === "Vacation Dip"
                ? "Vacation Dip criteria: Y ≤ 30% capacity (F1: 72.24% · Halts bulk cooking)"
                : "Normal operation: 30% < Y < 70% capacity (Single-batch prep)"}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 11, color: "var(--muted)", display: "block" }}>Newsvendor Rule A Target</span>
          <strong style={{ fontSize: 16, color: "var(--foreground)" }}>{newsvendorQ} portions</strong>
        </div>
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
          <small>Expected attendance ({Math.round((q50 / capacity) * 100)}% utilization)</small>
        </div>
        <div className="quantile-card">
          <span>q75 · Asymmetric Buffer</span>
          <strong>{q75} covers</strong>
          <small>Optimal fractile (τ*=0.75, +{Math.max(0, q75 - q50)} heads)</small>
        </div>
        <div className="quantile-card">
          <span>q90 · Safety Ceiling</span>
          <strong>{q90} covers</strong>
          <small>Zero-shortage guaranteed procurement</small>
        </div>
      </section>

      <section className="scenario-layout">
        <article className="ops-card scenario-controls">
          <Eyebrow>Simulation Presets · Presentation Grounded</Eyebrow>
          <h2>Institutional Scenarios</h2>

          <div className="preset-grid">
            <button
              className={`preset-chip ${activePreset === "normal" ? "is-active" : ""}`}
              onClick={() => applyPreset("normal")}
            >
              <strong>Normal Academic Week</strong>
              <small>Regular multiplier 1.00</small>
            </button>
            <button
              className={`preset-chip ${activePreset === "exam" ? "is-active" : ""}`}
              onClick={() => applyPreset("exam")}
            >
              <strong>Mid-Sem Exam Rush</strong>
              <small>+6% Academic multiplier (1.06)</small>
            </button>
            <button
              className={`preset-chip ${activePreset === "diwali" ? "is-active" : ""}`}
              onClick={() => applyPreset("diwali")}
            >
              <strong>Diwali Hawkes Exodus</strong>
              <small>-70% Hawkes shock (a=0.70, b=2.5d)</small>
            </button>
            <button
              className={`preset-chip ${activePreset === "rain" ? "is-active" : ""}`}
              onClick={() => applyPreset("rain")}
            >
              <strong>Monsoon Rainstorm</strong>
              <small>{selectedSlot === "breakfast" ? "-18% Rain breakfast (0.82)" : "-4% Rain lunch (0.96)"}</small>
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
            min="-85"
            max="30"
            step="5"
            value={adjustment}
            onChange={(event) => {
              setAdjustment(Number(event.target.value))
              setActivePreset("custom")
            }}
          />
          <div className="range-bounds">
            <span>−85% (End-Break 0.15)</span>
            <span>Baseline</span>
            <span>+30% (Surge)</span>
          </div>
          <label className="toggle-row" style={{ marginTop: 14 }}>
            <span>
              <strong>Special Menu Feast Item</strong>
              <small>Adds a +4% special pull factor</small>
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
              <Eyebrow>{selectedHostel} · {selectedSlot.toUpperCase()}</Eyebrow>
              <h2>Adjusted Demand & Batching Strategy</h2>
            </div>
            <StatusChip tone={Math.abs(effectiveAdjustment) > 5 ? "warn" : "good"}>
              {effectiveAdjustment === 0 ? "Baseline Plan" : "Simulated Scenario"}
            </StatusChip>
          </div>
          <DemandChart adjustment={effectiveAdjustment} />
          <div className="derived-plan">
            <div>
              <Boxes size={19} />
              <span>Derived Raw Supply</span>
              <strong>
                {Math.round(q50 * 0.565)} kg
              </strong>
            </div>
            <div>
              <Users size={19} />
              <span>Recommended Team</span>
              <strong>
                {q50 > 350 ? 22 : q50 < 150 ? 10 : 16} staff
              </strong>
            </div>
            <div>
              <Clock3 size={19} />
              <span>Batch 1 Cook / Reserve</span>
              <strong>{Math.round(q50 * 0.70)} / {Math.max(0, newsvendorQ - Math.round(q50 * 0.70))}</strong>
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
          label="Buffer waste today"
          value="33 kg"
          detail="13.98% under Rule A (down from 26.7%)"
          accent
        />
        <Metric
          label="Avoided this week"
          value="142 kg"
          detail="vs heuristic guessing (Rule B)"
        />
        <Metric label="Monthly saving" value="₹24,800" detail="-52.1% loss reduction" />
        <Metric label="Volume Error (WAPE)" value="25.95%" detail="MAE 41.54 heads (Benchmark Best)" />
      </section>
      <section className="waste-layout">
        <article className="ops-card waste-chart-card">
          <div className="card-heading">
            <div>
              <Eyebrow>Five-day audit</Eyebrow>
              <h2>Residual waste trend (kg)</h2>
            </div>
            <div className="trend-badge">
              <ArrowDownRight size={16} /> −52.1%
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
            <strong>86.0%</strong>
            <span>consumed under Rule A (14.0% buffer vs 26.7% heuristic)</span>
          </div>
          <div className="balance-track">
            <span style={{ width: "86.0%" }} />
          </div>
          <div className="balance-list">
            <div>
              <span>Prepared (Rule A)</span>
              <strong>412 portions (233 kg)</strong>
            </div>
            <div>
              <span>Served</span>
              <strong>354 portions (200 kg)</strong>
            </div>
            <div>
              <span>Residual Buffer</span>
              <strong>58 portions (33 kg)</strong>
            </div>
          </div>
          <div className="insight-strip">
            <Sparkles size={18} />
            <p>Rice and breads account for 61% of remaining surplus volume. Shortage rate limited to 6.88%.</p>
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
            <Eyebrow>Empirical Comparison · N = 612 Unseen Holdout Meals</Eyebrow>
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

      {/* Asymmetric Newsvendor Procurement Comparison & Tolerances */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginTop: 24 }}>
        <article className="ops-card">
          <div className="card-heading">
            <div>
              <Eyebrow>[Arrow et al. 1951] Phase 5 Operations</Eyebrow>
              <h2>Asymmetric Newsvendor Procurement</h2>
            </div>
            <StatusChip tone="good">-52.1% Cost Units</StatusChip>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
            Penalty cost structure: C<sub>shortage</sub> = 3 (hunger/queues/contract penalties), C<sub>waste</sub> = 1 (spoilage).
            Theoretical optimal fractile τ* = 3 / (3 + 1) = 0.75; empirical sweep minimum at γ* = 0.70.
          </p>
          <div className="data-table-wrap">
            <table className="data-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Procurement Strategy</th>
                  <th>Procured</th>
                  <th>Waste %</th>
                  <th>Shortage %</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: "rgba(16, 185, 129, 0.08)" }}>
                  <td>
                    <strong>{newsvendorSummary.ruleA.rule}</strong>
                    <small>Proposed Quantile Blending</small>
                  </td>
                  <td>{newsvendorSummary.ruleA.totalProcured.toLocaleString()}</td>
                  <td><strong>{newsvendorSummary.ruleA.wastePct}</strong></td>
                  <td><strong style={{ color: "#10b981" }}>{newsvendorSummary.ruleA.shortageRatePct}</strong></td>
                  <td><strong style={{ color: "#10b981" }}>{newsvendorSummary.ruleA.totalCostUnits.toLocaleString()} units (-52.1%)</strong></td>
                </tr>
                <tr>
                  <td>
                    <strong>{newsvendorSummary.ruleB.rule}</strong>
                    <small>Naive Guesswork Baseline</small>
                  </td>
                  <td>{newsvendorSummary.ruleB.totalProcured.toLocaleString()}</td>
                  <td>{newsvendorSummary.ruleB.wastePct}</td>
                  <td><strong style={{ color: "#ef4444" }}>{newsvendorSummary.ruleB.shortageRatePct}</strong></td>
                  <td><strong>{newsvendorSummary.ruleB.totalCostUnits.toLocaleString()} units</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article className="ops-card">
          <div className="card-heading">
            <div>
              <Eyebrow>Kitchen Operational Tolerances</Eyebrow>
              <h2>Commercial Batch Margins</h2>
            </div>
            <StatusChip tone="good">N = 612 Unseen Meals</StatusChip>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
            Standard commercial stainless steel catering pans hold ~35 portions. Landing within ±35 heads bounds error within one tray.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cookingTolerances.map((tol) => (
              <div
                key={tol.band}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                }}
              >
                <div>
                  <strong style={{ fontSize: 13 }}>{tol.band}</strong>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{tol.operationalMeaning}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}>{tol.coveragePct}</span>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>empirical coverage</div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      {/* 3-Class Operational Regime Classification Confusion Matrix */}
      <article className="ops-card table-card" style={{ marginTop: 24 }}>
        <div className="card-heading">
          <div>
            <Eyebrow>Phase 6 · Safety-Critical Action Regimes</Eyebrow>
            <h2>3-Class Operational Regime Matrix (N = 612 Meals)</h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <StatusChip tone="good">0 Critical False Negative Surges</StatusChip>
            <StatusChip tone="good">64.5% Overall Accuracy</StatusChip>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
          Converting continuous headcount into kitchen action regimes: Vacation Dip (Y ≤ 90), Normal Service (91–209), and Peak Surge (Y ≥ 210).
          Out of 179 surge meals, exactly 0 surges were predicted as dips.
        </p>
        <div className="data-table-wrap">
          <table className="data-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>Actual \ Predicted</th>
                <th>Pred Dip (≤90 Heads)</th>
                <th>Pred Normal (91–209 Heads)</th>
                <th>Pred Surge (≥210 Heads)</th>
                <th>Total Actual</th>
                <th>Category Performance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Actual Vacation Dip (≤90)</strong></td>
                <td style={{ background: "rgba(16, 185, 129, 0.12)" }}>
                  <strong style={{ color: "#10b981" }}>95 (True Dip)</strong>
                </td>
                <td>54</td>
                <td>1 (Extreme)</td>
                <td><strong>150</strong></td>
                <td>
                  <span style={{ fontSize: 11 }}>F1: <strong>72.24%</strong> · Prec: 84.07% · Rec: 63.33%</span>
                </td>
              </tr>
              <tr>
                <td><strong>Actual Normal (91–209)</strong></td>
                <td>18</td>
                <td style={{ background: "rgba(16, 185, 129, 0.12)" }}>
                  <strong style={{ color: "#10b981" }}>204 (True Normal)</strong>
                </td>
                <td>61</td>
                <td><strong>283</strong></td>
                <td>
                  <span style={{ fontSize: 11 }}>Acc: <strong>88.07%</strong></span>
                </td>
              </tr>
              <tr style={{ background: "rgba(239, 68, 68, 0.04)" }}>
                <td><strong>Actual Peak Surge (≥210)</strong></td>
                <td style={{ background: "rgba(16, 185, 129, 0.2)" }}>
                  <strong style={{ color: "#10b981" }}>0 (Zero Shortage Error)</strong>
                </td>
                <td>83</td>
                <td style={{ background: "rgba(16, 185, 129, 0.12)" }}>
                  <strong style={{ color: "#10b981" }}>96 (True Surge)</strong>
                </td>
                <td><strong>179</strong></td>
                <td>
                  <span style={{ fontSize: 11 }}>F1: <strong>56.97%</strong> · Prec: 60.76% · Rec: 53.63%</span>
                </td>
              </tr>
              <tr style={{ borderTop: "2px solid var(--line)" }}>
                <td><strong>Total Predicted</strong></td>
                <td><strong>113</strong></td>
                <td><strong>341</strong></td>
                <td><strong>158</strong></td>
                <td><strong>612</strong></td>
                <td>
                  <strong>Overall Accuracy: 64.5% (395 / 612)</strong>
                </td>
              </tr>
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
  vendorUser,
  session,
  claims,
  onGenerateSession,
  onEndSession,
  onSwitch,
  onLogout,
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

  const activeVendor: VendorUser = vendorUser || {
    vendor_id: "vendor",
    name: "Central Mess Supervisor",
    hostel: "BH-2",
  }

  const renderSection = () => {
    if (section === "scanner") return <TurnstileScanner />
    if (section === "students") return <AllowedStudents />
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
        onOpenScanner={() => setSection("scanner")}
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
                {item.id === "scanner" && <i style={{ background: "#22c55e" }} />}
              </button>
            )
          })}
        </nav>
        <div className="sidebar-status" style={{ padding: "12px 14px" }}>
          <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span className="pulse-dot" />
            <strong style={{ fontSize: 11 }}>Turnstile Telemetry Live</strong>
          </div>
          <WeatherWidget variant="compact" />
        </div>
        <div 
          className="operator-profile" 
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "default" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: "#38bdf8", color: "#0f172a" }}>
              {activeVendor.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{activeVendor.name}</strong>
              <small>{activeVendor.hostel} · Catering Vendor</small>
            </div>
          </div>
          <button
            onClick={onLogout || onSwitch}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: 4,
              opacity: 0.7
            }}
            title="Sign Out of Vendor Console"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <div className="ops-content-shell">
        <header 
          className="ops-header-bar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 24px",
            borderBottom: "1px solid var(--line)",
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 30,
            color: "#ffffff",
            flexWrap: "wrap",
            gap: 12
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="mobile-menu-btn" onClick={() => setMobileNav(true)}>
              <Menu size={21} />
            </button>
            <Brand compact />
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
              Dining Operations · {activeVendor.hostel}
            </span>
          </div>

          {/* Live Weather Widget & Prayagraj Time for Prayagraj, UP */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div className="hidden lg:flex items-center">
              <PrayagrajClockBadge variant="compact" />
            </div>
            <WeatherWidget variant="header" />
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              <span>{activeVendor.name}</span>
              <button
                onClick={onLogout || onSwitch}
                className="button button-ghost"
                style={{ fontSize: 11, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4, color: "#ffffff", borderColor: "rgba(255,255,255,0.2)" }}
              >
                <LogOut size={12} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
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
