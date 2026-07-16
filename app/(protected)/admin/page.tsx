import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { ROLE_LABELS } from "@/lib/permissions"
import { createUser, resetPassword, toggleUserActive } from "@/lib/actions/users"
import { resolvePasswordChangeRequest } from "@/lib/actions/password-requests"

const DEFAULT_PASSWORD = "12345678"

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
        <section
          style={{
            backgroundColor: "var(--crc-white)",
            borderRadius: 10,
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            borderLeft: "4px solid var(--crc-gold)",
          }}
        >
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
                  {r.message && (
                    <div style={{ fontSize: "0.8rem", color: "#777" }}>{r.message}</div>
                  )}
                  <div style={{ fontSize: "0.75rem", color: "#999" }}>
                    {r.createdAt.toLocaleString("es-CR")}
                  </div>
                </div>
                <form action={resolvePasswordChangeRequest}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    style={{
                      padding: "0.4rem 0.65rem",
                      borderRadius: 6,
                      border: "1px solid var(--crc-brown)",
                      backgroundColor: "transparent",
                      color: "var(--crc-brown-dark)",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Marcar resuelta
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      <section
        style={{
          backgroundColor: "var(--crc-white)",
          borderRadius: 10,
          padding: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ fontSize: "1.05rem", color: "var(--crc-brown-dark)", marginBottom: "1rem" }}>
          Crear usuario
        </h2>
        <form
          action={createUser}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            alignItems: "end",
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "var(--crc-brown)" }}>
            Nombre completo
            <input
              name="fullName"
              required
              style={{ padding: "0.55rem 0.65rem", borderRadius: 6, border: "1px solid var(--crc-brown)" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "var(--crc-brown)" }}>
            Correo
            <input
              type="email"
              name="email"
              required
              style={{ padding: "0.55rem 0.65rem", borderRadius: 6, border: "1px solid var(--crc-brown)" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "var(--crc-brown)" }}>
            Rol
            <select
              name="role"
              defaultValue={Role.READ_ONLY_USER}
              style={{ padding: "0.55rem 0.65rem", borderRadius: 6, border: "1px solid var(--crc-brown)" }}
            >
              {Object.values(Role).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "var(--crc-brown)" }}>
            Departamento
            <select
              name="departmentId"
              defaultValue=""
              style={{ padding: "0.55rem 0.65rem", borderRadius: 6, border: "1px solid var(--crc-brown)" }}
            >
              <option value="">Sin departamento</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "var(--crc-brown)" }}>
            Contraseña
            <input
              type="text"
              name="password"
              defaultValue={DEFAULT_PASSWORD}
              required
              style={{ padding: "0.55rem 0.65rem", borderRadius: 6, border: "1px solid var(--crc-brown)" }}
            />
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

      <section
        style={{
          backgroundColor: "var(--crc-white)",
          borderRadius: 10,
          padding: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflowX: "auto",
        }}
      >
        <h2 style={{ fontSize: "1.05rem", color: "var(--crc-brown-dark)", marginBottom: "1rem" }}>
          Usuarios existentes
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e5ddd3", color: "#888" }}>
              <th style={{ padding: "0.5rem" }}>Nombre</th>
              <th style={{ padding: "0.5rem" }}>Correo</th>
              <th style={{ padding: "0.5rem" }}>Rol</th>
              <th style={{ padding: "0.5rem" }}>Departamento</th>
              <th style={{ padding: "0.5rem" }}>Estado</th>
              <th style={{ padding: "0.5rem" }}>Nueva contraseña</th>
              <th style={{ padding: "0.5rem" }}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #f0ebe3" }}>
                <td style={{ padding: "0.5rem", color: "var(--crc-brown-dark)", fontWeight: 600 }}>
                  {u.fullName}
                </td>
                <td style={{ padding: "0.5rem", color: "#555" }}>{u.email}</td>
                <td style={{ padding: "0.5rem", color: "#555" }}>{ROLE_LABELS[u.role]}</td>
                <td style={{ padding: "0.5rem", color: "#555" }}>{u.department?.name ?? "—"}</td>
                <td style={{ padding: "0.5rem" }}>
                  <span
                    style={{
                      padding: "0.15rem 0.5rem",
                      borderRadius: 999,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor: u.isActive ? "#e6f0e0" : "#f3e6e6",
                      color: u.isActive ? "var(--crc-green)" : "#a33",
                    }}
                  >
                    {u.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td style={{ padding: "0.5rem" }}>
                  <form action={resetPassword} style={{ display: "flex", gap: "0.4rem" }}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input
                      type="text"
                      name="password"
                      placeholder="Nueva clave"
                      required
                      style={{ padding: "0.4rem 0.5rem", borderRadius: 6, border: "1px solid var(--crc-brown)", width: 130 }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: "0.4rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid var(--crc-brown)",
                        backgroundColor: "transparent",
                        color: "var(--crc-brown-dark)",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                      }}
                    >
                      Actualizar
                    </button>
                  </form>
                </td>
                <td style={{ padding: "0.5rem" }}>
                  <form action={toggleUserActive}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="nextActive" value={(!u.isActive).toString()} />
                    <button
                      type="submit"
                      style={{
                        padding: "0.4rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid var(--crc-brown)",
                        backgroundColor: "transparent",
                        color: "var(--crc-brown-dark)",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                      }}
                    >
                      {u.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
