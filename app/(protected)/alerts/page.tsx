import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireModuleAccess } from "@/lib/require-module-access"
import {
  visibleAnnouncementsWhere,
  canPublishAnnouncements,
  ANNOUNCEMENT_LEVELS,
} from "@/lib/announcements"
import { getI18n } from "@/lib/i18n/server"
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
  const { dict } = await getI18n()

  // Quien publica gestiona todos los avisos (incluye archivados/vencidos para poder
  // reactivarlos); el resto solo ve los vigentes dentro de su alcance.
  const announcements = await prisma.announcement.findMany({
    where: canManage
      ? {}
      : visibleAnnouncementsWhere(role, session.user.departmentId, session.user.propertyId),
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    select: announcementSelect,
  })

  const [departments, properties] = canManage
    ? await Promise.all([
        prisma.department.findMany({ where: { status: "active" }, orderBy: { order: "asc" } }),
        prisma.property.findMany({ where: { status: "active" }, orderBy: { order: "asc" } }),
      ])
    : [[], []]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ color: "var(--crc-brown-dark)", fontSize: "1.5rem", marginBottom: "0.25rem" }}>
          {dict.alerts.title}
        </h1>
        <p style={{ color: "#777", margin: 0 }}>
          {canManage ? dict.alerts.subtitleManage : dict.alerts.subtitleView}
        </p>
      </div>

      {canManage && (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>{dict.alerts.newTitle}</h2>
          <p style={sectionHintStyle}>{dict.alerts.newHint}</p>
          <ToastForm action={createAnnouncement} success={dict.alerts.success} style={createFormStyle}>
            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
              {dict.alerts.fieldTitle}
              <input name="title" required placeholder={dict.alerts.titlePlaceholder} style={inputStyle} />
            </label>

            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
              {dict.alerts.fieldMessage}
              <textarea
                name="body"
                required
                rows={3}
                placeholder={dict.alerts.messagePlaceholder}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
              />
            </label>

            <label style={labelStyle}>
              {dict.alerts.fieldLevel}
              <select name="level" defaultValue="info" style={inputStyle}>
                {ANNOUNCEMENT_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {dict.announcementLevel[l]}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              {dict.alerts.fieldAudience}
              <select name="departmentId" defaultValue="" style={inputStyle}>
                <option value="">{dict.alerts.audienceGeneral}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              {dict.alerts.fieldProperty}
              <select name="propertyId" defaultValue="" style={inputStyle}>
                <option value="">{dict.alerts.propertyAll}</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              {dict.alerts.fieldExpires}
              <input type="date" name="expiresAt" style={inputStyle} />
            </label>

            <label style={{ ...labelStyle, flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
              <input type="checkbox" name="pinned" style={{ width: "auto" }} />
              {dict.alerts.pin}
            </label>

            <button type="submit" style={createButtonStyle}>
              {dict.alerts.publish}
            </button>
          </ToastForm>
        </section>
      )}

      {announcements.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: "#999" }}>
          {canManage ? dict.alerts.emptyManage : dict.alerts.emptyView}
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
