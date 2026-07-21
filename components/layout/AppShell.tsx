"use client"

import { useState } from "react"
import type { Role } from "@prisma/client"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"
import type { NotificationView } from "@/components/layout/NotificationBell"

type Props = {
  role: Role
  user?: {
    name?: string | null
    email?: string | null
    role?: string
  }
  notifications: NotificationView[]
  unreadCount: number
  children: React.ReactNode
}

// El layout protegido es un Server Component y no puede tener estado (useState).
// Este contenedor cliente es el punto más pequeño donde vive el estado del "drawer"
// (menú lateral en móvil): así el botón hamburguesa de la TopBar y el propio Sidebar
// comparten el mismo abierto/cerrado sin tener que volver cliente todo el layout.
// El contenido de cada página (children) se sigue renderizando en el servidor y solo
// se pasa como prop, tal como permite la composición Server/Client de Next.js.
export function AppShell({ role, user, notifications, unreadCount, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = () => setDrawerOpen(false)

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role={role} drawerOpen={drawerOpen} onNavigate={closeDrawer} />

      {/* Overlay para cerrar tocando fuera. Solo se ve en móvil (lo controla el CSS);
          en escritorio el drawer no existe, así que aunque se montara quedaría oculto. */}
      {drawerOpen && <div className="crc-overlay" onClick={closeDrawer} aria-hidden />}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar
          user={user}
          notifications={notifications}
          unreadCount={unreadCount}
          onMenuClick={() => setDrawerOpen(true)}
        />
        <main
          className="crc-main"
          style={{
            flex: 1,
            backgroundColor: "var(--crc-bg)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
