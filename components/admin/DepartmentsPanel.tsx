import { prisma } from "@/lib/prisma"
import {
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus,
} from "@/lib/actions/departments"
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

  return (
    <>
      <section style={cardStyle}>
        <h2 style={{ ...sectionTitleStyle, marginBottom: "1rem" }}>Crear departamento</h2>
        <form action={createDepartment} style={createFormStyle}>
          <label style={labelStyle}>
            Nombre
            <input name="name" required placeholder="Ej: Revenue Management" style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Ícono
            <input name="icon" placeholder="📊" style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Descripción
            <input name="description" placeholder="Qué hace esta área" style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Responsable
            <input name="ownerName" placeholder="Nombre del encargado" style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Correo del responsable
            <input type="email" name="ownerEmail" placeholder="nombre@empresa.com" style={inputStyle} />
          </label>

          <button type="submit" style={createButtonStyle}>
            Crear departamento
          </button>
        </form>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Departamentos ({departments.length})</h2>
        <p style={sectionHintStyle}>Edita lo que necesites y pulsa Guardar en esa fila.</p>

        <table style={tableStyle}>
          <colgroup>
            <col style={{ width: "16%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "23%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr style={theadRowStyle}>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Ícono</th>
              <th style={thStyle}>Descripción</th>
              <th style={thStyle}>Responsable</th>
              <th style={thStyle}>Correo</th>
              <th style={thStyle}>Estado</th>
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
                      placeholder="Sin asignar"
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      form={editFormId}
                      type="email"
                      name="ownerEmail"
                      defaultValue={d.ownerEmail ?? ""}
                      placeholder="Sin correo"
                      title={d.ownerEmail ?? ""}
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(isActive)}>{isActive ? "Activo" : "Inactivo"}</span>
                  </td>
                  <td style={tdStyle}>
                    <form id={editFormId} action={updateDepartment}>
                      <input type="hidden" name="departmentId" value={d.id} />
                      <button type="submit" style={primaryButtonStyle}>
                        Guardar
                      </button>
                    </form>
                  </td>
                  <td style={tdStyle}>
                    <form action={toggleDepartmentStatus}>
                      <input type="hidden" name="departmentId" value={d.id} />
                      <input type="hidden" name="nextStatus" value={isActive ? "inactive" : "active"} />
                      <button type="submit" style={{ ...outlineButtonStyle, width: "100%" }}>
                        {isActive ? "Desactivar" : "Activar"}
                      </button>
                    </form>
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
