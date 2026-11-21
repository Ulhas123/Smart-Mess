import React, { useEffect, useState } from "react"
import {
  CheckCircle,
  IdCard,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
  XCircle,
} from "lucide-react"
import { fetchStudentsList, toggleStudentAllowed } from "../../services/api"
import { Button, Eyebrow, Modal, StatusChip } from "../../components/UI"
import type { StudentUser } from "../../types"

export default function AllowedStudents() {
  const [students, setStudents] = useState<StudentUser[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedIdCard, setSelectedIdCard] = useState<string | null>(null)
  const [selectedStudentName, setSelectedStudentName] = useState<string>("")

  const loadStudents = async () => {
    setLoading(true)
    try {
      const res = await fetchStudentsList()
      if (res && res.students) {
        setStudents(res.students)
      }
    } catch (e) {
      console.warn("Failed to load students", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const handleToggle = async (roll: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      await toggleStudentAllowed(roll, newStatus)
      setStudents((prev) =>
        prev.map((s) => (s.roll === roll ? { ...s, is_allowed: newStatus } : s))
      )
    } catch (e) {
      console.warn("Toggle status error", e)
    }
  }

  const filtered = students.filter(
    (s) =>
      s.roll.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.hostel.toLowerCase().includes(search.toLowerCase())
  )

  const allowedCount = students.filter((s) => s.is_allowed).length
  const barredCount = students.filter((s) => !s.is_allowed).length

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Eyebrow>Institutional Mess Registry</Eyebrow>
          <h1 style={{ fontSize: 28, marginTop: 4 }}>Allowed Students & Identity Cards</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 640 }}>
            Inspect uploaded college identity cards, review mess subscription eligibility, and toggle admission permissions.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.04)", padding: "6px 12px", borderRadius: 8 }}>
            <Search size={14} style={{ color: "var(--muted)" }} />
            <input
              type="text"
              placeholder="Search roll, name, hostel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: "none", border: "none", outline: "none", fontSize: 12, width: 170 }}
            />
          </div>

          <button
            onClick={loadStudents}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "none",
              fontSize: 12,
              cursor: "pointer"
            }}
          >
            <RefreshCw size={13} className={loading ? "spin" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>Total Registered</div>
          <strong style={{ fontSize: 24 }}>{students.length}</strong>
        </div>
        <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 11, color: "#16a34a", textTransform: "uppercase" }}>Allowed for Entry</div>
          <strong style={{ fontSize: 24, color: "#16a34a" }}>{allowedCount}</strong>
        </div>
        <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 11, color: "#dc2626", textTransform: "uppercase" }}>Barred / Hold</div>
          <strong style={{ fontSize: 24, color: "#dc2626" }}>{barredCount}</strong>
        </div>
      </div>

      {/* Students Table */}
      <div 
        style={{
          background: "var(--paper)",
          border: "1px solid var(--line)",
          borderRadius: 18,
          padding: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", color: "var(--muted)", fontSize: 11, textTransform: "uppercase" }}>
                <th style={{ padding: "10px 12px" }}>Roll Number</th>
                <th style={{ padding: "10px 12px" }}>Full Name</th>
                <th style={{ padding: "10px 12px" }}>Hostel</th>
                <th style={{ padding: "10px 12px" }}>College ID Card</th>
                <th style={{ padding: "10px 12px" }}>Turnstile Status</th>
                <th style={{ padding: "10px 12px" }}>Access Control</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.roll} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                  <td style={{ padding: 12, fontWeight: 700, fontFamily: "monospace" }}>{s.roll}</td>
                  <td style={{ padding: 12 }}>
                    <strong>{s.name}</strong>
                    {s.email && <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.email}</div>}
                  </td>
                  <td style={{ padding: 12 }}>{s.hostel}</td>
                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => {
                        setSelectedIdCard(s.id_card_data || null)
                        setSelectedStudentName(`${s.name} (${s.roll})`)
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid var(--line)",
                        background: "rgba(0,0,0,0.03)",
                        fontSize: 11,
                        cursor: "pointer",
                        color: "#0284c7"
                      }}
                    >
                      <IdCard size={13} />
                      <span>Inspect ID</span>
                    </button>
                  </td>
                  <td style={{ padding: 12 }}>
                    <span 
                      style={{
                        background: s.is_allowed ? "#dcfce7" : "#fee2e2",
                        color: s.is_allowed ? "#166534" : "#991b1b",
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    >
                      {s.is_allowed ? "✓ Allowed" : "✕ Barred"}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => handleToggle(s.roll, s.is_allowed)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: s.is_allowed ? "#fee2e2" : "#dcfce7",
                        color: s.is_allowed ? "#991b1b" : "#166534",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      {s.is_allowed ? "Bar Entrance" : "Grant Entrance"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ID Card Modal */}
      {selectedIdCard && (
        <Modal title={`Identity Card · ${selectedStudentName}`} onClose={() => setSelectedIdCard(null)}>
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
              Uploaded college identity card document on file.
            </p>
            <div 
              style={{
                maxWidth: 360,
                margin: "0 auto",
                borderRadius: 12,
                overflow: "hidden",
                border: "2px solid rgba(0,0,0,0.1)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
              }}
            >
              <img 
                src={selectedIdCard} 
                alt="Student ID Document" 
                style={{ width: "100%", height: "auto", display: "block" }} 
              />
            </div>
            <div style={{ marginTop: 18 }}>
              <Button onClick={() => setSelectedIdCard(null)}>Close Document</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
