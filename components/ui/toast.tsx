"use client"

import { useEffect, useState } from "react"

type ToastType = "success" | "error"
type ToastItem = { id: number; message: string; type: ToastType }
type Listener = (t: ToastItem) => void

let listeners: Listener[] = []
let counter = 0

function emit(message: string, type: ToastType) {
  const item: ToastItem = { id: ++counter, message, type }
  listeners.forEach((l) => l(item))
}

export const toast = {
  success: (message: string) => emit(message, "success"),
  error: (message: string) => emit(message, "error"),
}

const COLORS: Record<ToastType, { accent: string; icon: string }> = {
  success: { accent: "var(--crc-green)", icon: "✓" },
  error: { accent: "#a33", icon: "✕" },
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    const listener: Listener = (t) => {
      setItems((prev) => [...prev, t])
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id))
      }, 3500)
    }
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {items.map((t) => {
        const c = COLORS[t.type]
        return (
          <div
            key={t.id}
            role="status"
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
              minWidth: 260,
              maxWidth: 380,
              padding: "0.8rem 1rem",
              borderRadius: 10,
              background: "var(--crc-white)",
              borderLeft: `4px solid ${c.accent}`,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              animation: "crcToastIn 0.25s ease-out",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 26,
                height: 26,
                borderRadius: 999,
                background: c.accent,
                color: "var(--crc-white)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.85rem",
                fontWeight: 700,
              }}
            >
              {c.icon}
            </span>
            <span style={{ fontSize: "0.88rem", color: "var(--crc-brown-dark)", lineHeight: 1.35 }}>
              {t.message}
            </span>
          </div>
        )
      })}
    </div>
  )
}
