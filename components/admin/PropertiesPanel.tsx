import { prisma } from "@/lib/prisma"
import {
  createProperty,
  updateProperty,
  togglePropertyStatus,
} from "@/lib/actions/properties"
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

export async function PropertiesPanel() {
  const properties = await prisma.property.findMany({ orderBy: { order: "asc" } })
  const { dict } = await getI18n()

  return (
    <>
      <section style={cardStyle}>
        <h2 style={{ ...sectionTitleStyle, marginBottom: "0.35rem" }}>{dict.adminProperties.createTitle}</h2>
        <p style={sectionHintStyle}>{dict.adminProperties.hint}</p>
        <ToastForm action={createProperty} success={dict.adminProperties.created} style={createFormStyle}>
          <label style={labelStyle}>
            {dict.adminProperties.name}
            <input name="name" required placeholder={dict.adminProperties.namePlaceholder} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            {dict.adminProperties.icon}
            <input name="icon" placeholder="🏝️" style={inputStyle} />
          </label>

          <button type="submit" style={createButtonStyle}>
            {dict.adminProperties.create}
          </button>
        </ToastForm>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{fmt(dict.adminProperties.existingTitle, { n: properties.length })}</h2>

        {/* En móvil, .crc-table-wrap le da a la tabla scroll horizontal propio. */}
        <div className="crc-table-wrap">
        <table style={tableStyle}>
          <colgroup>
            <col style={{ width: "45%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
          </colgroup>
          <thead>
            <tr style={theadRowStyle}>
              <th style={thStyle}>{dict.adminProperties.name}</th>
              <th style={thStyle}>{dict.adminProperties.icon}</th>
              <th style={thStyle}>{dict.adminUsers.colStatus}</th>
              <th style={thStyle}></th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => {
              const editFormId = `edit-property-${p.id}`
              const isActive = p.status === "active"

              return (
                <tr key={`${p.id}-${p.updatedAt.toISOString()}`} style={tbodyRowStyle}>
                  <td style={tdStyle}>
                    <input
                      form={editFormId}
                      name="name"
                      defaultValue={p.name}
                      required
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      form={editFormId}
                      name="icon"
                      defaultValue={p.icon ?? ""}
                      style={{ ...cellInputStyle, textAlign: "center" }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(isActive)}>{isActive ? dict.common.active : dict.common.inactive}</span>
                  </td>
                  <td style={tdStyle}>
                    <ToastForm id={editFormId} action={updateProperty} success={dict.adminProperties.updated}>
                      <input type="hidden" name="propertyId" value={p.id} />
                      <button type="submit" style={primaryButtonStyle}>
                        {dict.adminUsers.save}
                      </button>
                    </ToastForm>
                  </td>
                  <td style={tdStyle}>
                    <ToastForm action={togglePropertyStatus} success={dict.adminUsers.statusUpdated}>
                      <input type="hidden" name="propertyId" value={p.id} />
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
