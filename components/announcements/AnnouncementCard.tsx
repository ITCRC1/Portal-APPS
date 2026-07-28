import {
  toggleAnnouncementStatus,
  toggleAnnouncementPinned,
  deleteAnnouncement,
} from "@/lib/actions/announcements"
import { ToastForm } from "@/components/ui/ToastForm"
import { getI18n } from "@/lib/i18n/server"
import { fmt } from "@/lib/i18n/format"

type AnnouncementData = {
  id: string
  title: string
  body: string
  level: string
  status: string
  pinned: boolean
  publishedAt: Date
  expiresAt: Date | null
  department: { name: string } | null
  publishedBy: { fullName: string } | null
}

const LEVEL_COLORS: Record<string, { border: string; bg: string; fg: string }> = {
  info: { border: "#8aa6c0", bg: "#e8f0f6", fg: "#3a5b78" },
  warning: { border: "#d8b25a", bg: "#f7efd8", fg: "#8a6d2b" },
  critical: { border: "#c96b5a", bg: "#f6e0dd", fg: "#a33" },
}

function fmtDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === "es" ? "es-CR" : "en-US", { day: "2-digit", month: "short", year: "numeric" })
}

const smallBtn = {
  padding: "0.3rem 0.55rem",
  borderRadius: 6,
  border: "1px solid var(--crc-brown)",
  backgroundColor: "var(--crc-white)",
  color: "var(--crc-brown-dark)",
  cursor: "pointer",
  fontSize: "0.72rem",
  whiteSpace: "nowrap" as const,
}

export async function AnnouncementCard({
  announcement: a,
  canManage,
}: {
  announcement: AnnouncementData
  canManage: boolean
}) {
  const { locale, dict } = await getI18n()
  const c = LEVEL_COLORS[a.level] ?? LEVEL_COLORS.info
  const archived = a.status !== "active"
  const expired = a.expiresAt && a.expiresAt.getTime() < Date.now()

  return (
    <div
      data-testid={`announcement-card-${a.id}`}
      data-can-manage={canManage ? "true" : "false"}
      style={{
        backgroundColor: "var(--crc-white)",
        borderRadius: 10,
        border: "1px solid var(--crc-border)",
        borderLeft: `5px solid ${c.border}`,
        padding: "1rem 1.1rem",
        opacity: archived || expired ? 0.6 : 1,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
        {a.pinned && <span title={dict.announcementCard.pinned} style={{ fontSize: "0.9rem" }}>📌</span>}
        <span
          style={{
            padding: "0.12rem 0.5rem",
            borderRadius: 999,
            fontSize: "0.68rem",
            fontWeight: 700,
            backgroundColor: c.bg,
            color: c.fg,
          }}
        >
          {dict.announcementLevel[a.level as keyof typeof dict.announcementLevel] ?? a.level}
        </span>
        <span
          style={{
            padding: "0.12rem 0.5rem",
            borderRadius: 999,
            fontSize: "0.68rem",
            fontWeight: 600,
            backgroundColor: "#f0ebe3",
            color: "#7a6a58",
          }}
        >
          {a.department ? a.department.name : dict.common.general}
        </span>
        {archived && <span style={{ fontSize: "0.7rem", color: "#a33", fontWeight: 600 }}>{dict.announcementCard.archived}</span>}
        {!archived && expired && (
          <span style={{ fontSize: "0.7rem", color: "#a33", fontWeight: 600 }}>{dict.announcementCard.expired}</span>
        )}
        <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "#aaa" }}>{fmtDate(a.publishedAt, locale)}</span>
      </div>

      <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--crc-brown-dark)" }}>{a.title}</h3>
      <p style={{ margin: 0, fontSize: "0.85rem", color: "#555", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
        {a.body}
      </p>

      <div style={{ fontSize: "0.72rem", color: "#aaa" }}>
        {a.publishedBy ? fmt(dict.announcementCard.publishedBy, { name: a.publishedBy.fullName }) : dict.announcementCard.published}
        {a.expiresAt ? ` · ${fmt(dict.announcementCard.expiresOn, { date: fmtDate(a.expiresAt, locale) })}` : ""}
      </div>

      {canManage && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.2rem" }}>
          <ToastForm action={toggleAnnouncementPinned} success={dict.announcementCard.updated}>
            <input type="hidden" name="announcementId" value={a.id} />
            <input type="hidden" name="pinned" value={a.pinned ? "false" : "true"} />
            <button type="submit" style={smallBtn}>
              {a.pinned ? dict.announcementCard.unpin : dict.announcementCard.pin}
            </button>
          </ToastForm>
          <ToastForm action={toggleAnnouncementStatus} success={dict.announcementCard.updated}>
            <input type="hidden" name="announcementId" value={a.id} />
            <input type="hidden" name="nextStatus" value={archived ? "active" : "archived"} />
            <button type="submit" style={smallBtn}>
              {archived ? dict.announcementCard.reactivate : dict.announcementCard.archive}
            </button>
          </ToastForm>
          <ToastForm action={deleteAnnouncement} success={dict.announcementCard.deleted} style={{ marginLeft: "auto" }}>
            <input type="hidden" name="announcementId" value={a.id} />
            <button type="submit" style={{ ...smallBtn, border: "1px solid #d9b3b3", color: "#a33" }}>
              {dict.announcementCard.delete}
            </button>
          </ToastForm>
        </div>
      )}
    </div>
  )
}
