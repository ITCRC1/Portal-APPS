import { PRIORITY_LABELS, STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/lib/tasks"
import { updateTaskStatus, deleteTask } from "@/lib/actions/tasks"

type TaskCardData = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: Date | null
  department: { name: string } | null
  assignedTo: { fullName: string } | null
}

const PRIORITY_COLORS: Record<string, { bg: string; fg: string }> = {
  high: { bg: "#f6e0dd", fg: "#a33" },
  medium: { bg: "#f5ecd6", fg: "#8a6d2b" },
  low: { bg: "#e6f0e0", fg: "var(--crc-green)" },
}

function formatDue(date: Date): string {
  return date.toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" })
}

function moveButton(status: TaskStatus, taskId: string, label: string) {
  return (
    <form action={updateTaskStatus} style={{ display: "inline" }}>
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        style={{
          padding: "0.3rem 0.5rem",
          borderRadius: 6,
          border: "1px solid var(--crc-brown)",
          backgroundColor: "var(--crc-white)",
          color: "var(--crc-brown-dark)",
          cursor: "pointer",
          fontSize: "0.72rem",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </button>
    </form>
  )
}

export function TaskCard({
  task,
  canModify,
  showDepartment,
}: {
  task: TaskCardData
  canModify: boolean
  showDepartment: boolean
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.15rem" }}>
          {prevStatus && moveButton(prevStatus, task.id, `← ${STATUS_LABELS[prevStatus]}`)}
          {nextStatus && moveButton(nextStatus, task.id, `${STATUS_LABELS[nextStatus]} →`)}
          <form action={deleteTask} style={{ display: "inline", marginLeft: "auto" }}>
            <input type="hidden" name="taskId" value={task.id} />
            <button
              type="submit"
              style={{
                padding: "0.3rem 0.5rem",
                borderRadius: 6,
                border: "1px solid #d9b3b3",
                backgroundColor: "var(--crc-white)",
                color: "#a33",
                cursor: "pointer",
                fontSize: "0.72rem",
              }}
            >
              Eliminar
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
