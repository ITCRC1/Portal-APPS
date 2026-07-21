import Link from "next/link"
import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireModuleAccess } from "@/lib/require-module-access"
import { departmentScope, canViewAllDepartments } from "@/lib/permissions"

export default async function DepartmentsPage() {
  const session = await requireModuleAccess("departments")
  const role = session.user.role as Role
  const scope = departmentScope(role, session.user.departmentId)

  // El filtro va dentro de la consulta (PRD 13): nadie recibe filas fuera de su alcance.
  const departments =
    scope.kind === "none"
      ? []
      : await prisma.department.findMany({
          where: {
            status: "active",
            ...(scope.kind === "department" ? { id: scope.departmentId } : {}),
          },
          orderBy: { order: "asc" },
          include: { _count: { select: { users: true, systemLinks: true } } },
        })

  return (
    <div>
      <h1 style={{ color: "var(--crc-brown-dark)", fontSize: "1.5rem", marginBottom: "0.25rem" }}>
        Departamentos
      </h1>
      <p style={{ color: "#777", marginBottom: "2rem" }}>
        {canViewAllDepartments(role)
          ? "Todas las áreas de The Costa Rica Collection."
          : "Tu departamento dentro de The Costa Rica Collection."}
      </p>

      {departments.length === 0 ? (
        <div
          style={{
            backgroundColor: "var(--crc-white)",
            borderRadius: 10,
            padding: "2rem",
            textAlign: "center",
            color: "#777",
            border: "1px solid var(--crc-border)",
          }}
        >
          No tienes un departamento asignado todavía. Pídele a un administrador que te asigne uno.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1rem",
          }}
        >
          {departments.map((d) => (
            <Link
              key={d.id}
              href={`/departments/${d.slug}`}
              style={{
                display: "block",
                textDecoration: "none",
                backgroundColor: "var(--crc-white)",
                borderRadius: 10,
                padding: "1.25rem",
                border: "1px solid var(--crc-border)",
              }}
            >
              <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{d.icon}</div>
              <div
                style={{ fontWeight: 700, color: "var(--crc-brown-dark)", marginBottom: "0.35rem" }}
              >
                {d.name}
              </div>
              <p style={{ fontSize: "0.85rem", color: "#777", margin: "0 0 0.75rem" }}>
                {d.description}
              </p>
              <div style={{ fontSize: "0.75rem", color: "#999" }}>
                {d.ownerName ? `Responsable: ${d.ownerName}` : "Sin responsable asignado"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#999" }}>
                {d._count.users} {d._count.users === 1 ? "usuario" : "usuarios"} ·{" "}
                {d._count.systemLinks} {d._count.systemLinks === 1 ? "enlace" : "enlaces"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
