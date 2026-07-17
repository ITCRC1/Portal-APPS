import type { Prisma, Role } from "@prisma/client"
import { canViewAllDepartments } from "@/lib/permissions"

// ---------- Estados y prioridades ----------

export const TASK_STATUSES = ["todo", "in-progress", "done"] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const STATUS_LABELS: Record<string, string> = {
  todo: "Pendiente",
  "in-progress": "En progreso",
  done: "Hecha",
}

export const TASK_PRIORITIES = ["low", "medium", "high"] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
}

/**
 * Filtro de tareas visibles (PRD 13). Se aplica dentro de la consulta para que
 * nadie reciba tareas fuera de su ámbito:
 *  - roles corporativos: todas
 *  - usuario con departamento: las de su departamento + las generales (sin departamento)
 *  - usuario sin departamento: solo las generales
 */
export function visibleTasksWhere(
  role: Role,
  userDepartmentId: string | null
): Prisma.TaskWhereInput {
  if (canViewAllDepartments(role)) return {}
  if (userDepartmentId) {
    return { OR: [{ departmentId: userDepartmentId }, { departmentId: null }] }
  }
  return { departmentId: null }
}

/**
 * ¿Puede el usuario crear/editar/mover/eliminar una tarea de este departamento?
 * Las tareas generales (departmentId null) solo las gestionan los roles corporativos.
 */
export function canModifyTask(
  role: Role,
  userDepartmentId: string | null,
  taskDepartmentId: string | null
): boolean {
  if (canViewAllDepartments(role)) return true
  return taskDepartmentId !== null && taskDepartmentId === userDepartmentId
}
