import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { createUser, updateUser, toggleUserActive, unlockUser } from "@/lib/actions/users"
import { ToastForm } from "@/components/ui/ToastForm"
import { getI18n } from "@/lib/i18n/server"
import { fmt } from "@/lib/i18n/format"
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
  const { dict } = await getI18n()

  return (
    <>
      <section style={cardStyle}>
        <h2 style={{ ...sectionTitleStyle, marginBottom: "1rem" }}>{dict.adminUsers.createTitle}</h2>
        <ToastForm action={createUser} success={dict.adminUsers.created} style={createFormStyle}>
          <label style={labelStyle}>
            {dict.adminUsers.fullName}
            <input name="fullName" required style={inputStyle} />
          </label>

          <label style={labelStyle}>
            {dict.adminUsers.email}
            <input type="email" name="email" required style={inputStyle} />
          </label>

          <label style={labelStyle}>
            {dict.adminUsers.role}
            <select name="role" defaultValue={Role.READ_ONLY_USER} style={inputStyle}>
              {Object.values(Role).map((r) => (
                <option key={r} value={r}>
                  {dict.roles[r]}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            {dict.adminUsers.department}
            <select name="departmentId" defaultValue="" style={inputStyle}>
              <option value="">{dict.adminUsers.noDepartment}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            {dict.adminUsers.password}
            <input
              type="text"
              name="password"
              defaultValue={DEFAULT_PASSWORD}
              required
              style={inputStyle}
            />
          </label>

          <button type="submit" style={createButtonStyle}>
            {dict.adminUsers.create}
          </button>
        </ToastForm>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{fmt(dict.adminUsers.existingTitle, { n: users.length })}</h2>
        <p style={sectionHintStyle}>
          {dict.adminUsers.hint}
        </p>

        {/* table-layout: fixed + anchos en % => la tabla siempre cabe, sin scroll horizontal.
            En móvil el contenedor .crc-table-wrap le da scroll horizontal propio para que
            las columnas no queden ilegibles. */}
        <div className="crc-table-wrap">
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
              <th style={thStyle}>{dict.adminUsers.colName}</th>
              <th style={thStyle}>{dict.adminUsers.email}</th>
              <th style={thStyle}>{dict.adminUsers.role}</th>
              <th style={thStyle}>{dict.adminUsers.department}</th>
              <th style={thStyle}>{dict.adminUsers.colStatus}</th>
              <th style={thStyle}>{dict.adminUsers.colNewPassword}</th>
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
                          {dict.roles[r]}
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
                      <option value="">{dict.adminUsers.noDepartment}</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(u.isActive)}>{u.isActive ? dict.common.active : dict.common.inactive}</span>
                    {isLocked && (
                      <div style={{ fontSize: "0.65rem", color: "#a33", marginTop: "0.2rem", whiteSpace: "nowrap" }}>
                        🔒 {dict.adminUsers.lockedLabel}
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <input
                      form={editFormId}
                      type="text"
                      name="password"
                      placeholder={dict.adminUsers.passwordNoChange}
                      title={dict.adminUsers.passwordHint}
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <ToastForm id={editFormId} action={updateUser} success={dict.adminUsers.updated}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button type="submit" style={primaryButtonStyle}>
                        {dict.adminUsers.save}
                      </button>
                    </ToastForm>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      <ToastForm action={toggleUserActive} success={dict.adminUsers.statusUpdated}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="nextActive" value={(!u.isActive).toString()} />
                        <button type="submit" style={{ ...outlineButtonStyle, width: "100%" }}>
                          {u.isActive ? dict.adminUsers.deactivate : dict.adminUsers.activate}
                        </button>
                      </ToastForm>
                      {isLocked && (
                        <ToastForm action={unlockUser} success={dict.adminUsers.unlocked}>
                          <input type="hidden" name="userId" value={u.id} />
                          <button
                            type="submit"
                            style={{ ...outlineButtonStyle, width: "100%", borderColor: "var(--crc-green)", color: "var(--crc-green)" }}
                          >
                            {dict.adminUsers.unlock}
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
        </div>
      </section>
    </>
  )
}
