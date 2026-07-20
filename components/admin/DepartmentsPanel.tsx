import { prisma } from "@/lib/prisma"
import {
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus,
} from "@/lib/actions/departments"
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

export async function DepartmentsPanel() {
  const departments = await prisma.department.findMany({
    orderBy: { order: "asc" },
  })

  return (
    <>
      <section style={cardStyle}>
        <h2 style={{ ...sectionTitleStyle, marginBottom: "1rem" }}>Crear departamento</h2>
        <ToastForm action={createDepartment} success="Departamento creado" style={createFormStyle}>
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

          <button type="submit" style={createButtonStyle}>
            Crear departamento
          </button>
        </ToastForm>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Departamentos ({departments.length})</h2>
        <p style={sectionHintStyle}>Edita lo que necesites y pulsa Guardar en esa fila.</p>

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
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Ícono</th>
              <th style={thStyle}>Descripción</th>
              <th style={thStyle}>Responsable</th>
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
                    <span style={badgeStyle(isActive)}>{isActive ? "Activo" : "Inactivo"}</span>
                  </td>
                  <td style={tdStyle}>
                    <ToastForm id={editFormId} action={updateDepartment} success="Departamento actualizado">
                      <input type="hidden" name="departmentId" value={d.id} />
                      <button type="submit" style={primaryButtonStyle}>
                        Guardar
                      </button>
                    </ToastForm>
                  </td>
                  <td style={tdStyle}>
                    <ToastForm action={toggleDepartmentStatus} success="Estado actualizado">
                      <input type="hidden" name="departmentId" value={d.id} />
                      <input type="hidden" name="nextStatus" value={isActive ? "inactive" : "active"} />
                      <button type="submit" style={{ ...outlineButtonStyle, width: "100%" }}>
                        {isActive ? "Desactivar" : "Activar"}
                      </button>
                    </ToastForm>
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
