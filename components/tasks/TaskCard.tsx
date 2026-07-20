import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskStatus,
} from "@/lib/tasks"
import { updateTaskStatus, updateTask, deleteTask } from "@/lib/actions/tasks"
import { ToastForm } from "@/components/ui/ToastForm"

type TaskCardData = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: Date | null
  departmentId: string | null
  assignedToId: string | null
  department: { name: string } | null
  assignedTo: { fullName: string } | null
}

type Option = { id: string; name: string }

const PRIORITY_COLORS: Record<string, { bg: string; fg: string }> = {
  high: { bg: "#f6e0dd", fg: "#a33" },
  medium: { bg: "#f5ecd6", fg: "#8a6d2b" },
  low: { bg: "#e6f0e0", fg: "var(--crc-green)" },
}

const smallBtn = {
  padding: "0.3rem 0.5rem",
  borderRadius: 6,
  border: "1px solid var(--crc-brown)",
  backgroundColor: "var(--crc-white)",
  color: "var(--crc-brown-dark)",
  cursor: "pointer",
  fontSize: "0.72rem",
  whiteSpace: "nowrap" as const,
}

const editInput = {
  width: "100%",
  minWidth: 0,
  padding: "0.35rem 0.45rem",
  borderRadius: 6,
  border: "1px solid var(--crc-brown)",
  backgroundColor: "var(--crc-white)",
  color: "var(--crc-brown-dark)",
  fontSize: "0.75rem",
}

function formatDue(date: Date): string {
  return date.toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" })
}

function dateInputValue(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : ""
}

function moveButton(status: TaskStatus, taskId: string, label: string) {
  return (
    <ToastForm action={updateTaskStatus} success="Tarea movida" style={{ display: "inline" }}>
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" style={smallBtn}>
        {label}
      </button>
    </ToastForm>
  )
}

export function TaskCard({
  task,
  canModify,
  showDepartment,
  assignableUsers,
  departments,
  isCorporate,
}: {
  task: TaskCardData
  canModify: boolean
  showDepartment: boolean
  assignableUsers: Option[]
  departments: Option[]
  isCorporate: boolean
}) {
  const priority = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium
  const idx = TASK_STATUSES.indexOf(task.status as TaskStatus)
  const prevStatus = idx > 0 ? TASK_STATUSES[idx - 1] : null
  const nextStatus = idx >= 0 && idx < TASK_STATUSES.length - 1 ? TASK_STATUSES[idx + 1] : null
  const overdue = task.dueDate && task.status !== "done" && task.dueDate.getTime() < Date.now()

  return (
    <div
      data-testid={`task-card-${task.id}`}
      data-can-modify={canModify ? "true" : "false"}
      style={{
        backgroundColor: "var(--crc-white)",
        borderRadius: 8,
        border: "1px solid #eee3d6",
        borderLeft: `4px solid ${priority.fg}`,
        padding: "0.7rem 0.8rem",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "start" }}>
        <span style={{ fontWeight: 600, color: "var(--crc-brown-dark)", fontSize: "0.9rem", lineHeight: 1.3 }}>
          {task.title}
        </span>
        <span
          style={{
            flexShrink: 0,
            padding: "0.1rem 0.45rem",
            borderRadius: 999,
            fontSize: "0.66rem",
            fontWeight: 600,
            backgroundColor: priority.bg,
            color: priority.fg,
          }}
        >
          {PRIORITY_LABELS[task.priority] ?? task.priority}
        </span>
      </div>

      {task.description && (
        <p style={{ margin: 0, fontSize: "0.78rem", color: "#666", lineHeight: 1.4 }}>{task.description}</p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 0.8rem", fontSize: "0.72rem", color: "#888" }}>
        {task.assignedTo && <span>👤 {task.assignedTo.fullName}</span>}
        {task.dueDate && (
          <span style={{ color: overdue ? "#a33" : "#888", fontWeight: overdue ? 600 : 400 }}>
            📅 {formatDue(task.dueDate)}
            {overdue ? " (vencida)" : ""}
          </span>
        )}
        {showDepartment && <span>🏢 {task.department?.name ?? "General"}</span>}
      </div>

      {canModify && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.15rem" }}>
            {prevStatus && moveButton(prevStatus, task.id, `← ${STATUS_LABELS[prevStatus]}`)}
            {nextStatus && moveButton(nextStatus, task.id, `${STATUS_LABELS[nextStatus]} →`)}
            <ToastForm
              action={deleteTask}
              success="Tarea eliminada"
              style={{ display: "inline", marginLeft: "auto" }}
            >
              <input type="hidden" name="taskId" value={task.id} />
              <button
                type="submit"
                style={{ ...smallBtn, border: "1px solid #d9b3b3", color: "#a33" }}
              >
                Eliminar
              </button>
            </ToastForm>
          </div>

          <details>
            <summary style={{ cursor: "pointer", fontSize: "0.72rem", color: "var(--crc-brown)" }}>
              Editar
            </summary>
            <ToastForm
              action={updateTask}
              success="Cambios guardados"
              style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.5rem" }}
            >
              <input type="hidden" name="taskId" value={task.id} />
              <input name="title" defaultValue={task.title} required style={editInput} placeholder="Título" />
              <input
                name="description"
                defaultValue={task.description ?? ""}
                style={editInput}
                placeholder="Descripción"
              />
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <select name="priority" defaultValue={task.priority} style={editInput}>
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
                <input type="date" name="dueDate" defaultValue={dateInputValue(task.dueDate)} style={editInput} />
              </div>
              {isCorporate && (
                <select name="departmentId" defaultValue={task.departmentId ?? ""} style={editInput}>
                  <option value="">General (sin departamento)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
              <select name="assignedToId" defaultValue={task.assignedToId ?? ""} style={editInput}>
                <option value="">Sin asignar</option>
                {assignableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                style={{ ...smallBtn, backgroundColor: "var(--crc-green)", color: "var(--crc-white)", border: "none", fontWeight: 600 }}
              >
                Guardar cambios
              </button>
            </ToastForm>
          </details>
        </>
      )}
    </div>
  )
}
