import type { Prisma, Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireModuleAccess } from "@/lib/require-module-access"
import { canViewAllDepartments } from "@/lib/permissions"
import {
  visibleTasksWhere,
  canModifyTask,
  STATUS_LABELS,
  TASK_STATUSES,
  TASK_PRIORITIES,
  PRIORITY_LABELS,
  type TaskStatus,
} from "@/lib/tasks"
import { createTask } from "@/lib/actions/tasks"
import { TaskCard } from "@/components/tasks/TaskCard"
import {
  cardStyle,
  createButtonStyle,
  createFormStyle,
  inputStyle,
  labelStyle,
  sectionHintStyle,
  sectionTitleStyle,
} from "@/components/admin/styles"

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ assignee?: string; status?: string }>
}) {
  const session = await requireModuleAccess("tasks")
  const role = session.user.role as Role
  const userDepartmentId = session.user.departmentId
  const isCorporate = canViewAllDepartments(role)

  const { assignee, status } = await searchParams
  const statusFilter = TASK_STATUSES.includes(status as TaskStatus) ? (status as TaskStatus) : null

  // Alcance por departamento + filtros opcionales, todo dentro de la consulta.
  const where: Prisma.TaskWhereInput = { AND: [visibleTasksWhere(role, userDepartmentId)] }
  const and = where.AND as Prisma.TaskWhereInput[]
  if (assignee === "unassigned") and.push({ assignedToId: null })
  else if (assignee) and.push({ assignedToId: assignee })
  if (statusFilter) and.push({ status: statusFilter })

  const [tasks, departments, assignableUsers] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { order: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        departmentId: true,
        assignedToId: true,
        department: { select: { name: true } },
        assignedTo: { select: { fullName: true } },
      },
    }),
    isCorporate
      ? prisma.department.findMany({ where: { status: "active" }, orderBy: { order: "asc" } })
      : Promise.resolve([]),
    prisma.user.findMany({
      where: {
        isActive: true,
        ...(isCorporate ? {} : { departmentId: userDepartmentId ?? "__none__" }),
      },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ])

  const assignableOptions = assignableUsers.map((u) => ({ id: u.id, name: u.fullName }))
  const departmentOptions = departments.map((d) => ({ id: d.id, name: d.name }))
  const byStatus = (s: string) => tasks.filter((t) => t.status === s)
  const visibleStatuses = statusFilter ? [statusFilter] : TASK_STATUSES
  const filtersActive = Boolean(assignee || statusFilter)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ color: "var(--crc-brown-dark)", fontSize: "1.5rem", marginBottom: "0.25rem" }}>
          Tareas
        </h1>
        <p style={{ color: "#777", margin: 0 }}>
          {isCorporate
            ? "Tareas de todos los departamentos."
            : "Tareas de tu departamento y las generales de la empresa."}
        </p>
      </div>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Nueva tarea</h2>
        <p style={sectionHintStyle}>Se crea en estado &ldquo;Pendiente&rdquo;. El título es obligatorio.</p>
        <form action={createTask} style={createFormStyle}>
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
            Título
            <input name="title" required placeholder="¿Qué hay que hacer?" style={inputStyle} />
          </label>

          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
            Descripción
            <input name="description" placeholder="Detalle opcional" style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Prioridad
            <select name="priority" defaultValue="medium" style={inputStyle}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Fecha límite
            <input type="date" name="dueDate" style={inputStyle} />
          </label>

          {isCorporate && (
            <label style={labelStyle}>
              Departamento
              <select name="departmentId" defaultValue="" style={inputStyle}>
                <option value="">General (sin departamento)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label style={labelStyle}>
            Responsable
            <select name="assignedToId" defaultValue="" style={inputStyle}>
              <option value="">Sin asignar</option>
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" style={createButtonStyle}>
            Crear tarea
          </button>
        </form>
      </section>

      <section style={{ ...cardStyle, padding: "1rem 1.25rem" }}>
        <form
          method="get"
          style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}
        >
          <label style={{ ...labelStyle, minWidth: 180 }}>
            Responsable
            <select name="assignee" defaultValue={assignee ?? ""} style={inputStyle}>
              <option value="">Todos</option>
              <option value="unassigned">Sin asignar</option>
              {assignableOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ ...labelStyle, minWidth: 160 }}>
            Estado
            <select name="status" defaultValue={statusFilter ?? ""} style={inputStyle}>
              <option value="">Todos</option>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" style={{ ...createButtonStyle, padding: "0.55rem 1rem" }}>
            Filtrar
          </button>
          {filtersActive && (
            <a
              href="/tasks"
              style={{ fontSize: "0.85rem", color: "var(--crc-brown)", alignSelf: "center" }}
            >
              Limpiar
            </a>
          )}
        </form>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        {visibleStatuses.map((s) => {
          const items = byStatus(s)
          return (
            <section key={s} style={{ ...cardStyle, padding: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
                }}
              >
                <h2 style={{ ...sectionTitleStyle, margin: 0 }}>{STATUS_LABELS[s]}</h2>
                <span style={{ color: "#aaa", fontSize: "0.8rem", fontWeight: 600 }}>{items.length}</span>
              </div>

              {items.length === 0 ? (
                <p style={{ color: "#bbb", fontSize: "0.8rem", margin: 0 }}>Sin tareas.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {items.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      canModify={canModifyTask(role, userDepartmentId, task.departmentId)}
                      showDepartment={isCorporate}
                      assignableUsers={assignableOptions}
                      departments={departmentOptions}
                      isCorporate={isCorporate}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
