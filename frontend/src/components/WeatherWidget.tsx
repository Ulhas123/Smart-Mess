import React, { useEffect, useState } from "react"
import { 
  Cloud, 
  CloudDrizzle, 
  CloudLightning, 
  CloudRain, 
  CloudSun, 
  Droplets, 
  MapPin, 
  RefreshCw, 
  Sun, 
  Thermometer, 
  Wind 
} from "lucide-react"
import { fetchWeather } from "../services/api"
import type { WeatherData } from "../types"

function getWeatherIcon(iconName: string, size = 18) {
  switch (iconName) {
    case "sunny":
      return <Sun size={size} className="text-amber-400" />
    case "partly-cloudy":
      return <CloudSun size={size} className="text-sky-400" />
    case "cloudy":
      return <Cloud size={size} className="text-slate-400" />
    case "rain":
    case "heavy-rain":
      return <CloudRain size={size} className="text-blue-400" />
    case "storm":
      return <CloudLightning size={size} className="text-purple-400" />
    default:
      return <Sun size={size} className="text-amber-400" />
  }
}

export function WeatherWidget({
  variant = "card",
  className = "",
}: {
  variant?: "compact" | "card" | "header"
  className?: string
}) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  const loadWeather = async (force = false) => {
    setLoading(true)
    try {
      const data = await fetchWeather(force)
      setWeather(data)
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
    } catch (e) {
      console.warn("Weather widget load error", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWeather()
    // Periodic refresh every 10 minutes
    const timer = setInterval(() => loadWeather(true), 10 * 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  if (!weather) {
    return (
      <div className={`weather-badge-loading ${className}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8, background: "rgba(0,0,0,0.04)", fontSize: 12 }}>
        <RefreshCw size={14} className="spin" />
        <span>Loading Prayagraj weather...</span>
      </div>
    )
  }

  // Header / Compact Variant (fits in navbars and headers)
  if (variant === "header" || variant === "compact") {
    return (
      <div 
        className={`weather-widget-compact ${className}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(255, 255, 255, 0.06)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 24,
          padding: "5px 14px",
          fontSize: 12,
          color: "inherit"
        }}
        title={`Prayagraj, UP: ${weather.condition}, Humidity: ${weather.humidity}%, Wind: ${weather.wind_speed_kmh} km/h (Updated: ${lastUpdated || weather.updated_at})`}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={13} style={{ color: "#38bdf8" }} />
          <span style={{ fontWeight: 600 }}>Prayagraj, UP</span>
        </div>
        <span style={{ opacity: 0.4 }}>|</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {getWeatherIcon(weather.icon, 16)}
          <span style={{ fontWeight: 700 }}>{Math.round(weather.temperature)}°C</span>
          <span style={{ opacity: 0.8, fontSize: 11 }}>{weather.condition}</span>
        </div>
        <button
          onClick={() => loadWeather(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 2,
            color: "inherit",
            opacity: 0.6,
            display: "flex",
            alignItems: "center"
          }}
          aria-label="Refresh weather"
          title="Refresh live Prayagraj weather"
        >
          <RefreshCw size={12} className={loading ? "spin" : ""} />
        </button>
      </div>
    )
  }

  // Card Variant (fits nicely inside dashboard sections)
  return (
    <div 
      className={`weather-card ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.85) 100%)",
        border: "1px solid rgba(56, 189, 248, 0.2)",
        borderRadius: 14,
        padding: "16px 20px",
        color: "#ffffff",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Background glow accent */}
      <div 
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 90,
          height: 90,
          background: weather.is_rainy ? "rgba(56, 189, 248, 0.15)" : "rgba(251, 191, 36, 0.15)",
          borderRadius: "50%",
          filter: "blur(30px)",
          pointerEvents: "none"
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#38bdf8", fontWeight: 700 }}>
            <MapPin size={13} />
            <span>Prayagraj, Uttar Pradesh</span>
            <span style={{ fontSize: 9, background: "rgba(56, 189, 248, 0.15)", padding: "2px 6px", borderRadius: 4, textTransform: "none" }}>Live Free API</span>
          </div>
          <h4 style={{ fontSize: 18, fontWeight: 600, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <span>{weather.condition}</span>
            <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}>
              Feels {Math.round(weather.apparent_temperature)}°C
            </span>
          </h4>
        </div>

        <button
          onClick={() => loadWeather(true)}
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 6,
            padding: "5px 8px",
            color: "#ffffff",
            fontSize: 11,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4
          }}
          title="Refresh weather data"
        >
          <RefreshCw size={12} className={loading ? "spin" : ""} />
          <span>Sync</span>
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {getWeatherIcon(weather.icon, 36)}
          <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{Math.round(weather.temperature)}°C</span>
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          <span>High: {Math.round(weather.temp_max)}°C</span> · <span>Low: {Math.round(weather.temp_min)}°C</span>
        </div>
      </div>

      <div 
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          background: "rgba(0, 0, 0, 0.25)",
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 11
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Droplets size={14} style={{ color: "#38bdf8" }} />
          <div>
            <div style={{ opacity: 0.6 }}>Humidity</div>
            <div style={{ fontWeight: 600 }}>{weather.humidity}%</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Wind size={14} style={{ color: "#a5b4fc" }} />
          <div>
            <div style={{ opacity: 0.6 }}>Wind</div>
            <div style={{ fontWeight: 600 }}>{weather.wind_speed_kmh} km/h</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <CloudRain size={14} style={{ color: weather.is_rainy ? "#60a5fa" : "#94a3b8" }} />
          <div>
            <div style={{ opacity: 0.6 }}>Precipitation</div>
            <div style={{ fontWeight: 600 }}>{weather.precipitation_mm} mm</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: 10, opacity: 0.5 }}>
        <span>Campus coordinates: 25.4358° N, 81.8463° E</span>
        <span>Updated: {lastUpdated || weather.updated_at}</span>
      </div>
    </div>
  )
}
