import React, { useEffect, useState } from "react"
import QRCodeLib from "qrcode"

interface QRCodeProps {
  value?: string
  size?: number
  light?: boolean
  className?: string
}

export function QRCode({
  value = "IIITA-MESS-ACCESS-DEFAULT",
  size = 200,
  light = false,
  className = "",
}: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const textToEncode = typeof value === "string" ? value : JSON.stringify(value)

    QRCodeLib.toDataURL(textToEncode, {
      width: size * 2, // 2x for sharp retina rendering
      margin: 1,
      color: {
        dark: light ? "#0f172a" : "#000000",
        light: light ? "#ffffff" : "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url)
          setError(null)
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn("QR code generation error", err)
          setError("Failed to render QR code")
        }
      })

    return () => {
      isMounted = false
    }
  }, [value, size, light])

  if (error) {
    return (
      <div 
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fee2e2",
          color: "#991b1b",
          fontSize: 11,
          borderRadius: 8,
          padding: 8,
          textAlign: "center"
        }}
      >
        {error}
      </div>
    )
  }

  if (!dataUrl) {
    return (
      <div 
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.05)",
          borderRadius: 8
        }}
      >
        <span style={{ fontSize: 11, opacity: 0.6 }}>Generating QR...</span>
      </div>
    )
  }

  return (
    <div 
      className={`qr-code-wrapper ${className}`}
      style={{
        display: "inline-block",
        padding: 8,
        background: "#ffffff",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        border: "1px solid rgba(0, 0, 0, 0.08)"
      }}
    >
      <img
        src={dataUrl}
        alt="Student Entry QR Code"
        width={size}
        height={size}
        style={{ display: "block", width: size, height: size, imageRendering: "pixelated" }}
      />
    </div>
  )
}
