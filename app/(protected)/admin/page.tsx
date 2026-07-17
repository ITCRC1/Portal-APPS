import { PasswordRequestsPanel } from "@/components/admin/PasswordRequestsPanel"
import { UsersPanel } from "@/components/admin/UsersPanel"
import { DepartmentsPanel } from "@/components/admin/DepartmentsPanel"
import { DocumentsPanel } from "@/components/admin/DocumentsPanel"
import { AuditLogPanel } from "@/components/admin/AuditLogPanel"

export default function AdminPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ color: "var(--crc-brown-dark)", fontSize: "1.5rem", marginBottom: "0.25rem" }}>
          Panel de Administración
        </h1>
        <p style={{ color: "#777" }}>
          Usuarios, departamentos, documentos, tickets de contraseña y bitácora de auditoría.
        </p>
      </div>

      <PasswordRequestsPanel />
      <UsersPanel />
      <DepartmentsPanel />
      <DocumentsPanel />
      <AuditLogPanel />
    </div>
  )
}
