import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireModuleAccess } from "@/lib/require-module-access"
import { canAccessDepartment, propertyWhere } from "@/lib/permissions"
import { visibleDocumentsWhere } from "@/lib/documents"
import { DocumentCard } from "@/components/documents/DocumentCard"
import { getI18n } from "@/lib/i18n/server"
import { fmt } from "@/lib/i18n/format"

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await requireModuleAccess("departments")
  const role = session.user.role as Role
  const { dict } = await getI18n()

  // Aislamiento por propiedad: el equipo se acota a la propiedad del usuario
  // (+ lo corporativo). Los roles globales lo ven todo.
  const propFilter = propertyWhere(role, session.user.propertyId)
  const propScoped = "OR" in propFilter ? propFilter : {}
  // Cláusula de propiedad reutilizable para combinar con AND en enlaces/documentos.
  const propAnd = "OR" in propFilter ? [propFilter] : []

  const department = await prisma.department.findUnique({
    where: { slug },
    include: {
      users: {
        where: { isActive: true, ...propScoped },
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true, email: true, role: true },
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

  // Por ahora se muestran también los enlaces y documentos generales/corporativos
  // (sin departamento) además de los propios de esta área. Cuando cada cosa se
  // asigne a su departamento, esta vista se acota sola (basta el filtro por
  // departamento; no hay que tocar código).
  const deptOrGeneral = { OR: [{ departmentId: department.id }, { departmentId: null }] }

  const [systemLinks, documents] = await Promise.all([
    prisma.systemLink.findMany({
      where: { isActive: true, AND: [deptOrGeneral, ...propAnd] },
      orderBy: { order: "asc" },
    }),
    prisma.document.findMany({
      where: {
        AND: [
          visibleDocumentsWhere(role, session.user.departmentId, session.user.propertyId),
          deptOrGeneral,
        ],
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        fileName: true,
        size: true,
        confidentiality: true,
      },
    }),
  ])

  return (
    <div>
      <Link
        href="/departments"
        style={{ fontSize: "0.85rem", color: "var(--crc-brown)", textDecoration: "none" }}
      >
        ← {dict.nav.departments}
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.75rem 0 0.25rem" }}>
        <span style={{ fontSize: "2rem" }}>{department.icon}</span>
        <h1 style={{ color: "var(--crc-brown-dark)", fontSize: "1.5rem", margin: 0 }}>
          {department.name}
        </h1>
      </div>
      <p style={{ color: "#777", marginBottom: "0.5rem" }}>
        {dict.deptDescriptions[department.slug as keyof typeof dict.deptDescriptions] ?? department.description}
      </p>
      <p style={{ color: "#999", fontSize: "0.85rem", marginBottom: "2rem" }}>
        {department.ownerName
          ? fmt(dict.departments.owner, { name: department.ownerName })
          : dict.departments.noOwner}
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
            border: "1px solid var(--crc-border)",
          }}
        >
          <h2 style={{ fontSize: "1.05rem", color: "var(--crc-brown-dark)", marginBottom: "1rem" }}>
            {dict.departmentDetail.team} ({department.users.length})
          </h2>
          {department.users.length === 0 ? (
            <p style={{ color: "#777", fontSize: "0.85rem", margin: 0 }}>
              {dict.departmentDetail.noTeam}
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
                  <div style={{ fontSize: "0.75rem", color: "#999" }}>{dict.roles[u.role]}</div>
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
            border: "1px solid var(--crc-border)",
          }}
        >
          <h2 style={{ fontSize: "1.05rem", color: "var(--crc-brown-dark)", marginBottom: "1rem" }}>
            {dict.departmentDetail.links} ({systemLinks.length})
          </h2>
          {systemLinks.length === 0 ? (
            <p style={{ color: "#777", fontSize: "0.85rem", margin: 0 }}>
              {dict.departmentDetail.noLinks}
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {systemLinks.map((l) => (
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

      <section style={{ marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1.05rem", color: "var(--crc-brown-dark)", marginBottom: "1rem" }}>
          {dict.nav.documents} ({documents.length})
        </h2>
        {documents.length === 0 ? (
          <div
            style={{
              backgroundColor: "var(--crc-white)",
              borderRadius: 10,
              padding: "1.5rem",
              color: "#777",
              fontSize: "0.85rem",
              border: "1px solid var(--crc-border)",
            }}
          >
            {dict.departmentDetail.noDocuments}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1rem",
            }}
          >
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
