"use client"

import { useEffect, useRef } from "react"
import { signOut } from "next-auth/react"

// Cierra la sesión tras este tiempo sin actividad del usuario.
const IDLE_MS = 60_000 // 1 minuto

export function IdleTimeout() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const logout = () => {
      signOut({ callbackUrl: "/login" })
    }

    const reset = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(logout, IDLE_MS)
    }

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"]
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset() // arranca el conteo al montar

    return () => {
      if (timer.current) clearTimeout(timer.current)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [])

  return null
}
