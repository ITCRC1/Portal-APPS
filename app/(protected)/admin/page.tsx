import { PasswordRequestsPanel } from "@/components/admin/PasswordRequestsPanel"
import { UsersPanel } from "@/components/admin/UsersPanel"
import { DepartmentsPanel } from "@/components/admin/DepartmentsPanel"
import { DocumentsPanel } from "@/components/admin/DocumentsPanel"

export default function AdminPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ color: "var(--crc-brown-dark)", fontSize: "1.5rem", marginBottom: "0.25rem" }}>
          Panel de Administración
        </h1>
        <p style={{ color: "#777" }}>
          Enlaces, KPIs, anuncios, alertas y tareas se irán agregando aquí.
        </p>
      </div>

      <PasswordRequestsPanel />
      <UsersPanel />
      <DepartmentsPanel />
      <DocumentsPanel />
    </div>
  )
}
