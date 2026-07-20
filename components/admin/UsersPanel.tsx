import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { ROLE_LABELS } from "@/lib/permissions"
import { createUser, updateUser, toggleUserActive, unlockUser } from "@/lib/actions/users"
import { ToastForm } from "@/components/ui/ToastForm"
import {
  badgeStyle,
  cardStyle,
  cellInputStyle,
  createButtonStyle,
  createFormStyle,
  inputStyle,
  labelStyle,
  outlineButtonStyle,
  primaryButtonStyle,
  sectionHintStyle,
  sectionTitleStyle,
  tableStyle,
  tbodyRowStyle,
  tdStyle,
  theadRowStyle,
  thStyle,
} from "./styles"

const DEFAULT_PASSWORD = "12345678"

export async function UsersPanel() {
  const [users, departments] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, include: { department: true } }),
    prisma.department.findMany({ where: { status: "active" }, orderBy: { order: "asc" } }),
  ])

  return (
    <>
      <section style={cardStyle}>
        <h2 style={{ ...sectionTitleStyle, marginBottom: "1rem" }}>Crear usuario</h2>
        <ToastForm action={createUser} success="Usuario creado" style={createFormStyle}>
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
            <input
              type="text"
              name="password"
              defaultValue={DEFAULT_PASSWORD}
              required
              style={inputStyle}
            />
          </label>

          <button type="submit" style={createButtonStyle}>
            Crear usuario
          </button>
        </ToastForm>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Usuarios existentes ({users.length})</h2>
        <p style={sectionHintStyle}>
          Edita lo que necesites y pulsa Guardar en esa fila. La contraseña solo cambia si escribes
          una nueva; si dejas el campo vacío, se conserva la actual.
        </p>

        {/* table-layout: fixed + anchos en % => la tabla siempre cabe, sin scroll horizontal. */}
        <table style={tableStyle}>
          <colgroup>
            <col style={{ width: "14%" }} />
            <col style={{ width: "19%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "11%" }} />
          </colgroup>
          <thead>
            <tr style={theadRowStyle}>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Correo</th>
              <th style={thStyle}>Rol</th>
              <th style={thStyle}>Departamento</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Nueva clave</th>
              <th style={thStyle}></th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              // Un <form> no puede envolver varias celdas, así que los campos se asocian
              // al formulario de su fila con el atributo form.
              const editFormId = `edit-user-${u.id}`
              const isLocked = u.lockedUntil ? u.lockedUntil.getTime() > Date.now() : false

              return (
                // defaultValue solo aplica al montar: sin updatedAt en la key, tras guardar
                // los campos seguirían mostrando el valor anterior.
                <tr key={`${u.id}-${u.updatedAt.toISOString()}`} data-testid={`user-row-${u.id}`} style={tbodyRowStyle}>
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
                    <span style={badgeStyle(u.isActive)}>{u.isActive ? "Activo" : "Inactivo"}</span>
                    {isLocked && (
                      <div style={{ fontSize: "0.65rem", color: "#a33", marginTop: "0.2rem", whiteSpace: "nowrap" }}>
                        🔒 Bloqueado
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <input
                      form={editFormId}
                      type="text"
                      name="password"
                      placeholder="Sin cambios"
                      title="Escribe una clave nueva solo si quieres cambiarla"
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <ToastForm id={editFormId} action={updateUser} success="Usuario actualizado">
                      <input type="hidden" name="userId" value={u.id} />
                      <button type="submit" style={primaryButtonStyle}>
                        Guardar
                      </button>
                    </ToastForm>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      <ToastForm action={toggleUserActive} success="Estado actualizado">
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="nextActive" value={(!u.isActive).toString()} />
                        <button type="submit" style={{ ...outlineButtonStyle, width: "100%" }}>
                          {u.isActive ? "Desactivar" : "Activar"}
                        </button>
                      </ToastForm>
                      {isLocked && (
                        <ToastForm action={unlockUser} success="Cuenta desbloqueada">
                          <input type="hidden" name="userId" value={u.id} />
                          <button
                            type="submit"
                            style={{ ...outlineButtonStyle, width: "100%", borderColor: "var(--crc-green)", color: "var(--crc-green)" }}
                          >
                            Desbloquear
                          </button>
                        </ToastForm>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </>
  )
}
