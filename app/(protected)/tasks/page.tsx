import type { Prisma, Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireModuleAccess } from "@/lib/require-module-access"
import { canViewAllDepartments } from "@/lib/permissions"
import {
  visibleTasksWhere,
  canModifyTask,
  TASK_STATUSES,
  TASK_PRIORITIES,
  type TaskStatus,
} from "@/lib/tasks"
import { getI18n } from "@/lib/i18n/server"
import { createTask } from "@/lib/actions/tasks"
import { TaskCard } from "@/components/tasks/TaskCard"
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

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ assignee?: string; status?: string }>
}) {
  const session = await requireModuleAccess("tasks")
  const role = session.user.role as Role
  const userDepartmentId = session.user.departmentId
  const userPropertyId = session.user.propertyId
  const isCorporate = canViewAllDepartments(role)
  const { dict } = await getI18n()

  const { assignee, status } = await searchParams
  const statusFilter = TASK_STATUSES.includes(status as TaskStatus) ? (status as TaskStatus) : null

  // Alcance por departamento + propiedad + filtros opcionales, todo dentro de la consulta.
  const where: Prisma.TaskWhereInput = { AND: [visibleTasksWhere(role, userDepartmentId, userPropertyId)] }
  const and = where.AND as Prisma.TaskWhereInput[]
  if (assignee === "unassigned") and.push({ assignedToId: null })
  else if (assignee) and.push({ assignedToId: assignee })
  if (statusFilter) and.push({ status: statusFilter })

  const [tasks, departments, properties, assignableUsers] = await Promise.all([
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
        propertyId: true,
        assignedToId: true,
        department: { select: { name: true } },
        property: { select: { name: true } },
        assignedTo: { select: { fullName: true } },
      },
    }),
    isCorporate
      ? prisma.department.findMany({ where: { status: "active" }, orderBy: { order: "asc" } })
      : Promise.resolve([]),
    isCorporate
      ? prisma.property.findMany({ where: { status: "active" }, orderBy: { order: "asc" } })
      : Promise.resolve([]),
    prisma.user.findMany({
      where: {
        isActive: true,
        ...(isCorporate
          ? {}
          : {
              departmentId: userDepartmentId ?? "__none__",
              ...(userPropertyId ? { propertyId: userPropertyId } : {}),
            }),
      },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ])

  const assignableOptions = assignableUsers.map((u) => ({ id: u.id, name: u.fullName }))
  const departmentOptions = departments.map((d) => ({ id: d.id, name: d.name }))
  const propertyOptions = properties.map((p) => ({ id: p.id, name: p.name }))
  const byStatus = (s: string) => tasks.filter((t) => t.status === s)
  const visibleStatuses = statusFilter ? [statusFilter] : TASK_STATUSES
  const filtersActive = Boolean(assignee || statusFilter)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ color: "var(--crc-brown-dark)", fontSize: "1.5rem", marginBottom: "0.25rem" }}>
          {dict.nav.tasks}
        </h1>
        <p style={{ color: "#777", margin: 0 }}>
          {isCorporate ? dict.tasks.subtitleCorporate : dict.tasks.subtitlePersonal}
        </p>
      </div>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{dict.tasks.newTitle}</h2>
        <p style={sectionHintStyle}>{dict.tasks.newHint}</p>
        <ToastForm action={createTask} success={dict.tasks.success} style={createFormStyle}>
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
            {dict.tasks.fieldTitle}
            <input name="title" required placeholder={dict.tasks.titlePlaceholder} style={inputStyle} />
          </label>

          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
            {dict.tasks.fieldDescription}
            <input name="description" placeholder={dict.tasks.descriptionPlaceholder} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            {dict.tasks.fieldPriority}
            <select name="priority" defaultValue="medium" style={inputStyle}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {dict.taskPriority[p]}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            {dict.tasks.fieldDueDate}
            <input type="date" name="dueDate" style={inputStyle} />
          </label>

          {isCorporate && (
            <label style={labelStyle}>
              {dict.tasks.fieldDepartment}
              <select name="departmentId" defaultValue="" style={inputStyle}>
                <option value="">{dict.tasks.departmentGeneral}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {isCorporate && (
            <label style={labelStyle}>
              {dict.tasks.fieldProperty}
              <select name="propertyId" defaultValue="" style={inputStyle}>
                <option value="">{dict.tasks.propertyAll}</option>
                {propertyOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label style={labelStyle}>
            {dict.tasks.fieldAssignee}
            <select name="assignedToId" defaultValue="" style={inputStyle}>
              <option value="">{dict.tasks.unassigned}</option>
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" style={createButtonStyle}>
            {dict.tasks.create}
          </button>
        </ToastForm>
      </section>

      <section style={{ ...cardStyle, padding: "1rem 1.25rem" }}>
        <form
          method="get"
          style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}
        >
          <label style={{ ...labelStyle, minWidth: 180 }}>
            {dict.tasks.fieldAssignee}
            <select name="assignee" defaultValue={assignee ?? ""} style={inputStyle}>
              <option value="">{dict.common.all}</option>
              <option value="unassigned">{dict.tasks.unassigned}</option>
              {assignableOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ ...labelStyle, minWidth: 160 }}>
            {dict.tasks.filterStatus}
            <select name="status" defaultValue={statusFilter ?? ""} style={inputStyle}>
              <option value="">{dict.common.all}</option>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {dict.taskStatus[s]}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" style={{ ...createButtonStyle, padding: "0.55rem 1rem" }}>
            {dict.tasks.filter}
          </button>
          {filtersActive && (
            <a
              href="/tasks"
              style={{ fontSize: "0.85rem", color: "var(--crc-brown)", alignSelf: "center" }}
            >
              {dict.tasks.clear}
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
                <h2 style={{ ...sectionTitleStyle, margin: 0 }}>{dict.taskStatus[s]}</h2>
                <span style={{ color: "#aaa", fontSize: "0.8rem", fontWeight: 600 }}>{items.length}</span>
              </div>

              {items.length === 0 ? (
                <p style={{ color: "#bbb", fontSize: "0.8rem", margin: 0 }}>{dict.tasks.emptyColumn}</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {items.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      canModify={canModifyTask(role, userDepartmentId, userPropertyId, task)}
                      showDepartment={isCorporate}
                      assignableUsers={assignableOptions}
                      departments={departmentOptions}
                      properties={propertyOptions}
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
