"use client"

import { signOut } from "next-auth/react"
import type { Role } from "@prisma/client"
import { NotificationBell, type NotificationView } from "@/components/layout/NotificationBell"
import { GlobalSearch } from "@/components/layout/GlobalSearch"
import { LanguageToggle } from "@/components/layout/LanguageToggle"
import { useI18n } from "@/lib/i18n/client"

type Props = {
  user?: {
    name?: string | null
    email?: string | null
    role?: string
  }
  notifications?: NotificationView[]
  unreadCount?: number
  // Abre el drawer en móvil; lo provee AppShell (que guarda el estado).
  onMenuClick?: () => void
}

export function TopBar({ user, notifications = [], unreadCount = 0, onMenuClick }: Props) {
  const { locale, dict } = useI18n()
  const rawToday = new Date().toLocaleDateString(locale === "es" ? "es-CR" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  // "martes, 21 de julio de 2026" -> "Martes, 21 de julio de 2026" (solo la inicial).
  const today = rawToday.charAt(0).toUpperCase() + rawToday.slice(1)

  return (
    // El padding se define en .crc-topbar para poder reducirlo en móvil vía media query.
    <header
      className="crc-topbar"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "var(--crc-white)",
        borderBottom: "1px solid #e5ddd3",
      }}
    >
      {/* Botón hamburguesa: solo visible en móvil (.crc-menu-btn); abre el menú lateral. */}
      <button
        type="button"
        onClick={onMenuClick}
        className="crc-menu-btn"
        aria-label={dict.topbar.openMenu}
        style={{
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 8,
          border: "1px solid #e5ddd3",
          backgroundColor: "var(--crc-white)",
          color: "var(--crc-brown-dark)",
          flexShrink: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* La fecha se oculta en móvil (.crc-topbar-date) para dejar espacio al buscador. */}
      <div className="crc-topbar-date" style={{ fontSize: "0.85rem", color: "var(--crc-muted)", flexShrink: 0 }}>
        {today}
      </div>
      <GlobalSearch />
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
        <LanguageToggle />
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        {/* Nombre/rol: se ocultan en móvil (ya aparecen en el pie del sidebar). */}
        <div className="crc-topbar-user" style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--crc-brown-dark)" }}>
            {user?.name}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#888" }}>
            {user?.role ? dict.roles[user.role as Role] : ""}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            padding: "0.4rem 0.8rem",
            borderRadius: 6,
            border: "1px solid var(--crc-brown)",
            backgroundColor: "transparent",
            color: "var(--crc-brown-dark)",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          {dict.topbar.signOut}
        </button>
      </div>
    </header>
  )
}
