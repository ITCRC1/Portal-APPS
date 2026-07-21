"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import type { Role } from "@prisma/client"
import { MODULES, getAccessibleModules, ROLE_LABELS, type ModuleKey } from "@/lib/permissions"

type Props = {
  role: Role
  // Estado del drawer en móvil (en escritorio el sidebar siempre está visible).
  drawerOpen?: boolean
  // Se llama al navegar para cerrar el drawer en móvil.
  onNavigate?: () => void
}

// Íconos por módulo (trazo, 18px) — hacen el menú mucho más escaneable.
const ICONS: Record<ModuleKey, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  departments: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 9h.01M12 9h.01M15 9h.01M9 13h.01M12 13h.01M15 13h.01M9 17h.01M12 17h.01M15 17h.01" />
    </>
  ),
  documents: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h8" />
    </>
  ),
  "system-links": (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  alerts: (
    <>
      <path d="M3 11l18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </>
  ),
  tasks: (
    <>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  admin: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
}

function NavIcon({ k }: { k: ModuleKey }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
      aria-hidden
    >
      {ICONS[k]}
    </svg>
  )
}

export function Sidebar({ role, drawerOpen = false, onNavigate }: Props) {
  const pathname = usePathname()
  const accessible = getAccessibleModules(role)
  const links = MODULES.filter((m) => accessible.includes(m.key))

  return (
    // El tamaño/posición (sticky en escritorio, drawer deslizable en móvil) se controla
    // desde CSS con .crc-sidebar; aquí solo quedan los estilos visuales, sin cambios.
    <aside
      className={`crc-sidebar${drawerOpen ? " crc-sidebar-open" : ""}`}
      style={{
        backgroundColor: "var(--crc-brown-dark)",
        color: "var(--crc-white)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 1rem",
      }}
    >
      <div style={{ marginBottom: "2rem", padding: "0 0.5rem" }}>
        <Image
          src="/logo.png"
          alt="The Costa Rica Collection"
          width={800}
          height={260}
          style={{ width: "100%", height: "auto" }}
        />
      </div>

      <div
        style={{
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)",
          padding: "0 0.75rem",
          marginBottom: "0.6rem",
        }}
      >
        Menú
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/")
          return (
            <Link
              key={l.href}
              href={l.href}
              className="crc-nav-link"
              // Al elegir un módulo se cierra el drawer en móvil (en escritorio no aplica).
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.7rem",
                padding: "0.6rem 0.75rem",
                borderRadius: 8,
                color: active ? "var(--crc-brown-dark)" : "rgba(255,255,255,0.85)",
                backgroundColor: active ? "var(--crc-gold)" : "transparent",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: active ? 600 : 500,
              }}
            >
              <NavIcon k={l.key} />
              {l.label}
            </Link>
          )
        })}
      </nav>

      {/* Pie: rol del usuario, para dar contexto de dónde está parado. */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "1.25rem",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          fontSize: "0.72rem",
          color: "rgba(255,255,255,0.45)",
          padding: "1.25rem 0.75rem 0",
        }}
      >
        {ROLE_LABELS[role]}
      </div>
    </aside>
  )
}
