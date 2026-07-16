import type { CSSProperties } from "react"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { ROLE_LABELS } from "@/lib/permissions"
import { createUser, updateUser, resetPassword, toggleUserActive } from "@/lib/actions/users"
import { resolvePasswordChangeRequest } from "@/lib/actions/password-requests"

const DEFAULT_PASSWORD = "12345678"

const cardStyle: CSSProperties = {
  backgroundColor: "var(--crc-white)",
  borderRadius: 10,
  padding: "1.5rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
}

const labelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
  fontSize: "0.8rem",
  color: "var(--crc-brown)",
}

const inputStyle: CSSProperties = {
  padding: "0.55rem 0.65rem",
  borderRadius: 6,
  border: "1px solid var(--crc-brown)",
  backgroundColor: "var(--crc-white)",
  color: "var(--crc-brown-dark)",
  minWidth: 0,
}

const fieldGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "0.75rem",
}

const outlineButtonStyle: CSSProperties = {
  padding: "0.5rem 0.75rem",
  borderRadius: 6,
  border: "1px solid var(--crc-brown)",
  backgroundColor: "var(--crc-white)",
  color: "var(--crc-brown-dark)",
  cursor: "pointer",
  fontSize: "0.8rem",
  whiteSpace: "nowrap",
}

const primaryButtonStyle: CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: 6,
  border: "none",
  backgroundColor: "var(--crc-green)",
  color: "var(--crc-white)",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.8rem",
  whiteSpace: "nowrap",
}

export default async function AdminPage() {
  const [users, departments, pendingRequests] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { department: true },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.passwordChangeRequest.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
    }),
  ])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ color: "var(--crc-brown-dark)", fontSize: "1.5rem", marginBottom: "0.25rem" }}>
          Panel de Administración
        </h1>
        <p style={{ color: "#777" }}>
          Departamentos, enlaces, documentos, KPIs, anuncios, alertas y tareas se irán agregando aquí.
        </p>
      </div>

      {pendingRequests.length > 0 && (
        <section style={{ ...cardStyle, borderLeft: "4px solid var(--crc-gold)" }}>
          <h2 style={{ fontSize: "1.05rem", color: "var(--crc-brown-dark)", marginBottom: "1rem" }}>
            Solicitudes de cambio de contraseña ({pendingRequests.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {pendingRequests.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                  padding: "0.75rem",
                  borderRadius: 8,
                  backgroundColor: "var(--crc-sand)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "var(--crc-brown-dark)", fontSize: "0.9rem" }}>
                    {r.email}
                  </div>
                  {r.message && <div style={{ fontSize: "0.8rem", color: "#777" }}>{r.message}</div>}
                  <div style={{ fontSize: "0.75rem", color: "#999" }}>
                    {r.createdAt.toLocaleString("es-CR")}
                  </div>
                </div>
                <form action={resolvePasswordChangeRequest}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" style={outlineButtonStyle}>
                    Marcar resuelta
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={cardStyle}>
        <h2 style={{ fontSize: "1.05rem", color: "var(--crc-brown-dark)", marginBottom: "1rem" }}>
          Crear usuario
        </h2>
        <form action={createUser} style={{ ...fieldGridStyle, alignItems: "end", gap: "1rem" }}>
          <label style={labelStyle}>
            Nombre completo
            <input name="fullName" required style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Correo
            <input type="email" name="email" required style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Rol
            <select name="role" defaultValue={Role.READ_ONLY_USER} style={inputStyle}>
              {Object.values(Role).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Departamento
            <select name="departmentId" defaultValue="" style={inputStyle}>
              <option value="">Sin departamento</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Contraseña
            <input type="text" name="password" defaultValue={DEFAULT_PASSWORD} required style={inputStyle} />
          </label>

          <button type="submit" style={{ ...primaryButtonStyle, padding: "0.6rem 1rem", height: "fit-content" }}>
            Crear usuario
          </button>
        </form>
      </section>

      <section style={cardStyle}>
        <h2 style={{ fontSize: "1.05rem", color: "var(--crc-brown-dark)", marginBottom: "0.35rem" }}>
          Usuarios existentes ({users.length})
        </h2>
        <p style={{ color: "#777", fontSize: "0.85rem", marginBottom: "1rem" }}>
          Edita los campos que necesites y pulsa Guardar en ese usuario.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {users.map((u) => {
            const editFormId = `edit-${u.id}`

            return (
              // defaultValue solo aplica al montar: sin updatedAt en la key, tras guardar
              // los campos seguirían mostrando el valor anterior.
              <div
                key={`${u.id}-${u.updatedAt.toISOString()}`}
                style={{
                  border: "1px solid #e5ddd3",
                  borderRadius: 8,
                  padding: "1rem",
                  backgroundColor: "var(--crc-sand)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span style={{ fontWeight: 700, color: "var(--crc-brown-dark)" }}>{u.fullName}</span>
                  <span
                    style={{
                      padding: "0.15rem 0.5rem",
                      borderRadius: 999,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      backgroundColor: u.isActive ? "#e6f0e0" : "#f3e6e6",
                      color: u.isActive ? "var(--crc-green)" : "#a33",
                    }}
                  >
                    {u.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <form id={editFormId} action={updateUser} style={fieldGridStyle}>
                  <input type="hidden" name="userId" value={u.id} />

                  <label style={labelStyle}>
                    Nombre completo
                    <input name="fullName" defaultValue={u.fullName} required style={inputStyle} />
                  </label>

                  <label style={labelStyle}>
                    Correo
                    <input type="email" name="email" defaultValue={u.email} required style={inputStyle} />
                  </label>

                  <label style={labelStyle}>
                    Rol
                    <select name="role" defaultValue={u.role} style={inputStyle}>
                      {Object.values(Role).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={labelStyle}>
                    Departamento
                    <select name="departmentId" defaultValue={u.departmentId ?? ""} style={inputStyle}>
                      <option value="">Sin departamento</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </form>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginTop: "0.85rem",
                    paddingTop: "0.85rem",
                    borderTop: "1px solid #e5ddd3",
                  }}
                >
                  {/* El botón vive fuera del <form> para alinearlo con las demás acciones. */}
                  <button type="submit" form={editFormId} style={primaryButtonStyle}>
                    Guardar
                  </button>

                  <div style={{ flex: 1 }} />

                  <form action={resetPassword} style={{ display: "flex", gap: "0.4rem" }}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input
                      type="text"
                      name="password"
                      placeholder="Nueva clave"
                      required
                      style={{ ...inputStyle, padding: "0.5rem", fontSize: "0.8rem", width: 130 }}
                    />
                    <button type="submit" style={outlineButtonStyle}>
                      Actualizar
                    </button>
                  </form>

                  <form action={toggleUserActive}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="nextActive" value={(!u.isActive).toString()} />
                    <button type="submit" style={outlineButtonStyle}>
                      {u.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
