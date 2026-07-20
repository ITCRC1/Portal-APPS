"use client"

import { signOut } from "next-auth/react"
import type { Role } from "@prisma/client"
import { ROLE_LABELS } from "@/lib/permissions"
import { NotificationBell, type NotificationView } from "@/components/layout/NotificationBell"

type Props = {
  user?: {
    name?: string | null
    email?: string | null
    role?: string
  }
  notifications?: NotificationView[]
  unreadCount?: number
}

export function TopBar({ user, notifications = [], unreadCount = 0 }: Props) {
  const today = new Date().toLocaleDateString("es-CR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 1.5rem",
        backgroundColor: "var(--crc-white)",
        borderBottom: "1px solid #e5ddd3",
      }}
    >
      <div style={{ fontSize: "0.85rem", color: "var(--crc-brown-dark)", textTransform: "capitalize" }}>
        {today}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--crc-brown-dark)" }}>
            {user?.name}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#888" }}>
            {user?.role ? ROLE_LABELS[user.role as Role] : ""}
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
          Salir
        </button>
      </div>
    </header>
  )
}
