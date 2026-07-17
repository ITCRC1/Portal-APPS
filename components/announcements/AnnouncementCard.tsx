import { LEVEL_LABELS } from "@/lib/announcements"
import {
  toggleAnnouncementStatus,
  toggleAnnouncementPinned,
  deleteAnnouncement,
} from "@/lib/actions/announcements"

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

function fmt(date: Date): string {
  return date.toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" })
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

export function AnnouncementCard({
  announcement: a,
  canManage,
}: {
  announcement: AnnouncementData
  canManage: boolean
}) {
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
        border: "1px solid #eee3d6",
        borderLeft: `5px solid ${c.border}`,
        padding: "1rem 1.1rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        opacity: archived || expired ? 0.6 : 1,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
        {a.pinned && <span title="Fijado" style={{ fontSize: "0.9rem" }}>📌</span>}
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
          {LEVEL_LABELS[a.level] ?? a.level}
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
          {a.department ? a.department.name : "General"}
        </span>
        {archived && <span style={{ fontSize: "0.7rem", color: "#a33", fontWeight: 600 }}>Archivado</span>}
        {!archived && expired && (
          <span style={{ fontSize: "0.7rem", color: "#a33", fontWeight: 600 }}>Vencido</span>
        )}
        <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "#aaa" }}>{fmt(a.publishedAt)}</span>
      </div>

      <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--crc-brown-dark)" }}>{a.title}</h3>
      <p style={{ margin: 0, fontSize: "0.85rem", color: "#555", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
        {a.body}
      </p>

      <div style={{ fontSize: "0.72rem", color: "#aaa" }}>
        {a.publishedBy ? `Publicado por ${a.publishedBy.fullName}` : "Publicado"}
        {a.expiresAt ? ` · Vence ${fmt(a.expiresAt)}` : ""}
      </div>

      {canManage && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.2rem" }}>
          <form action={toggleAnnouncementPinned}>
            <input type="hidden" name="announcementId" value={a.id} />
            <input type="hidden" name="pinned" value={a.pinned ? "false" : "true"} />
            <button type="submit" style={smallBtn}>
              {a.pinned ? "Quitar fijado" : "Fijar"}
            </button>
          </form>
          <form action={toggleAnnouncementStatus}>
            <input type="hidden" name="announcementId" value={a.id} />
            <input type="hidden" name="nextStatus" value={archived ? "active" : "archived"} />
            <button type="submit" style={smallBtn}>
              {archived ? "Reactivar" : "Archivar"}
            </button>
          </form>
          <form action={deleteAnnouncement} style={{ marginLeft: "auto" }}>
            <input type="hidden" name="announcementId" value={a.id} />
            <button type="submit" style={{ ...smallBtn, border: "1px solid #d9b3b3", color: "#a33" }}>
              Eliminar
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
