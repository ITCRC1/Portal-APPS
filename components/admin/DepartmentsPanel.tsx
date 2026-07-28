import { prisma } from "@/lib/prisma"
import {
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus,
} from "@/lib/actions/departments"
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

export async function DepartmentsPanel() {
  const departments = await prisma.department.findMany({
    orderBy: { order: "asc" },
  })
  const { dict } = await getI18n()

  return (
    <>
      <section style={cardStyle}>
        <h2 style={{ ...sectionTitleStyle, marginBottom: "1rem" }}>{dict.adminDepartments.createTitle}</h2>
        <ToastForm action={createDepartment} success={dict.adminDepartments.created} style={createFormStyle}>
          <label style={labelStyle}>
            {dict.adminDepartments.name}
            <input name="name" required placeholder={dict.adminDepartments.namePlaceholder} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            {dict.adminDepartments.icon}
            <input name="icon" placeholder="📊" style={inputStyle} />
          </label>

          <label style={labelStyle}>
            {dict.adminDepartments.description}
            <input name="description" placeholder={dict.adminDepartments.descriptionPlaceholder} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            {dict.adminDepartments.owner}
            <input name="ownerName" placeholder={dict.adminDepartments.ownerPlaceholder} style={inputStyle} />
          </label>

          <button type="submit" style={createButtonStyle}>
            {dict.adminDepartments.create}
          </button>
        </ToastForm>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{fmt(dict.adminDepartments.existingTitle, { n: departments.length })}</h2>
        <p style={sectionHintStyle}>{dict.adminDepartments.hint}</p>

        {/* En móvil, .crc-table-wrap le da a la tabla scroll horizontal propio. */}
        <div className="crc-table-wrap">
        <table style={tableStyle}>
          <colgroup>
            <col style={{ width: "18%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "30%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr style={theadRowStyle}>
              <th style={thStyle}>{dict.adminDepartments.name}</th>
              <th style={thStyle}>{dict.adminDepartments.icon}</th>
              <th style={thStyle}>{dict.adminDepartments.description}</th>
              <th style={thStyle}>{dict.adminDepartments.owner}</th>
              <th style={thStyle}>{dict.adminUsers.colStatus}</th>
              <th style={thStyle}></th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => {
              const editFormId = `edit-dept-${d.id}`
              const isActive = d.status === "active"

              return (
                <tr key={`${d.id}-${d.updatedAt.toISOString()}`} style={tbodyRowStyle}>
                  <td style={tdStyle}>
                    <input
                      form={editFormId}
                      name="name"
                      defaultValue={d.name}
                      required
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      form={editFormId}
                      name="icon"
                      defaultValue={d.icon ?? ""}
                      style={{ ...cellInputStyle, textAlign: "center" }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      form={editFormId}
                      name="description"
                      defaultValue={d.description ?? ""}
                      title={d.description ?? ""}
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      form={editFormId}
                      name="ownerName"
                      defaultValue={d.ownerName ?? ""}
                      placeholder={dict.adminDepartments.ownerUnassigned}
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(isActive)}>{isActive ? dict.common.active : dict.common.inactive}</span>
                  </td>
                  <td style={tdStyle}>
                    <ToastForm id={editFormId} action={updateDepartment} success={dict.adminDepartments.updated}>
                      <input type="hidden" name="departmentId" value={d.id} />
                      <button type="submit" style={primaryButtonStyle}>
                        {dict.adminUsers.save}
                      </button>
                    </ToastForm>
                  </td>
                  <td style={tdStyle}>
                    <ToastForm action={toggleDepartmentStatus} success={dict.adminUsers.statusUpdated}>
                      <input type="hidden" name="departmentId" value={d.id} />
                      <input type="hidden" name="nextStatus" value={isActive ? "inactive" : "active"} />
                      <button type="submit" style={{ ...outlineButtonStyle, width: "100%" }}>
                        {isActive ? dict.adminUsers.deactivate : dict.adminUsers.activate}
                      </button>
                    </ToastForm>
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
