import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireModuleAccess } from "@/lib/require-module-access"
import {
  visibleAnnouncementsWhere,
  canPublishAnnouncements,
  ANNOUNCEMENT_LEVELS,
  LEVEL_LABELS,
} from "@/lib/announcements"
import { createAnnouncement } from "@/lib/actions/announcements"
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard"
import { ToastForm } from "@/components/ui/ToastForm"
import {
  cardStyle,
  createButtonStyle,
  createFormStyle,
  inputStyle,
  labelStyle,
  sectionHintStyle,
  sectionTitleStyle,
} from "@/components/admin/styles"

const announcementSelect = {
  id: true,
  title: true,
  body: true,
  level: true,
  status: true,
  pinned: true,
  publishedAt: true,
  expiresAt: true,
  department: { select: { name: true } },
  publishedBy: { select: { fullName: true } },
} as const

export default async function AlertsPage() {
  const session = await requireModuleAccess("alerts")
  const role = session.user.role as Role
  const canManage = canPublishAnnouncements(role)

  // Quien publica gestiona todos los avisos (incluye archivados/vencidos para poder
  // reactivarlos); el resto solo ve los vigentes dentro de su alcance.
  const announcements = await prisma.announcement.findMany({
    where: canManage ? {} : visibleAnnouncementsWhere(role, session.user.departmentId),
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    select: announcementSelect,
  })

  const departments = canManage
    ? await prisma.department.findMany({ where: { status: "active" }, orderBy: { order: "asc" } })
    : []

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ color: "var(--crc-brown-dark)", fontSize: "1.5rem", marginBottom: "0.25rem" }}>
          Avisos y Anuncios
        </h1>
        <p style={{ color: "#777", margin: 0 }}>
          {canManage
            ? "Publica comunicados para toda la empresa o para un departamento."
            : "Comunicados internos vigentes para ti y tu departamento."}
        </p>
      </div>

      {canManage && (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Nuevo aviso</h2>
          <p style={sectionHintStyle}>El título y el mensaje son obligatorios.</p>
          <ToastForm action={createAnnouncement} success="Aviso publicado" style={createFormStyle}>
            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
              Título
              <input name="title" required placeholder="Asunto del aviso" style={inputStyle} />
            </label>

            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
              Mensaje
              <textarea
                name="body"
                required
                rows={3}
                placeholder="Escribe el comunicado…"
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
              />
            </label>

            <label style={labelStyle}>
              Nivel
              <select name="level" defaultValue="info" style={inputStyle}>
                {ANNOUNCEMENT_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {LEVEL_LABELS[l]}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Dirigido a
              <select name="departmentId" defaultValue="" style={inputStyle}>
                <option value="">General (toda la empresa)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Vence (opcional)
              <input type="date" name="expiresAt" style={inputStyle} />
            </label>

            <label style={{ ...labelStyle, flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
              <input type="checkbox" name="pinned" style={{ width: "auto" }} />
              Fijar arriba
            </label>

            <button type="submit" style={createButtonStyle}>
              Publicar aviso
            </button>
          </ToastForm>
        </section>
      )}

      {announcements.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: "#999" }}>
          {canManage ? "Aún no has publicado avisos." : "No hay avisos para ti por ahora."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  )
}
