import { prisma } from "@/lib/prisma"
import { ACTION_LABELS, ENTITY_LABELS } from "@/lib/audit"
import { ROLE_LABELS } from "@/lib/permissions"
import {
  cardStyle,
  sectionHintStyle,
  sectionTitleStyle,
  tableStyle,
  tbodyRowStyle,
  tdStyle,
  theadRowStyle,
  thStyle,
} from "./styles"

function fmt(date: Date): string {
  return date.toLocaleString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const ACTION_COLORS: Record<string, string> = {
  created: "var(--crc-green)",
  updated: "#8a6d2b",
  activated: "var(--crc-green)",
  deactivated: "#a33",
  deleted: "#a33",
  resolved: "#3a5b78",
}

export async function AuditLogPanel() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 })

  return (
    <section style={cardStyle}>
      <h2 style={sectionTitleStyle}>Bitácora de auditoría</h2>
      <p style={sectionHintStyle}>
        Últimas {logs.length} acciones sobre usuarios, departamentos, documentos, tareas, avisos y
        tickets. Solo lectura.
      </p>

      {logs.length === 0 ? (
        <div style={{ color: "#777", fontSize: "0.85rem" }}>Todavía no hay actividad registrada.</div>
      ) : (
        <div style={{ maxHeight: 440, overflowY: "auto" }}>
          <table style={tableStyle}>
            <colgroup>
              <col style={{ width: "17%" }} />
              <col style={{ width: "23%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "35%" }} />
            </colgroup>
            <thead>
              <tr style={theadRowStyle}>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}>Responsable</th>
                <th style={thStyle}>Acción</th>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Elemento</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} style={tbodyRowStyle}>
                  <td style={{ ...tdStyle, fontSize: "0.72rem", color: "#888", whiteSpace: "nowrap" }}>
                    {fmt(l.createdAt)}
                  </td>
                  <td style={{ ...tdStyle, fontSize: "0.75rem" }}>
                    <div style={{ color: "var(--crc-brown-dark)", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {l.actorEmail}
                    </div>
                    <div style={{ color: "#aaa", fontSize: "0.68rem" }}>
                      {ROLE_LABELS[l.actorRole as keyof typeof ROLE_LABELS] ?? l.actorRole}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontSize: "0.75rem", fontWeight: 600, color: ACTION_COLORS[l.action] ?? "#555" }}>
                    {ACTION_LABELS[l.action] ?? l.action}
                  </td>
                  <td style={{ ...tdStyle, fontSize: "0.75rem", color: "#555" }}>
                    {ENTITY_LABELS[l.entityType] ?? l.entityType}
                  </td>
                  <td style={{ ...tdStyle, fontSize: "0.75rem", color: "#555" }}>
                    <div style={{ color: "var(--crc-brown-dark)", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {l.entityLabel}
                    </div>
                    {l.details && <div style={{ color: "#aaa", fontSize: "0.68rem" }}>{l.details}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
