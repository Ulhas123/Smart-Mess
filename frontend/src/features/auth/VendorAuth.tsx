import React, { useState } from "react"
import { 
  ArrowLeft, 
  ShieldCheck, 
  UtensilsCrossed, 
  XCircle,
  KeyRound,
  Sparkles
} from "lucide-react"
import { loginVendor } from "../../services/api"
import { WeatherWidget } from "../../components/WeatherWidget"
import PrayagrajClockBadge from "../../components/agency/PrayagrajClockBadge"
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
    <div className="relative min-h-screen bg-[#09090b] text-neutral-100 flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      
      {/* Header */}
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
              <span className="font-mono text-[10px] text-amber-400 tracking-wider uppercase hidden sm:inline">
                Operations Vault
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

      {/* Main Login Card */}
      <main className="flex-1 max-w-md w-full mx-auto my-12 px-4 flex flex-col justify-center">
        <div className="rounded-2xl border border-white/10 bg-[#121214] p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl">
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/10">
              <UtensilsCrossed size={22} />
            </div>

            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-amber-400 mb-2">
              <ShieldCheck size={13} />
              <span>Caterer & Turnstile Desk</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-light text-white tracking-tight mb-2">
              Vendor Console Login
            </h2>
            <p className="font-sans text-xs text-neutral-400 font-light max-w-sm mx-auto leading-relaxed">
              Mess catering management and hardware turnstile operations. Pre-provisioned vendor credentials required.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/20 bg-sky-500/10 text-sky-300 font-mono text-[10px] uppercase tracking-wider">
              <span>Vendors do not need to register</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <XCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-neutral-300 font-mono text-xs uppercase tracking-wider mb-1.5">
                Vendor / Caterer ID
              </label>
              <input
                type="text"
                placeholder="e.g. vendor"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-3 rounded-lg bg-[#18181b] border border-white/15 text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 text-sm font-sans"
              />
            </div>

            {/* Quick Demo Credentials Fill */}
            <div className="p-3.5 rounded-lg bg-[#18181b]/70 border border-white/10">
              <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest block mb-2">
                Quick Fill Caterer Accounts:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setVendorId("vendor"); setPassword("vendor123"); }}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white font-mono text-xs transition-colors"
                >
                  Central Supervisor
                </button>
                <button
                  type="button"
                  onClick={() => { setVendorId("bh2_vendor"); setPassword("vendor123"); }}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white font-mono text-xs transition-colors"
                >
                  BH-2 Caterer (Veg)
                </button>
                <button
                  type="button"
                  onClick={() => { setVendorId("bh3_vendor"); setPassword("vendor123"); }}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white font-mono text-xs transition-colors"
                >
                  BH-3 Caterer (Non-Veg)
                </button>
                <button
                  type="button"
                  onClick={() => { setVendorId("admin"); setPassword("admin123"); }}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white font-mono text-xs transition-colors"
                >
                  Mess Warden / Admin
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full font-mono text-xs uppercase tracking-[0.2em] font-bold bg-amber-400 text-black hover:bg-amber-300 shadow-xl shadow-amber-400/20 transition-all disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? "Authenticating..." : "Open Operations Console →"}
            </button>
          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs font-mono text-neutral-500 border-t border-white/5">
        Department of Electronics & Communication Engineering · Indian Institute of Information Technology, Allahabad
      </footer>

    </div>
  )
}
