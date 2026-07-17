import { prisma } from "@/lib/prisma"
import { CONFIDENTIALITY_LABELS } from "@/lib/permissions"
import { createDocument, toggleDocumentStatus, deleteDocument } from "@/lib/actions/documents"
import {
  badgeStyle,
  cardStyle,
  createButtonStyle,
  createFormStyle,
  inputStyle,
  labelStyle,
  outlineButtonStyle,
  sectionHintStyle,
  sectionTitleStyle,
  tableStyle,
  tbodyRowStyle,
  tdStyle,
  theadRowStyle,
  thStyle,
} from "./styles"

const CATEGORIES = [
  "SOP",
  "Policy",
  "Financial Report",
  "Board Package",
  "Contract",
  "Insurance",
  "HR Document",
  "CAPEX",
  "Legal",
  "Template",
  "Otro",
]

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export async function DocumentsPanel() {
  const [documents, departments] = await Promise.all([
    prisma.document.findMany({
      orderBy: [{ department: { order: "asc" } }, { order: "asc" }],
      select: {
        id: true,
        name: true,
        fileName: true,
        size: true,
        category: true,
        confidentiality: true,
        status: true,
        department: { select: { name: true } },
      },
    }),
    prisma.department.findMany({ where: { status: "active" }, orderBy: { order: "asc" } }),
  ])

  return (
    <>
      <section style={cardStyle}>
        <h2 style={{ ...sectionTitleStyle, marginBottom: "0.35rem" }}>Subir documento</h2>
        <p style={sectionHintStyle}>
          Solo administradores pueden subir. PDF, Word, Excel, PowerPoint, imágenes o texto, hasta 15 MB.
        </p>
        <form action={createDocument} style={createFormStyle}>
          <label style={labelStyle}>
            Archivo
            <input
              type="file"
              name="file"
              required
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
              style={{ ...inputStyle, padding: "0.4rem" }}
            />
          </label>

          <label style={labelStyle}>
            Nombre a mostrar
            <input name="name" placeholder="Se usa el del archivo si lo dejas vacío" style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Descripción
            <input name="description" placeholder="Breve descripción" style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Categoría
            <select name="category" defaultValue="Otro" style={inputStyle}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Departamento
            <select name="departmentId" defaultValue="" style={inputStyle}>
              <option value="">Sin departamento (general)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Quién puede verlo
            <select name="confidentiality" defaultValue="public-internal" style={inputStyle}>
              {Object.entries(CONFIDENTIALITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" style={createButtonStyle}>
            Subir documento
          </button>
        </form>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Documentos ({documents.length})</h2>
        <p style={sectionHintStyle}>
          Descarga para revisar, desactiva para ocultar sin borrar, o elimina definitivamente.
        </p>

        {documents.length === 0 ? (
          <div style={{ color: "#777", fontSize: "0.85rem" }}>No hay documentos todavía.</div>
        ) : (
          <table style={tableStyle}>
            <colgroup>
              <col style={{ width: "26%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>
            <thead>
              <tr style={theadRowStyle}>
                <th style={thStyle}>Nombre</th>
                <th style={thStyle}>Categoría</th>
                <th style={thStyle}>Departamento</th>
                <th style={thStyle}>Visibilidad</th>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}></th>
                <th style={thStyle}></th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => {
                const isActive = d.status === "active"
                return (
                  <tr key={d.id} style={tbodyRowStyle}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: "var(--crc-brown-dark)", fontSize: "0.82rem" }}>
                        {d.name}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "#aaa" }}>
                        {d.fileName} · {formatSize(d.size)}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: "0.78rem", color: "#555" }}>{d.category}</td>
                    <td style={{ ...tdStyle, fontSize: "0.78rem", color: "#555" }}>
                      {d.department?.name ?? "General"}
                    </td>
                    <td style={{ ...tdStyle, fontSize: "0.75rem", color: "#555" }}>
                      {CONFIDENTIALITY_LABELS[d.confidentiality] ?? d.confidentiality}
                    </td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(isActive)}>{isActive ? "Activo" : "Oculto"}</span>
                    </td>
                    <td style={tdStyle}>
                      <a
                        href={`/documents/${d.id}/download`}
                        style={{ ...outlineButtonStyle, display: "block", textAlign: "center", textDecoration: "none" }}
                      >
                        Ver
                      </a>
                    </td>
                    <td style={tdStyle}>
                      <form action={toggleDocumentStatus}>
                        <input type="hidden" name="documentId" value={d.id} />
                        <input type="hidden" name="nextStatus" value={isActive ? "inactive" : "active"} />
                        <button type="submit" style={{ ...outlineButtonStyle, width: "100%" }}>
                          {isActive ? "Ocultar" : "Mostrar"}
                        </button>
                      </form>
                    </td>
                    <td style={tdStyle}>
                      <form action={deleteDocument}>
                        <input type="hidden" name="documentId" value={d.id} />
                        <button
                          type="submit"
                          style={{ ...outlineButtonStyle, width: "100%", borderColor: "#a33", color: "#a33" }}
                        >
                          Eliminar
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
