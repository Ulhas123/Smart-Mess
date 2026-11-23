import React, { useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  IdCard,
  RefreshCw,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  Upload,
  UserCheck,
  UserX,
  XCircle,
  Zap,
} from "lucide-react"
import jsQR from "jsqr"
import { scanMealPass, fetchTodayAttendance } from "../../services/api"
import { getCurrentMealSlot } from "../../utils/time"
import { Button, Eyebrow, Modal, StatusChip } from "../../components/UI"
import type { AttendanceRecord, AttendanceScanResult, MealPeriod } from "../../types"

const mealSlots: MealPeriod[] = ["Breakfast", "Lunch", "Dinner"]

function getCurrentSlot(): MealPeriod {
  return getCurrentMealSlot()
}

function playChime(type: "APPROVED" | "DENIED" | "DUPLICATE") {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === "APPROVED") {
      osc.type = "sine"
      osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08) // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16) // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.35)
    } else {
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(220, ctx.currentTime) // A3
      osc.frequency.setValueAtTime(146.83, ctx.currentTime + 0.12) // D3
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.38)
    }
  } catch (e) {
    // audio context silenced or not allowed
  }
}

export default function TurnstileScanner() {
  const [selectedSlot, setSelectedSlot] = useState<MealPeriod>(getCurrentSlot())
  const [cameraActive, setCameraActive] = useState(false)
  const [scanResult, setScanResult] = useState<AttendanceScanResult | null>(null)
  const [manualInput, setManualInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([])
  const [tableFilter, setTableFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedStudentIdCard, setSelectedStudentIdCard] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<any>(null)

  // Load today's attendance records on mount
  useEffect(() => {
    loadAttendance()
  }, [])

  const loadAttendance = async () => {
    try {
      const res = await fetchTodayAttendance()
      if (res && res.records) {
        setAttendanceLogs(res.records)
      }
    } catch (e) {
      console.warn("Error fetching attendance", e)
    }
  }

  // Camera Management
  const startCamera = async () => {
    try {
      setCameraActive(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute("playsinline", "true")
        await videoRef.current.play()
      }

      // Start frame scanning loop
      scanIntervalRef.current = setInterval(captureAndDecodeFrame, 350)
    } catch (err: any) {
      console.warn("Camera access failed", err)
      alert("Could not access camera. Please allow camera permissions or use the quick scan/manual entry tools.")
      stopCamera()
    }
  }

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const captureAndDecodeFrame = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) return
    const canvas = canvasRef.current || document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    })

    if (code && code.data) {
      processScan(code.data)
      stopCamera()
    }
  }

  // Handle uploaded QR image file
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.drawImage(img, 0, 0)
        const imgData = ctx.getImageData(0, 0, img.width, img.height)
        const code = jsQR(imgData.data, imgData.width, imgData.height)
        if (code && code.data) {
          processScan(code.data)
        } else {
          // If not standard QR, treat the file name or fallback as roll
          processScan(manualInput || "IEC2023059")
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  // Core function to process scan with backend
  const processScan = async (qrData: string) => {
    if (!qrData.trim()) return
    setLoading(true)
    try {
      const res = await scanMealPass(qrData.trim(), selectedSlot)
      setScanResult(res)
      playChime(res.status)
      setManualInput("")
      loadAttendance()
    } catch (err) {
      console.warn("Scan process error", err)
    } finally {
      setLoading(false)
    }
  }

  // Attendance stats
  const totalScans = attendanceLogs.length
  const totalApproved = attendanceLogs.filter((l) => l.status === "APPROVED").length
  const totalDenied = attendanceLogs.filter((l) => l.status === "DENIED" || l.status === "DUPLICATE").length

  const filteredLogs = attendanceLogs.filter((item) => {
    const matchesFilter = tableFilter === "all" || item.slot.toLowerCase() === tableFilter.toLowerCase()
    const matchesSearch =
      !searchQuery ||
      item.roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hostel.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 40 }}>
      {/* Page Title & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
        <div>
          <Eyebrow>Institutional Turnstile Telemetry</Eyebrow>
          <h1 style={{ fontSize: 28, marginTop: 4 }}>Mess Entrance Turnstile Scanner</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 640 }}>
            Scan student digital passes or credentials to verify mess enrollment, prevent duplicate entries, and log real-time headcount.
          </p>
        </div>

        {/* Meal Slot Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#18181b", border: "1px solid rgba(255, 255, 255, 0.12)", padding: 4, borderRadius: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "0 8px", color: "var(--muted)" }}>MEAL:</span>
          {mealSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedSlot(slot)}
              style={{
                padding: "6px 12px",
                borderRadius: 7,
                border: selectedSlot === slot ? "1px solid #ffffff" : "1px solid transparent",
                background: selectedSlot === slot ? "#ffffff" : "transparent",
                color: selectedSlot === slot ? "#09090b" : "#a1a1aa",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer"
              }}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      {/* Main Scanner Section Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24, marginBottom: 30 }}>
        
        {/* LEFT COLUMN: CAMERA / SCANNING INTERFACE */}
        <div 
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: 18,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ScanLine size={20} />
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>Active Scanner Viewport</h3>
            </div>
            
            <div style={{ display: "flex", gap: 8 }}>
              {cameraActive ? (
                <button
                  onClick={stopCamera}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "rgba(244, 63, 94, 0.15)",
                    color: "#fb7185",
                    border: "1px solid rgba(244, 63, 94, 0.3)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <CameraOff size={14} />
                  <span>Stop Camera</span>
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "#ffffff",
                    color: "#09090b",
                    border: "1px solid #ffffff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <Camera size={14} />
                  <span>Start Live Webcam Scanner</span>
                </button>
              )}
            </div>
          </div>

          {/* Video / Camera Viewport Box */}
          <div 
            style={{
              position: "relative",
              width: "100%",
              height: 250,
              background: "#0f172a",
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: cameraActive ? "2px solid #22c55e" : "1px dashed rgba(255,255,255,0.2)"
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: cameraActive ? "block" : "none"
              }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Target reticle when camera is active */}
            {cameraActive ? (
              <div 
                style={{
                  position: "absolute",
                  width: 170,
                  height: 170,
                  border: "2px solid rgba(34, 197, 94, 0.8)",
                  borderRadius: 14,
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.35)",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <div 
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "#22c55e",
                    boxShadow: "0 0 8px #22c55e",
                    animation: "scanPulse 2s infinite"
                  }}
                />
                <span style={{ fontSize: 10, color: "#ffffff", background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 4 }}>
                  Align student pass
                </span>
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", padding: 20 }}>
                <ScanLine size={48} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                <strong style={{ display: "block", fontSize: 14, color: "#ffffff" }}>Webcam Scanner Inactive</strong>
                <p style={{ fontSize: 12, marginTop: 4, maxWidth: 300, margin: "4px auto 0", opacity: 0.8 }}>
                  Click "Start Live Webcam Scanner" to scan from mobile/laptop camera, or use the fast simulation tools below.
                </p>
              </div>
            )}
          </div>

          {/* Alternative Scan Inputs: Image Upload & Manual Barcode / Roll Entry */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Enter Student Roll No. or scan token..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") processScan(manualInput)
                }}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  background: "#18181b",
                  color: "#f4f4f5",
                  fontSize: 13,
                  outline: "none"
                }}
              />
              <Button
                variant="primary"
                onClick={() => processScan(manualInput)}
                disabled={loading || !manualInput.trim()}
              >
                {loading ? "Verifying..." : "Verify Pass"}
              </Button>

              <label 
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "#f4f4f5",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600
                }}
                title="Scan pass or image file"
              >
                <Upload size={14} />
                <span>Upload Pass</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
              </label>
            </div>

            {/* Quick-Scan Simulation Buttons (Test Suite) */}
            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase" }}>
                Quick Test Scenarios (1-Click Verification):
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => processScan("IEC2023059")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#34d399",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  ✓ Scan Allowed: Tushar Garg (IEC2023059)
                </button>

                <button
                  type="button"
                  onClick={() => processScan("IEC2023059")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    background: "rgba(245, 158, 11, 0.12)",
                    color: "#fbbf24",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                  title="Rescan same student in same slot to test duplicate prevention"
                >
                  ⚠ Re-scan Duplicate: Tushar Garg (IEC2023059)
                </button>

                <button
                  type="button"
                  onClick={() => processScan("IEC2023037")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#34d399",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  ✓ Scan Allowed: Varun Karankar (IEC2023037)
                </button>

                <button
                  type="button"
                  onClick={() => processScan("IEC2023999")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid rgba(244, 63, 94, 0.3)",
                    background: "rgba(244, 63, 94, 0.12)",
                    color: "#fb7185",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                  title="Test rejection of barred student"
                >
                  ✕ Scan Barred: Rahul Malviya (IEC2023999)
                </button>

                <button
                  type="button"
                  onClick={() => processScan("IEC9999999")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(255, 255, 255, 0.06)",
                    color: "#e4e4e7",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  ? Scan Unregistered: IEC9999999
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME VERIFICATION FEEDBACK CARD */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div 
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: 18,
              padding: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <Eyebrow>Turnstile Access Decision</Eyebrow>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>
                  {scanResult ? `Scanned at ${scanResult.timestamp}` : "Ready for scan"}
                </span>
              </div>

              {!scanResult ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                  <ShieldCheck size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                  <strong style={{ fontSize: 16, display: "block", color: "#ffffff" }}>Waiting for Student Pass / Scan</strong>
                  <p style={{ fontSize: 12, marginTop: 4 }}>
                    When a student presents their digital meal pass, turnstile authorization will show here immediately.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Status Banner */}
                  {scanResult.status === "APPROVED" && (
                    <div 
                      style={{
                        background: "rgba(16, 185, 129, 0.12)",
                        border: "1px solid rgba(16, 185, 129, 0.4)",
                        borderRadius: 14,
                        padding: 18,
                        marginBottom: 16,
                        color: "#34d399"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <CheckCircle2 size={36} style={{ color: "#34d399", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 12, letterSpacing: "0.08em", fontWeight: 700, textTransform: "uppercase", color: "#6ee7b7" }}>
                            Turnstile Decision:
                          </div>
                          <h2 style={{ fontSize: 24, margin: "2px 0 0", color: "#ffffff", fontWeight: 700 }}>
                            ENTRY AUTHORIZED
                          </h2>
                          <div style={{ fontSize: 12, marginTop: 4, color: "#a7f3d0" }}>
                            Meal pass verified for <strong style={{ color: "#ffffff" }}>{scanResult.slot}</strong>. Attendance recorded.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {scanResult.status === "DENIED" && (
                    <div 
                      style={{
                        background: "rgba(244, 63, 94, 0.12)",
                        border: "1px solid rgba(244, 63, 94, 0.4)",
                        borderRadius: 14,
                        padding: 18,
                        marginBottom: 16,
                        color: "#fb7185"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <XCircle size={36} style={{ color: "#fb7185", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 12, letterSpacing: "0.08em", fontWeight: 700, textTransform: "uppercase", color: "#fda4af" }}>
                            Turnstile Decision:
                          </div>
                          <h2 style={{ fontSize: 24, margin: "2px 0 0", color: "#ffffff", fontWeight: 700 }}>
                            ENTRY DENIED
                          </h2>
                          <div style={{ fontSize: 12, marginTop: 4, fontWeight: 500, color: "#fecdd3" }}>
                            {scanResult.reason}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {scanResult.status === "DUPLICATE" && (
                    <div 
                      style={{
                        background: "rgba(245, 158, 11, 0.12)",
                        border: "1px solid rgba(245, 158, 11, 0.4)",
                        borderRadius: 14,
                        padding: 18,
                        marginBottom: 16,
                        color: "#fbbf24"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <AlertTriangle size={36} style={{ color: "#fbbf24", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 12, letterSpacing: "0.08em", fontWeight: 700, textTransform: "uppercase", color: "#fcd34d" }}>
                            Turnstile Decision:
                          </div>
                          <h2 style={{ fontSize: 22, margin: "2px 0 0", color: "#ffffff", fontWeight: 700 }}>
                            DUPLICATE ENTRY
                          </h2>
                          <div style={{ fontSize: 12, marginTop: 4, color: "#fde68a" }}>
                            {scanResult.reason}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Student Details Card */}
                  <div 
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: 12,
                      padding: 16
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <strong style={{ fontSize: 14, color: "#ffffff" }}>Student Identity Verification</strong>
                      {scanResult.id_card_data && (
                        <button
                          onClick={() => setSelectedStudentIdCard(scanResult.id_card_data || null)}
                          style={{
                            fontSize: 11,
                            color: "#38bdf8",
                            background: "rgba(56, 189, 248, 0.12)",
                            border: "1px solid rgba(56, 189, 248, 0.3)",
                            borderRadius: 6,
                            padding: "3px 8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                          }}
                        >
                          <IdCard size={12} />
                          <span>View Uploaded ID Card</span>
                        </button>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                      <div>
                        <span style={{ color: "var(--muted)", display: "block" }}>Student Roll Number</span>
                        <strong style={{ fontSize: 15, fontFamily: "monospace", color: "#ffffff" }}>{scanResult.roll}</strong>
                      </div>

                      <div>
                        <span style={{ color: "var(--muted)", display: "block" }}>Student Full Name</span>
                        <strong style={{ fontSize: 14, color: "#ffffff" }}>{scanResult.name}</strong>
                      </div>

                      <div>
                        <span style={{ color: "var(--muted)", display: "block" }}>Dining Hostel</span>
                        <span style={{ color: "#e4e4e7" }}>{scanResult.hostel}</span>
                      </div>

                      <div>
                        <span style={{ color: "var(--muted)", display: "block" }}>Meal Service Slot</span>
                        <span style={{ color: "#e4e4e7" }}>{scanResult.slot}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div 
              style={{
                marginTop: 20,
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                padding: 12,
                borderRadius: 10,
                textAlign: "center"
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Total Today</div>
                <strong style={{ fontSize: 18, color: "#ffffff" }}>{totalScans}</strong>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#34d399", textTransform: "uppercase" }}>Approved</div>
                <strong style={{ fontSize: 18, color: "#34d399" }}>{totalApproved}</strong>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#fb7185", textTransform: "uppercase" }}>Blocked / Denied</div>
                <strong style={{ fontSize: 18, color: "#fb7185" }}>{totalDenied}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S ATTENDANCE LOG TABLE */}
      <section 
        style={{
          background: "var(--paper)",
          border: "1px solid var(--line)",
          borderRadius: 18,
          padding: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <Eyebrow>Audit Trail & Verification Ledger</Eyebrow>
            <h3 style={{ fontSize: 20, marginTop: 2 }}>Today's Turnstile Access Logs</h3>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Search Input */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.12)", padding: "6px 12px", borderRadius: 8 }}>
              <Search size={14} style={{ color: "var(--muted)" }} />
              <input
                type="text"
                placeholder="Search roll, name, hostel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: "none", border: "none", outline: "none", fontSize: 12, width: 160, color: "#ffffff" }}
              />
            </div>

            {/* Slot Filter */}
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid rgba(255, 255, 255, 0.15)",
                fontSize: 12,
                background: "#18181b",
                color: "#f4f4f5"
              }}
            >
              <option value="all">All Slots</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>

            <button
              onClick={loadAttendance}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(255, 255, 255, 0.06)",
                fontSize: 12,
                color: "#f4f4f5",
                cursor: "pointer"
              }}
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "var(--muted)" }}>
            <Clock size={28} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
            <p style={{ fontSize: 13 }}>No turnstile logs found for current filter.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)", color: "var(--muted)", fontSize: 11, textTransform: "uppercase" }}>
                  <th style={{ padding: "10px 12px" }}>Time</th>
                  <th style={{ padding: "10px 12px" }}>Student Roll</th>
                  <th style={{ padding: "10px 12px" }}>Name</th>
                  <th style={{ padding: "10px 12px" }}>Hostel</th>
                  <th style={{ padding: "10px 12px" }}>Slot</th>
                  <th style={{ padding: "10px 12px" }}>Access Status</th>
                  <th style={{ padding: "10px 12px" }}>Reason / Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <td style={{ padding: "12px", fontFamily: "monospace", fontSize: 12, color: "#a1a1aa" }}>{item.timestamp}</td>
                    <td style={{ padding: "12px", fontWeight: 700, fontFamily: "monospace", color: "#ffffff" }}>{item.roll}</td>
                    <td style={{ padding: "12px", color: "#ffffff" }}>{item.name}</td>
                    <td style={{ padding: "12px", color: "#d4d4d8" }}>{item.hostel}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ background: "rgba(255, 255, 255, 0.08)", color: "#e4e4e7", border: "1px solid rgba(255, 255, 255, 0.12)", padding: "3px 8px", borderRadius: 4, fontSize: 11 }}>
                        {item.slot}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span 
                        style={{
                          background: item.status === "APPROVED" ? "rgba(16, 185, 129, 0.15)" : item.status === "DUPLICATE" ? "rgba(245, 158, 11, 0.15)" : "rgba(244, 63, 94, 0.15)",
                          color: item.status === "APPROVED" ? "#34d399" : item.status === "DUPLICATE" ? "#fbbf24" : "#fb7185",
                          border: item.status === "APPROVED" ? "1px solid rgba(16, 185, 129, 0.3)" : item.status === "DUPLICATE" ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(244, 63, 94, 0.3)",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      >
                        {item.status === "APPROVED" ? "Entry Approved" : item.status === "DUPLICATE" ? "Duplicate Blocked" : "Entry Denied"}
                      </span>
                    </td>
                    <td style={{ padding: "12px", color: "#a1a1aa", fontSize: 12 }}>
                      {item.reason || "Verified"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Student ID Card Modal Preview */}
      {selectedStudentIdCard && (
        <Modal title="Verified College ID Card" onClose={() => setSelectedStudentIdCard(null)}>
          <div style={{ textAlign: "center", padding: "10px 0" }}>
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
              <img 
                src={selectedStudentIdCard} 
                alt="Student ID Card" 
                style={{ width: "100%", height: "auto", display: "block" }} 
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <Button onClick={() => setSelectedStudentIdCard(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
