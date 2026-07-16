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
  fontSize: "0.85rem",
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

// Los campos de la tabla se estiran a su celda; table-layout: fixed les da el ancho.
const cellInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding: "0.4rem 0.45rem",
  borderRadius: 6,
  border: "1px solid var(--crc-brown)",
  backgroundColor: "var(--crc-white)",
  color: "var(--crc-brown-dark)",
  fontSize: "0.8rem",
}

const outlineButtonStyle: CSSProperties = {
  padding: "0.4rem 0.5rem",
  borderRadius: 6,
  border: "1px solid var(--crc-brown)",
  backgroundColor: "var(--crc-white)",
  color: "var(--crc-brown-dark)",
  cursor: "pointer",
  fontSize: "0.75rem",
  whiteSpace: "nowrap",
}

const primaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: "0.4rem 0.5rem",
  borderRadius: 6,
  border: "none",
  backgroundColor: "var(--crc-green)",
  color: "var(--crc-white)",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.75rem",
  whiteSpace: "nowrap",
}

const thStyle: CSSProperties = {
  padding: "0.4rem 0.35rem",
  fontSize: "0.75rem",
  fontWeight: 600,
  whiteSpace: "nowrap",
}

const tdStyle: CSSProperties = { padding: "0.4rem 0.35rem", verticalAlign: "middle" }

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
                  <button type="submit" style={{ ...outlineButtonStyle, padding: "0.5rem 0.75rem", fontSize: "0.8rem" }}>
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
        <form
          action={createUser}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "1rem",
            alignItems: "end",
          }}
        >
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

          <button
            type="submit"
            style={{
              padding: "0.6rem 1rem",
              borderRadius: 6,
              border: "none",
              backgroundColor: "var(--crc-green)",
              color: "var(--crc-white)",
              fontWeight: 600,
              cursor: "pointer",
              height: "fit-content",
            }}
          >
            Crear usuario
          </button>
        </form>
      </section>

      <section style={cardStyle}>
        <h2 style={{ fontSize: "1.05rem", color: "var(--crc-brown-dark)", marginBottom: "0.35rem" }}>
          Usuarios existentes ({users.length})
        </h2>
        <p style={{ color: "#777", fontSize: "0.85rem", marginBottom: "1rem" }}>
          Edita el nombre, correo, rol o departamento y pulsa Guardar en esa fila.
        </p>

        {/* table-layout: fixed + anchos en % => la tabla siempre cabe, sin scroll horizontal. */}
        <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
          <colgroup>
            <col style={{ width: "14%" }} />
            <col style={{ width: "19%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "11%" }} />
          </colgroup>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e5ddd3", color: "#888" }}>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Correo</th>
              <th style={thStyle}>Rol</th>
              <th style={thStyle}>Departamento</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}></th>
              <th style={thStyle}>Nueva clave</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              // Un <form> no puede envolver varias celdas, así que los campos se asocian
              // al formulario de su fila con el atributo form.
              const editFormId = `edit-${u.id}`

              return (
                // defaultValue solo aplica al montar: sin updatedAt en la key, tras guardar
                // los campos seguirían mostrando el valor anterior.
                <tr
                  key={`${u.id}-${u.updatedAt.toISOString()}`}
                  style={{ borderBottom: "1px solid #f0ebe3" }}
                >
                  <td style={tdStyle}>
                    <input
                      form={editFormId}
                      name="fullName"
                      defaultValue={u.fullName}
                      required
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      form={editFormId}
                      type="email"
                      name="email"
                      defaultValue={u.email}
                      required
                      title={u.email}
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <select form={editFormId} name="role" defaultValue={u.role} style={cellInputStyle}>
                      {Object.values(Role).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <select
                      form={editFormId}
                      name="departmentId"
                      defaultValue={u.departmentId ?? ""}
                      style={cellInputStyle}
                    >
                      <option value="">Sin departamento</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.15rem 0.45rem",
                        borderRadius: 999,
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        backgroundColor: u.isActive ? "#e6f0e0" : "#f3e6e6",
                        color: u.isActive ? "var(--crc-green)" : "#a33",
                      }}
                    >
                      {u.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <form id={editFormId} action={updateUser}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button type="submit" style={primaryButtonStyle}>
                        Guardar
                      </button>
                    </form>
                  </td>
                  <td style={tdStyle}>
                    <form
                      action={resetPassword}
                      style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}
                    >
                      <input type="hidden" name="userId" value={u.id} />
                      <input
                        type="text"
                        name="password"
                        placeholder="Clave"
                        required
                        style={cellInputStyle}
                      />
                      <button type="submit" title="Actualizar contraseña" style={outlineButtonStyle}>
                        OK
                      </button>
                    </form>
                  </td>
                  <td style={tdStyle}>
                    <form action={toggleUserActive}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="nextActive" value={(!u.isActive).toString()} />
                      <button type="submit" style={{ ...outlineButtonStyle, width: "100%" }}>
                        {u.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
