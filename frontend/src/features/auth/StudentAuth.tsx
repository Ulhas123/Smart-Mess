import React, { useState } from "react"
import { 
  ArrowLeft, 
  CheckCircle, 
  IdCard, 
  LogIn, 
  Upload, 
  UserPlus, 
  XCircle,
  ShieldAlert,
  Sparkles
} from "lucide-react"
import { loginStudent, registerStudent } from "../../services/api"
import { WeatherWidget } from "../../components/WeatherWidget"
import PrayagrajClockBadge from "../../components/agency/PrayagrajClockBadge"
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
    const svg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 320 200'><rect width='320' height='200' rx='12' fill='%2309090b'/><rect x='10' y='10' width='300' height='180' rx='8' fill='%23121214' stroke='%2338bdf8' stroke-width='2'/><text x='160' y='40' fill='%2338bdf8' font-family='sans-serif' font-size='13' font-weight='bold' text-anchor='middle'>INDIAN INSTITUTE OF INFORMATION TECHNOLOGY</text><text x='160' y='58' fill='%2394a3b8' font-family='sans-serif' font-size='11' text-anchor='middle'>ALLAHABAD · STUDENT IDENTITY CARD</text><rect x='25' y='75' width='65' height='80' rx='6' fill='%2318181b'/><circle cx='57' cy='105' r='18' fill='%23cbd5e1'/><path d='M35 150 C35 125 80 125 80 150 Z' fill='%23cbd5e1'/><text x='105' y='95' fill='%23ffffff' font-family='sans-serif' font-size='13' font-weight='bold'>${name}</text><text x='105' y='115' fill='%2338bdf8' font-family='monospace' font-size='12'>${roll}</text><text x='105' y='133' fill='%23cbd5e1' font-family='sans-serif' font-size='11'>Hostel: ${hostel} · ECE Dept</text><text x='105' y='150' fill='%2310b981' font-family='sans-serif' font-size='10' font-weight='bold'>MESS AUTHORIZED 2026</text></svg>`
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
      setLoginError(err?.message || "Invalid Roll Number or Password")
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
    <div className="relative min-h-screen bg-[#09090b] text-neutral-100 flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[#09090b]/80 border-b border-white/10 px-6 md:px-16 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white hover:text-black font-mono text-xs uppercase tracking-wider transition-all"
            >
              <ArrowLeft size={14} />
              <span>Back to Portal</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-[0.25em] text-white">MESA</span>
              <span className="text-white/20">/</span>
              <span className="font-mono text-[10px] text-neutral-400 tracking-wider uppercase hidden sm:inline">
                Resident Terminal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center">
              <PrayagrajClockBadge variant="compact" />
            </div>
            <WeatherWidget variant="header" />
          </div>
        </div>
      </header>

      {/* Main Auth Container */}
      <main className="flex-1 max-w-lg w-full mx-auto my-12 px-4 flex flex-col justify-center">
        <div className="rounded-2xl border border-white/10 bg-[#121214] p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl">
          
          {/* Header & Mode Switcher */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-amber-400 mb-2">
              <Sparkles size={13} />
              <span>Institutional Dining Access · IIIT Allahabad</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-display font-light text-white tracking-tight mb-2">
              {mode === "login" ? "Student Sign In" : "Resident Registration"}
            </h2>
            <p className="font-sans text-xs text-neutral-400 font-light max-w-sm mx-auto">
              {mode === "login" 
                ? "Sign in with your Roll Number to generate your cryptographic dynamic QR meal pass."
                : "Register your student identity and upload your verified college ID card."}
            </p>

            {/* Mode Switch Tabs */}
            <div className="mt-6 p-1 rounded-xl bg-[#18181b] border border-white/10 flex gap-1">
              <button
                type="button"
                onClick={() => { setMode("login"); setLoginError(null); setRegError(null); }}
                className={`flex-1 py-2.5 px-4 rounded-lg font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  mode === "login"
                    ? "bg-white text-black font-bold shadow-md"
                    : "text-neutral-400 hover:text-white bg-transparent"
                }`}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => { setMode("register"); setLoginError(null); setRegError(null); }}
                className={`flex-1 py-2.5 px-4 rounded-lg font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  mode === "register"
                    ? "bg-white text-black font-bold shadow-md"
                    : "text-neutral-400 hover:text-white bg-transparent"
                }`}
              >
                <UserPlus size={14} />
                <span>Register</span>
              </button>
            </div>
          </div>

          {/* LOGIN FORM */}
          {mode === "login" && (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
              {loginError && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <XCircle size={16} className="shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-neutral-300 font-mono text-xs uppercase tracking-wider mb-1.5">
                  Student Roll Number (Login ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. IEC2023059"
                  value={loginRoll}
                  onChange={(e) => setLoginRoll(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3.5 py-3 rounded-lg bg-[#18181b] border border-white/15 text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 text-sm font-sans"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-mono text-xs uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-3 rounded-lg bg-[#18181b] border border-white/15 text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 text-sm font-sans"
                />
              </div>

              {/* Demo Accounts Quick-Fill */}
              <div className="p-3.5 rounded-lg bg-[#18181b]/70 border border-white/10">
                <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest block mb-2">
                  Quick Fill Demo Student Credentials:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => { setLoginRoll("IEC2023059"); setLoginPassword("student123"); }}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white font-mono text-xs transition-colors"
                  >
                    IEC2023059 (Tushar Garg)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginRoll("IEC2023037"); setLoginPassword("student123"); }}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white font-mono text-xs transition-colors"
                  >
                    IEC2023037 (Varun Karankar)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginRoll("IEC2023058"); setLoginPassword("student123"); }}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white font-mono text-xs transition-colors"
                  >
                    IEC2023058 (Aadarsh Singh)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-full font-mono text-xs uppercase tracking-[0.2em] font-bold bg-white text-black hover:bg-neutral-200 shadow-xl transition-all disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loginLoading ? "Authenticating..." : "Sign In to Student Portal →"}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
              {regError && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <XCircle size={16} className="shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle size={16} className="shrink-0" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-neutral-300 font-mono text-xs uppercase tracking-wider mb-1.5">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IEC2023101"
                    value={regRoll}
                    onChange={(e) => setRegRoll(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-white/15 text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none text-xs font-sans"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-mono text-xs uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ananya Roy"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-white/15 text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none text-xs font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-neutral-300 font-mono text-xs uppercase tracking-wider mb-1.5">
                    Assigned Hostel *
                  </label>
                  <select
                    value={regHostel}
                    onChange={(e) => setRegHostel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-white/15 text-white focus:border-amber-400 focus:outline-none text-xs font-sans"
                  >
                    <option value="BH-1" className="bg-[#18181b] text-white">BH-1 Hostel</option>
                    <option value="BH-2" className="bg-[#18181b] text-white">BH-2 Hostel (Pure Veg)</option>
                    <option value="BH-3" className="bg-[#18181b] text-white">BH-3 Hostel (Non-Veg)</option>
                    <option value="GH-1" className="bg-[#18181b] text-white">GH-1 Hostel</option>
                    <option value="GH-2" className="bg-[#18181b] text-white">GH-2 Hostel</option>
                    <option value="GH-3" className="bg-[#18181b] text-white">GH-3 Hostel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-mono text-xs uppercase tracking-wider mb-1.5">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="roll@iiita.ac.in"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-white/15 text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none text-xs font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-neutral-300 font-mono text-xs uppercase tracking-wider mb-1.5">
                    Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-white/15 text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none text-xs font-sans"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-mono text-xs uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-white/15 text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none text-xs font-sans"
                  />
                </div>
              </div>

              {/* ID CARD UPLOAD SECTION */}
              <div className="border border-dashed border-sky-400/40 rounded-xl p-4 bg-sky-950/20 text-center">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-sky-400 font-medium">
                    <IdCard size={15} />
                    <span>College Identity Card (Required) *</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseMockId}
                    className="text-[10px] font-mono px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-colors"
                  >
                    + Generate Sample ID Card
                  </button>
                </div>

                {idCardData ? (
                  <div className="mt-2 flex flex-col items-center gap-2">
                    <div className="max-w-[220px] max-h-[130px] overflow-hidden rounded-lg border border-white/20 shadow-xl">
                      <img 
                        src={idCardData} 
                        alt="College ID Preview" 
                        className="w-full h-auto block" 
                      />
                    </div>
                    <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-mono">
                      <CheckCircle size={14} />
                      <span>{idCardFileName || "ID Card Verified"}</span>
                    </div>
                    <label className="text-xs text-neutral-400 hover:text-white underline cursor-pointer">
                      Replace File
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 py-4 px-2 cursor-pointer">
                    <Upload size={22} className="text-sky-400 opacity-90" />
                    <span className="text-xs font-medium text-neutral-200">
                      Click to upload your College Identity Card
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Supports PNG, JPG, JPEG, SVG or WebP
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-3.5 rounded-full font-mono text-xs uppercase tracking-[0.2em] font-bold bg-white text-black hover:bg-neutral-200 shadow-xl transition-all disabled:opacity-50 mt-2 cursor-pointer"
              >
                {regLoading ? "Registering Student..." : "Complete Registration & Sign In →"}
              </button>
            </form>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs font-mono text-neutral-500 border-t border-white/5">
        Department of Electronics & Communication Engineering · Indian Institute of Information Technology, Allahabad
      </footer>

    </div>
  )
}
