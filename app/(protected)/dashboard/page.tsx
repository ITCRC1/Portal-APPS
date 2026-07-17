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
  borderRadius: 10,
  padding: "1.25rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
} as const

const LEVEL_DOT: Record<string, string> = {
  info: "#8aa6c0",
  warning: "#d8b25a",
  critical: "#c96b5a",
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

  const kpis: { title: string; value: string | number; accent?: boolean; href: string }[] = [
    { title: "Tareas pendientes", value: pendingTasks, href: "/tasks" },
    { title: "Tareas vencidas", value: overdueTasks, accent: overdueTasks > 0, href: "/tasks" },
    { title: "Documentos disponibles", value: docsCount, href: "/documents" },
    { title: "Avisos vigentes", value: announcementsCount, href: "/alerts" },
  ]
  if (corporateExtras) {
    kpis.push(
      { title: "Usuarios activos", value: corporateExtras[0], href: "/admin" },
      { title: "Departamentos", value: corporateExtras[1], href: "/departments" }
    )
  }

  return (
    <div>
      <h1 style={{ color: "var(--crc-brown-dark)", marginBottom: "0.25rem", fontSize: "1.5rem" }}>
        Bienvenido, {session.user.name}
      </h1>
      <p style={{ color: "#777", marginBottom: "2rem" }}>
        {isCorporate
          ? "Resumen general de la operación."
          : "Resumen de tu departamento y tu trabajo."}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {kpis.map((k) => (
          <Link
            key={k.title}
            href={k.href}
            style={{ ...cardStyle, textDecoration: "none", display: "block" }}
          >
            <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.4rem" }}>{k.title}</div>
            <div
              style={{
                fontSize: "1.8rem",
                fontWeight: 700,
                color: k.accent ? "#a33" : "var(--crc-brown-dark)",
              }}
            >
              {k.value}
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
            <p style={{ color: "#bbb", fontSize: "0.85rem", margin: 0 }}>
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
                      borderBottom: "1px solid #f0ebe3",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "0.88rem", color: "var(--crc-brown-dark)", fontWeight: 600 }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#999" }}>
                        {STATUS_LABELS[t.status]} · Prioridad {PRIORITY_LABELS[t.priority]?.toLowerCase()}
                      </div>
                    </div>
                    {t.dueDate && (
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: "0.75rem",
                          color: overdue ? "#a33" : "#999",
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
            <p style={{ color: "#bbb", fontSize: "0.85rem", margin: 0 }}>No hay avisos por ahora.</p>
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
                    borderBottom: "1px solid #f0ebe3",
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
                    <div style={{ fontSize: "0.72rem", color: "#999" }}>
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
