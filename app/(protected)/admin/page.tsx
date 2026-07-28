import { UsersPanel } from "@/components/admin/UsersPanel"
import { DepartmentsPanel } from "@/components/admin/DepartmentsPanel"
import { DocumentsPanel } from "@/components/admin/DocumentsPanel"
import { AuditExport } from "@/components/admin/AuditExport"
import { getI18n } from "@/lib/i18n/server"

export default async function AdminPage() {
  const { dict } = await getI18n()
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ color: "var(--crc-brown-dark)", fontSize: "1.5rem", marginBottom: "0.25rem" }}>
          {dict.admin.title}
        </h1>
        <p style={{ color: "#777" }}>
          {dict.admin.subtitle}
        </p>
      </div>

      <UsersPanel />
      <DepartmentsPanel />
      <DocumentsPanel />
      <AuditExport />
    </div>
  )
}
