import { prisma } from "@/lib/prisma"
import { createDocument, toggleDocumentStatus, deleteDocument } from "@/lib/actions/documents"
import { ToastForm } from "@/components/ui/ToastForm"
import { getI18n } from "@/lib/i18n/server"
import { fmt } from "@/lib/i18n/client"
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
  const { dict } = await getI18n()

  return (
    <>
      <section style={cardStyle}>
        <h2 style={{ ...sectionTitleStyle, marginBottom: "0.35rem" }}>{dict.adminDocuments.uploadTitle}</h2>
        <p style={sectionHintStyle}>
          {dict.adminDocuments.uploadHint}
        </p>
        <ToastForm action={createDocument} success={dict.adminDocuments.uploaded} error={dict.adminDocuments.uploadError} style={createFormStyle}>
          <label style={labelStyle}>
            {dict.adminDocuments.file}
            <input
              type="file"
              name="file"
              required
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
              style={{ ...inputStyle, padding: "0.4rem" }}
            />
          </label>

          <label style={labelStyle}>
            {dict.adminDocuments.displayName}
            <input name="name" placeholder={dict.adminDocuments.displayNamePlaceholder} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            {dict.adminDocuments.description}
            <input name="description" placeholder={dict.adminDocuments.descriptionPlaceholder} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            {dict.adminDocuments.category}
            <select name="category" defaultValue="Otro" style={inputStyle}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            {dict.adminDocuments.department}
            <select name="departmentId" defaultValue="" style={inputStyle}>
              <option value="">{dict.adminDocuments.noDepartment}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            {dict.adminDocuments.visibility}
            <select name="confidentiality" defaultValue="public-internal" style={inputStyle}>
              {Object.entries(dict.confidentiality).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" style={createButtonStyle}>
            {dict.adminDocuments.upload}
          </button>
        </ToastForm>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{fmt(dict.adminDocuments.existingTitle, { n: documents.length })}</h2>
        <p style={sectionHintStyle}>
          {dict.adminDocuments.manageHint}
        </p>

        {documents.length === 0 ? (
          <div style={{ color: "#777", fontSize: "0.85rem" }}>{dict.adminDocuments.empty}</div>
        ) : (
          // En móvil, .crc-table-wrap le da a la tabla scroll horizontal propio.
          <div className="crc-table-wrap">
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
                <th style={thStyle}>{dict.adminDocuments.colName}</th>
                <th style={thStyle}>{dict.adminDocuments.category}</th>
                <th style={thStyle}>{dict.adminDocuments.department}</th>
                <th style={thStyle}>{dict.adminDocuments.colVisibility}</th>
                <th style={thStyle}>{dict.adminUsers.colStatus}</th>
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
                      {d.department?.name ?? dict.common.general}
                    </td>
                    <td style={{ ...tdStyle, fontSize: "0.75rem", color: "#555" }}>
                      {dict.confidentiality[d.confidentiality as keyof typeof dict.confidentiality] ?? d.confidentiality}
                    </td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(isActive)}>{isActive ? dict.common.active : dict.adminDocuments.hidden}</span>
                    </td>
                    <td style={tdStyle}>
                      <a
                        href={`/documents/${d.id}/download`}
                        style={{ ...outlineButtonStyle, display: "block", textAlign: "center", textDecoration: "none" }}
                      >
                        {dict.adminDocuments.view}
                      </a>
                    </td>
                    <td style={tdStyle}>
                      <ToastForm action={toggleDocumentStatus} success={dict.adminDocuments.updated}>
                        <input type="hidden" name="documentId" value={d.id} />
                        <input type="hidden" name="nextStatus" value={isActive ? "inactive" : "active"} />
                        <button type="submit" style={{ ...outlineButtonStyle, width: "100%" }}>
                          {isActive ? dict.adminDocuments.hide : dict.adminDocuments.show}
                        </button>
                      </ToastForm>
                    </td>
                    <td style={tdStyle}>
                      <ToastForm action={deleteDocument} success={dict.adminDocuments.deleted}>
                        <input type="hidden" name="documentId" value={d.id} />
                        <button
                          type="submit"
                          style={{ ...outlineButtonStyle, width: "100%", borderColor: "#a33", color: "#a33" }}
                        >
                          {dict.adminDocuments.delete}
                        </button>
                      </ToastForm>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </section>
    </>
  )
}
