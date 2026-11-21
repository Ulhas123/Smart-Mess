import React, { useState } from "react"
import { ArrowLeft, ShieldCheck, UtensilsCrossed, XCircle } from "lucide-react"
import { loginVendor } from "../../services/api"
import { WeatherWidget } from "../../components/WeatherWidget"
import { Brand, Button, Eyebrow } from "../../components/UI"
import type { VendorUser } from "../../types"

type VendorAuthProps = {
  onLoginSuccess: (vendor: VendorUser) => void
  onBack: () => void
}

export default function VendorAuth({ onLoginSuccess, onBack }: VendorAuthProps) {
  const [vendorId, setVendorId] = useState("vendor")
  const [password, setPassword] = useState("vendor123")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await loginVendor(vendorId, password)
      onLoginSuccess(res.vendor)
    } catch (err: any) {
      setError(err?.message || "Invalid Vendor ID or Password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div className="landing-glow landing-glow-a" />
      <div className="landing-glow landing-glow-b" />

      {/* Header */}
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

      {/* Main Login Card */}
      <main style={{ maxWidth: 460, width: "100%", margin: "40px auto", padding: "0 20px" }}>
        <div 
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 20,
            padding: 36,
            backdropFilter: "blur(16px)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <div 
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 14px",
                color: "#38bdf8"
              }}
            >
              <UtensilsCrossed size={26} />
            </div>

            <Eyebrow>Mess Caterer & Turnstile Desk</Eyebrow>
            <h2 style={{ fontSize: 26, marginTop: 4, marginBottom: 8 }}>Vendor Console Login</h2>
            <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.65)", lineHeight: 1.5 }}>
              Mess catering team and operations staff. Pre-provisioned vendor credentials required.
            </p>

            <div 
              style={{
                marginTop: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: 11,
                color: "#38bdf8"
              }}
            >
              <ShieldCheck size={13} />
              <span>Vendors do not need to register</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: 8, padding: 12, color: "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <XCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "rgba(255,255,255,0.8)" }}>
                Vendor / Caterer ID
              </label>
              <input
                type="text"
                placeholder="e.g. vendor"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  color: "#ffffff",
                  fontSize: 14,
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  color: "#ffffff",
                  fontSize: 14,
                }}
              />
            </div>

            {/* Quick-fill pills */}
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: 12, borderRadius: 10, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>
                Quick Fill Authorized Caterer Logins:
              </span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => { setVendorId("vendor"); setPassword("vendor123"); }}
                  style={{ fontSize: 11, padding: "4px 8px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, color: "#cbd5e1", cursor: "pointer" }}
                >
                  vendor (Central Mess)
                </button>
                <button
                  type="button"
                  onClick={() => { setVendorId("bh2_vendor"); setPassword("vendor123"); }}
                  style={{ fontSize: 11, padding: "4px 8px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, color: "#cbd5e1", cursor: "pointer" }}
                >
                  bh2_vendor (BH-2 Caterer)
                </button>
                <button
                  type="button"
                  onClick={() => { setVendorId("admin"); setPassword("admin123"); }}
                  style={{ fontSize: 11, padding: "4px 8px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, color: "#cbd5e1", cursor: "pointer" }}
                >
                  admin (Mess Warden)
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              style={{ width: "100%", padding: 14, fontSize: 14, marginTop: 4 }}
            >
              {loading ? "Verifying..." : "Sign In to Operations Console"}
            </Button>
          </form>
        </div>
      </main>

      <footer style={{ textAlign: "center", padding: "16px 20px", fontSize: 11, color: "rgba(255, 255, 255, 0.5)" }}>
        Department of Electronics & Communication Engineering · Indian Institute of Information Technology, Allahabad
      </footer>
    </div>
  )
}
