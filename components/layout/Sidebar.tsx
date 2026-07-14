"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import type { Role } from "@prisma/client"
import { MODULES, getAccessibleModules } from "@/lib/permissions"

type Props = {
  role: Role
}

export function Sidebar({ role }: Props) {
  const pathname = usePathname()
  const accessible = getAccessibleModules(role)
  const links = MODULES.filter((m) => accessible.includes(m.key))

  return (
    <aside
      style={{
        width: 240,
        minHeight: "100vh",
        backgroundColor: "var(--crc-brown-dark)",
        color: "var(--crc-white)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 1rem",
        flexShrink: 0,
      }}
    >
      <div style={{ marginBottom: "2.5rem", padding: "0 0.5rem" }}>
        <Image
          src="/logo.png"
          alt="The Costa Rica Collection"
          width={800}
          height={260}
          style={{ width: "100%", height: "auto" }}
        />
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/")
          return (
            <Link
              key={l.href}
              href={l.href}
              style={{
                padding: "0.6rem 0.75rem",
                borderRadius: 6,
                color: active ? "var(--crc-brown-dark)" : "var(--crc-white)",
                backgroundColor: active ? "var(--crc-gold)" : "transparent",
                textDecoration: "none",
                fontSize: "0.9rem",
                transition: "background-color 0.15s",
              }}
            >
              {l.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
