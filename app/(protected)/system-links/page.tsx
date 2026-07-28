import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireModuleAccess } from "@/lib/require-module-access"
import { departmentScope, propertyWhere } from "@/lib/permissions"
import { getI18n } from "@/lib/i18n/server"

export default async function SystemLinksPage() {
  const session = await requireModuleAccess("system-links")
  const role = session.user.role as Role
  const scope = departmentScope(role, session.user.departmentId)
  const { dict } = await getI18n()

  // Los enlaces sin departamento son generales y los ve cualquiera; los de un
  // departamento, solo quien pertenece a él.
  const scopeFilter =
    scope.kind === "all"
      ? {}
      : scope.kind === "department"
        ? { OR: [{ departmentId: null }, { departmentId: scope.departmentId }] }
        : { departmentId: null }

  // Además, acotados por propiedad (los corporativos, propertyId null, se ven en todas).
  const propFilter = propertyWhere(role, session.user.propertyId)

  const where =
    "OR" in propFilter
      ? { AND: [{ isActive: true, ...scopeFilter }, propFilter] }
      : { isActive: true, ...scopeFilter }

  const links = await prisma.systemLink.findMany({
    where,
    orderBy: { order: "asc" },
    include: { department: true },
  })

  return (
    <div>
      <h1 style={{ color: "var(--crc-brown-dark)", fontSize: "1.5rem", marginBottom: "0.25rem" }}>
        {dict.nav["system-links"]}
      </h1>
      <p style={{ color: "#777", marginBottom: "2rem" }}>
        {dict.systemLinks.subtitle}
      </p>

      {links.length === 0 ? (
        <p style={{ color: "#777" }}>{dict.systemLinks.empty}</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1rem",
          }}
        >
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                textDecoration: "none",
                backgroundColor: "var(--crc-white)",
                borderRadius: 10,
                padding: "1.25rem",
                border: "1px solid var(--crc-border)",
                transition: "transform 0.15s",
              }}
            >
              <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{link.icon}</div>
              <div style={{ fontWeight: 700, color: "var(--crc-brown-dark)", marginBottom: "0.35rem" }}>
                {link.name}
              </div>
              <p style={{ fontSize: "0.85rem", color: "#777", margin: 0 }}>{link.description}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
