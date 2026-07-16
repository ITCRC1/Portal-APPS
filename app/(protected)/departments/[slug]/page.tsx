import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireModuleAccess } from "@/lib/require-module-access"
import { canAccessDepartment, ROLE_LABELS } from "@/lib/permissions"

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await requireModuleAccess("departments")
  const role = session.user.role as Role

  const department = await prisma.department.findUnique({
    where: { slug },
    include: {
      users: {
        where: { isActive: true },
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true, email: true, role: true },
      },
      systemLinks: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
  })

  if (!department) {
    notFound()
  }

  // Guard: sin esto, un usuario podría abrir el departamento de otra área escribiendo la URL.
  if (!canAccessDepartment(role, session.user.departmentId, department.id)) {
    redirect("/departments")
  }

  return (
    <div>
      <Link
        href="/departments"
        style={{ fontSize: "0.85rem", color: "var(--crc-brown)", textDecoration: "none" }}
      >
        ← Departamentos
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.75rem 0 0.25rem" }}>
        <span style={{ fontSize: "2rem" }}>{department.icon}</span>
        <h1 style={{ color: "var(--crc-brown-dark)", fontSize: "1.5rem", margin: 0 }}>
          {department.name}
        </h1>
      </div>
      <p style={{ color: "#777", marginBottom: "0.5rem" }}>{department.description}</p>
      <p style={{ color: "#999", fontSize: "0.85rem", marginBottom: "2rem" }}>
        {department.ownerName
          ? `Responsable: ${department.ownerName}${department.ownerEmail ? ` · ${department.ownerEmail}` : ""}`
          : "Sin responsable asignado"}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        <section
          style={{
            backgroundColor: "var(--crc-white)",
            borderRadius: 10,
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <h2 style={{ fontSize: "1.05rem", color: "var(--crc-brown-dark)", marginBottom: "1rem" }}>
            Equipo ({department.users.length})
          </h2>
          {department.users.length === 0 ? (
            <p style={{ color: "#777", fontSize: "0.85rem", margin: 0 }}>
              No hay usuarios asignados a este departamento.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {department.users.map((u) => (
                <li
                  key={u.id}
                  style={{ padding: "0.5rem 0", borderBottom: "1px solid #f0ebe3" }}
                >
                  <div style={{ fontWeight: 600, color: "var(--crc-brown-dark)", fontSize: "0.9rem" }}>
                    {u.fullName}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#777" }}>{u.email}</div>
                  <div style={{ fontSize: "0.75rem", color: "#999" }}>{ROLE_LABELS[u.role]}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          style={{
            backgroundColor: "var(--crc-white)",
            borderRadius: 10,
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <h2 style={{ fontSize: "1.05rem", color: "var(--crc-brown-dark)", marginBottom: "1rem" }}>
            Enlaces del departamento ({department.systemLinks.length})
          </h2>
          {department.systemLinks.length === 0 ? (
            <p style={{ color: "#777", fontSize: "0.85rem", margin: 0 }}>
              Este departamento no tiene enlaces propios todavía.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {department.systemLinks.map((l) => (
                <li key={l.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #f0ebe3" }}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--crc-brown-dark)",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      textDecoration: "none",
                    }}
                  >
                    {l.icon} {l.name}
                  </a>
                  {l.description && (
                    <div style={{ fontSize: "0.8rem", color: "#777" }}>{l.description}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
