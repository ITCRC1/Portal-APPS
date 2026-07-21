import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireModuleAccess } from "@/lib/require-module-access"
import { visibleDocumentsWhere } from "@/lib/documents"
import { DocumentCard } from "@/components/documents/DocumentCard"

export default async function DocumentsPage() {
  const session = await requireModuleAccess("documents")
  const role = session.user.role as Role

  const documents = await prisma.document.findMany({
    where: visibleDocumentsWhere(role, session.user.departmentId),
    orderBy: [{ department: { order: "asc" } }, { order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      fileName: true,
      size: true,
      confidentiality: true,
      department: { select: { name: true } },
    },
  })

  return (
    <div>
      <h1 style={{ color: "var(--crc-brown-dark)", fontSize: "1.5rem", marginBottom: "0.25rem" }}>
        Centro de Documentos
      </h1>
      <p style={{ color: "#777", marginBottom: "2rem" }}>
        Documentos internos disponibles según tu rol y departamento.
      </p>

      {documents.length === 0 ? (
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
          No hay documentos disponibles para ti todavía.
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
    </div>
  )
}
