import React, { useState } from "react"
import { 
  ArrowLeft, 
  CheckCircle, 
  IdCard, 
  LogIn, 
  Upload, 
  UserPlus, 
  XCircle 
} from "lucide-react"
import { loginStudent, registerStudent } from "../../services/api"
import { WeatherWidget } from "../../components/WeatherWidget"
import { Brand, Button, Eyebrow } from "../../components/UI"
import type { StudentUser } from "../../types"

type StudentAuthProps = {
  onLoginSuccess: (student: StudentUser) => void
  onBack: () => void
}

export default function StudentAuth({ onLoginSuccess, onBack }: StudentAuthProps) {
  const [mode, setMode] = useState<"login" | "register">("login")

  // Login form state
  const [loginRoll, setLoginRoll] = useState("IEC2023059")
  const [loginPassword, setLoginPassword] = useState("student123")
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Registration form state
  const [regRoll, setRegRoll] = useState("")
  const [regName, setRegName] = useState("")
  const [regHostel, setRegHostel] = useState("BH-2")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirmPassword, setRegConfirmPassword] = useState("")
  const [idCardData, setIdCardData] = useState<string>("")
  const [idCardFileName, setIdCardFileName] = useState<string>("")
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState<string | null>(null)
  const [regSuccess, setRegSuccess] = useState<string | null>(null)

  // Handle ID card file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIdCardFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setIdCardData(reader.result)
        setRegError(null)
      }
    }
    reader.onerror = () => {
      setRegError("Failed to read file. Please select another image.")
    }
    reader.readAsDataURL(file)
  }

  // Generate mock college ID card for fast testing
  const handleUseMockId = () => {
    const roll = regRoll.trim() || "IEC2023" + Math.floor(100 + Math.random() * 900)
    const name = regName.trim() || "IIITA Student"
    const hostel = regHostel || "BH-2"
    const svg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 320 200'><rect width='320' height='200' rx='12' fill='%230f172a'/><rect x='10' y='10' width='300' height='180' rx='8' fill='%231e293b' stroke='%2338bdf8' stroke-width='2'/><text x='160' y='40' fill='%2338bdf8' font-family='sans-serif' font-size='14' font-weight='bold' text-anchor='middle'>INDIAN INSTITUTE OF INFORMATION TECHNOLOGY</text><text x='160' y='58' fill='%2394a3b8' font-family='sans-serif' font-size='11' text-anchor='middle'>ALLAHABAD · STUDENT IDENTITY CARD</text><rect x='25' y='75' width='65' height='80' rx='6' fill='%23334155'/><circle cx='57' cy='105' r='18' fill='%23cbd5e1'/><path d='M35 150 C35 125 80 125 80 150 Z' fill='%23cbd5e1'/><text x='105' y='95' fill='%23ffffff' font-family='sans-serif' font-size='13' font-weight='bold'>${name}</text><text x='105' y='115' fill='%2338bdf8' font-family='monospace' font-size='12'>${roll}</text><text x='105' y='133' fill='%23cbd5e1' font-family='sans-serif' font-size='11'>Hostel: ${hostel} · ECE Dept</text><text x='105' y='150' fill='%234ade80' font-family='sans-serif' font-size='10' font-weight='bold'>MESS AUTHORIZED 2026</text></svg>`
    setIdCardData(svg)
    setIdCardFileName(`${roll}_iiita_id.svg`)
    setRegError(null)
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)
    try {
      const res = await loginStudent(loginRoll, loginPassword)
      onLoginSuccess(res.student)
    } catch (err: any) {
      setLoginError(err.message || "Invalid Roll Number or Password")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError(null)

    if (!regRoll.trim()) {
      setRegError("Please enter your Roll Number.")
      return
    }
    if (!regName.trim()) {
      setRegError("Please enter your Full Name.")
      return
    }
    if (!regPassword) {
      setRegError("Please choose a password.")
      return
    }
    if (regPassword !== regConfirmPassword) {
      setRegError("Passwords do not match.")
      return
    }
    if (!idCardData) {
      setRegError("College Identity Card upload is required for registration.")
      return
    }

    setRegLoading(true)
    try {
      const res = await registerStudent({
        roll: regRoll.trim().toUpperCase(),
        name: regName.trim(),
        hostel: regHostel,
        password: regPassword,
        id_card_data: idCardData,
        id_card_filename: idCardFileName || "id_card.png",
        email: regEmail.trim() || undefined,
      })
      setRegSuccess(`Registration successful for ${res.student.roll}! Logging in...`)
      setTimeout(() => {
        onLoginSuccess(res.student)
      }, 1200)
    } catch (err: any) {
      setRegError(err.message || "Registration failed. Roll number may already exist.")
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className="landing" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div className="landing-glow landing-glow-a" />
      <div className="landing-glow landing-glow-b" />

      {/* Top Header */}
      <header className="landing-header" style={{ width: "100%", maxWidth: 1100, margin: "0 auto", padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button 
            onClick={onBack}
            className="button button-ghost"
            style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}
          >
            <ArrowLeft size={16} />
            <span>Back to Portal</span>
          </button>
          <Brand />
        </div>

        {/* Live Weather Widget for Prayagraj, UP */}
        <WeatherWidget variant="header" />
      </header>

      {/* Main Auth Container */}
      <main style={{ maxWidth: 540, width: "100%", margin: "20px auto 40px", padding: "0 20px" }}>
        <div 
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 20,
            padding: 32,
            backdropFilter: "blur(16px)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
          }}
        >
          {/* Top Title & Mode Tabs */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Eyebrow>Institutional Dining Access</Eyebrow>
            <h2 style={{ fontSize: 28, marginTop: 6, marginBottom: 8 }}>
              {mode === "login" ? "Student Sign In" : "Student Registration"}
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.65)" }}>
              {mode === "login" 
                ? "Sign in with your Roll Number to generate your mess entry QR code."
                : "Register with your Roll Number and upload your College ID Card."}
            </p>

            <div 
              style={{
                display: "inline-flex",
                background: "rgba(255, 255, 255, 0.08)",
                padding: 4,
                borderRadius: 12,
                marginTop: 18,
                width: "100%"
              }}
            >
              <button
                type="button"
                onClick={() => { setMode("login"); setLoginError(null); setRegError(null); }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: mode === "login" ? "#ffffff" : "transparent",
                  color: mode === "login" ? "#0f172a" : "rgba(255, 255, 255, 0.7)",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s"
                }}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => { setMode("register"); setLoginError(null); setRegError(null); }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: mode === "register" ? "#ffffff" : "transparent",
                  color: mode === "register" ? "#0f172a" : "rgba(255, 255, 255, 0.7)",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s"
                }}
              >
                <UserPlus size={15} />
                <span>Register New Student</span>
              </button>
            </div>
          </div>

          {/* LOGIN FORM */}
          {mode === "login" && (
            <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {loginError && (
                <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: 8, padding: 12, color: "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  <XCircle size={16} />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "rgba(255,255,255,0.8)" }}>
                  Login ID (Student Roll Number)
                </label>
                <input
                  type="text"
                  placeholder="e.g. IEC2023059"
                  value={loginRoll}
                  onChange={(e) => setLoginRoll(e.target.value.toUpperCase())}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    color: "#ffffff",
                    fontSize: 14,
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "rgba(255,255,255,0.8)" }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    color: "#ffffff",
                    fontSize: 14,
                    outline: "none"
                  }}
                />
              </div>

              {/* Demo Accounts Quick-Fill */}
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: 12, borderRadius: 10, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>
                  Quick Fill Demo Student Credentials:
                </span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => { setLoginRoll("IEC2023059"); setLoginPassword("student123"); }}
                    style={{ fontSize: 11, padding: "4px 8px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, color: "#cbd5e1", cursor: "pointer" }}
                  >
                    IEC2023059 (Tushar Garg)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginRoll("IEC2023037"); setLoginPassword("student123"); }}
                    style={{ fontSize: 11, padding: "4px 8px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, color: "#cbd5e1", cursor: "pointer" }}
                  >
                    IEC2023037 (Varun Karankar)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginRoll("IEC2023058"); setLoginPassword("student123"); }}
                    style={{ fontSize: 11, padding: "4px 8px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, color: "#cbd5e1", cursor: "pointer" }}
                  >
                    IEC2023058 (Aadarsh Singh)
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loginLoading}
                style={{ width: "100%", padding: 14, fontSize: 14, marginTop: 8 }}
              >
                {loginLoading ? "Authenticating..." : "Sign In to Student Portal"}
              </Button>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === "register" && (
            <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {regError && (
                <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: 8, padding: 12, color: "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  <XCircle size={16} />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid #22c55e", borderRadius: 8, padding: 12, color: "#86efac", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={16} />
                  <span>{regSuccess}</span>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5, color: "rgba(255,255,255,0.8)" }}>
                    Roll Number (Login ID) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IEC2023101"
                    value={regRoll}
                    onChange={(e) => setRegRoll(e.target.value.toUpperCase())}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.16)",
                      color: "#ffffff",
                      fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5, color: "rgba(255,255,255,0.8)" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ananya Roy"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.16)",
                      color: "#ffffff",
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5, color: "rgba(255,255,255,0.8)" }}>
                    Assigned Hostel *
                  </label>
                  <select
                    value={regHostel}
                    onChange={(e) => setRegHostel(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#1e293b",
                      border: "1px solid rgba(255, 255, 255, 0.16)",
                      color: "#ffffff",
                      fontSize: 13,
                    }}
                  >
                    <option value="BH-1">BH-1 Hostel</option>
                    <option value="BH-2">BH-2 Hostel</option>
                    <option value="BH-3">BH-3 Hostel (Non-Veg option)</option>
                    <option value="GH-1">GH-1 Hostel</option>
                    <option value="GH-2">GH-2 Hostel</option>
                    <option value="GH-3">GH-3 Hostel</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5, color: "rgba(255,255,255,0.8)" }}>
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="roll@iiita.ac.in"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.16)",
                      color: "#ffffff",
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5, color: "rgba(255,255,255,0.8)" }}>
                    Choose Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.16)",
                      color: "#ffffff",
                      fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5, color: "rgba(255,255,255,0.8)" }}>
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.16)",
                      color: "#ffffff",
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              {/* ID CARD UPLOAD SECTION (Mandatory per task specification) */}
              <div 
                style={{
                  border: "1px dashed rgba(56, 189, 248, 0.4)",
                  borderRadius: 12,
                  padding: 16,
                  background: "rgba(56, 189, 248, 0.03)",
                  textAlign: "center"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#38bdf8" }}>
                    <IdCard size={16} />
                    <span>College Identity Card (Required) *</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseMockId}
                    style={{
                      fontSize: 11,
                      color: "#38bdf8",
                      background: "rgba(56, 189, 248, 0.1)",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      borderRadius: 6,
                      padding: "3px 8px",
                      cursor: "pointer"
                    }}
                    title="Instantly generate an official IIITA student ID card preview"
                  >
                    + Generate Sample ID Card
                  </button>
                </div>

                {idCardData ? (
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div 
                      style={{
                        maxWidth: 240,
                        maxHeight: 140,
                        overflow: "hidden",
                        borderRadius: 8,
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                      }}
                    >
                      <img 
                        src={idCardData} 
                        alt="College ID Preview" 
                        style={{ width: "100%", height: "auto", display: "block" }} 
                      />
                    </div>
                    <div style={{ fontSize: 11, color: "#4ade80", display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle size={14} />
                      <span>{idCardFileName || "ID Card Verified"}</span>
                    </div>
                    <label 
                      style={{
                        fontSize: 11,
                        color: "rgba(255, 255, 255, 0.7)",
                        textDecoration: "underline",
                        cursor: "pointer"
                      }}
                    >
                      Replace File
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                        style={{ display: "none" }} 
                      />
                    </label>
                  </div>
                ) : (
                  <label 
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      padding: "16px 8px",
                      cursor: "pointer"
                    }}
                  >
                    <Upload size={24} style={{ color: "#38bdf8", opacity: 0.8 }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      Click to upload your College Identity Card
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.5)" }}>
                      Supports PNG, JPG, JPEG, SVG or WebP
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      style={{ display: "none" }} 
                    />
                  </label>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={regLoading}
                style={{ width: "100%", padding: 14, fontSize: 14, marginTop: 4 }}
              >
                {regLoading ? "Registering Student..." : "Complete Registration & Sign In"}
              </Button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "16px 20px", fontSize: 11, color: "rgba(255, 255, 255, 0.5)" }}>
        Department of Electronics & Communication Engineering · Indian Institute of Information Technology, Allahabad
      </footer>
    </div>
  )
}
