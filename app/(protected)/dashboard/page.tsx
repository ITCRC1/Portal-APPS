import Link from "next/link"
import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireModuleAccess } from "@/lib/require-module-access"
import { canViewAllDepartments } from "@/lib/permissions"
import { visibleTasksWhere, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/tasks"
import { visibleDocumentsWhere } from "@/lib/documents"
import { visibleAnnouncementsWhere, LEVEL_LABELS } from "@/lib/announcements"

const cardStyle = {
  backgroundColor: "var(--crc-white)",
  borderRadius: 12,
  padding: "1.25rem",
  border: "1px solid var(--crc-border)",
  boxShadow: "0 1px 2px rgba(62,43,35,0.04)",
} as const

const LEVEL_DOT: Record<string, string> = {
  info: "#8aa6c0",
  warning: "#d8b25a",
  critical: "#c96b5a",
}

// Íconos (trazo) para cada KPI: dan lectura inmediata de qué mide cada tarjeta.
const KPI_ICONS: Record<string, React.ReactNode> = {
  pending: <><path d="M12 6v6l4 2" /><circle cx="12" cy="12" r="9" /></>,
  overdue: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></>,
  docs: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>,
  alerts: <><path d="M3 11l18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  departments: <><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 9h.01M12 9h.01M15 9h.01M9 13h.01M12 13h.01M15 13h.01" /></>,
}

function KpiIcon({ name, danger }: { name: string; danger?: boolean }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 38,
        height: 38,
        borderRadius: 10,
        flexShrink: 0,
        backgroundColor: danger ? "#f7ece9" : "var(--crc-sand)",
        color: danger ? "var(--crc-danger)" : "var(--crc-green)",
      }}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {KPI_ICONS[name]}
      </svg>
    </span>
  )
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString("es-CR", { day: "2-digit", month: "short" })
}

export default async function DashboardPage() {
  const session = await requireModuleAccess("dashboard")
  const role = session.user.role as Role
  const departmentId = session.user.departmentId
  const userId = session.user.id
  const isCorporate = canViewAllDepartments(role)

  const now = new Date()
  const taskScope = visibleTasksWhere(role, departmentId)

  const [pendingTasks, overdueTasks, docsCount, announcements, announcementsCount, myTasks] =
    await Promise.all([
      prisma.task.count({
        where: { AND: [taskScope, { status: { in: ["todo", "in-progress"] } }] },
      }),
      prisma.task.count({
        where: { AND: [taskScope, { status: { not: "done" }, dueDate: { lt: now } }] },
      }),
      prisma.document.count({ where: visibleDocumentsWhere(role, departmentId) }),
      prisma.announcement.findMany({
        where: visibleAnnouncementsWhere(role, departmentId),
        orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
        take: 4,
        select: {
          id: true,
          title: true,
          level: true,
          publishedAt: true,
          department: { select: { name: true } },
        },
      }),
      prisma.announcement.count({ where: visibleAnnouncementsWhere(role, departmentId) }),
      prisma.task.findMany({
        where: { assignedToId: userId, status: { not: "done" } },
        orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { priority: "desc" }],
        take: 6,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
        },
      }),
    ])

  const corporateExtras = isCorporate
    ? await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.department.count({ where: { status: "active" } }),
      ])
    : null

  const kpis: {
    title: string
    value: string | number
    accent?: boolean
    href: string
    icon: string
  }[] = [
    { title: "Tareas pendientes", value: pendingTasks, href: "/tasks", icon: "pending" },
    { title: "Tareas vencidas", value: overdueTasks, accent: overdueTasks > 0, href: "/tasks", icon: "overdue" },
    { title: "Documentos disponibles", value: docsCount, href: "/documents", icon: "docs" },
    { title: "Avisos vigentes", value: announcementsCount, href: "/alerts", icon: "alerts" },
  ]
  if (corporateExtras) {
    kpis.push(
      { title: "Usuarios activos", value: corporateExtras[0], href: "/admin", icon: "users" },
      { title: "Departamentos", value: corporateExtras[1], href: "/departments", icon: "departments" }
    )
  }

  return (
    <div>
      <h1 style={{ color: "var(--crc-brown-dark)", marginBottom: "0.25rem", fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
        Bienvenido, {session.user.name}
      </h1>
      <p style={{ color: "var(--crc-muted)", marginBottom: "2rem" }}>
        {isCorporate
          ? "Resumen general de la operación."
          : "Resumen de tu departamento y tu trabajo."}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "1rem",
          marginBottom: "2.25rem",
        }}
      >
        {kpis.map((k) => (
          <Link
            key={k.title}
            href={k.href}
            className="crc-lift"
            style={{
              ...cardStyle,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
            }}
          >
            <KpiIcon name={k.icon} danger={k.accent} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.78rem", color: "var(--crc-muted)", marginBottom: "0.15rem" }}>
                {k.title}
              </div>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  color: k.accent ? "var(--crc-danger)" : "var(--crc-brown-dark)",
                }}
              >
                {k.value}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.05rem", color: "var(--crc-brown-dark)" }}>Mis tareas</h2>
            <Link href="/tasks" style={{ fontSize: "0.8rem", color: "var(--crc-green)" }}>
              Ver todas
            </Link>
          </div>

          {myTasks.length === 0 ? (
            <p style={{ color: "var(--crc-muted-soft)", fontSize: "0.85rem", margin: 0 }}>
              No tienes tareas asignadas pendientes.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {myTasks.map((t) => {
                const overdue = t.dueDate && t.dueDate.getTime() < now.getTime()
                return (
                  <li
                    key={t.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      paddingBottom: "0.6rem",
                      borderBottom: "1px solid var(--crc-border-soft)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "0.88rem", color: "var(--crc-brown-dark)", fontWeight: 600 }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--crc-muted)" }}>
                        {STATUS_LABELS[t.status]} · Prioridad {PRIORITY_LABELS[t.priority]?.toLowerCase()}
                      </div>
                    </div>
                    {t.dueDate && (
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: "0.75rem",
                          color: overdue ? "var(--crc-danger)" : "var(--crc-muted)",
                          fontWeight: overdue ? 600 : 400,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmtDate(t.dueDate)}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.05rem", color: "var(--crc-brown-dark)" }}>Últimos avisos</h2>
            <Link href="/alerts" style={{ fontSize: "0.8rem", color: "var(--crc-green)" }}>
              Ver todos
            </Link>
          </div>

          {announcements.length === 0 ? (
            <p style={{ color: "var(--crc-muted-soft)", fontSize: "0.85rem", margin: 0 }}>No hay avisos por ahora.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {announcements.map((a) => (
                <li
                  key={a.id}
                  style={{
                    display: "flex",
                    gap: "0.6rem",
                    alignItems: "start",
                    paddingBottom: "0.6rem",
                    borderBottom: "1px solid var(--crc-border-soft)",
                  }}
                >
                  <span
                    title={LEVEL_LABELS[a.level]}
                    style={{
                      flexShrink: 0,
                      width: 9,
                      height: 9,
                      borderRadius: 999,
                      marginTop: "0.35rem",
                      backgroundColor: LEVEL_DOT[a.level] ?? LEVEL_DOT.info,
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "0.88rem", color: "var(--crc-brown-dark)", fontWeight: 600 }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--crc-muted)" }}>
                      {a.department ? a.department.name : "General"} · {fmtDate(a.publishedAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
