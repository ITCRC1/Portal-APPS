import type { Prisma, Role } from "@prisma/client"
import { canViewAllDepartments, propertyWhere, propertyMatches } from "@/lib/permissions"

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
 * nadie reciba tareas fuera de su ámbito. Combina departamento y propiedad con AND:
 *  - roles corporativos: todas
 *  - usuario con departamento: las de su departamento + las generales (sin departamento)
 *  - usuario sin departamento: solo las generales
 *  - además: acotadas a su propiedad + las corporativas (propertyId null)
 */
export function visibleTasksWhere(
  role: Role,
  userDepartmentId: string | null,
  userPropertyId: string | null
): Prisma.TaskWhereInput {
  const clauses: Prisma.TaskWhereInput[] = []

  if (!canViewAllDepartments(role)) {
    clauses.push(
      userDepartmentId
        ? { OR: [{ departmentId: userDepartmentId }, { departmentId: null }] }
        : { departmentId: null }
    )
  }

  const prop = propertyWhere(role, userPropertyId)
  if ("OR" in prop) clauses.push(prop as Prisma.TaskWhereInput)

  if (clauses.length === 0) return {}
  if (clauses.length === 1) return clauses[0]
  return { AND: clauses }
}

/**
 * ¿Puede el usuario crear/editar/mover/eliminar esta tarea? Debe pasar los dos ejes:
 *  - departamento: corporativo, o la tarea es de su departamento (las generales,
 *    departmentId null, solo las gestionan los roles corporativos);
 *  - propiedad: corporativo, o la tarea es corporativa (propertyId null) o de su
 *    propiedad (nunca la de otra propiedad).
 */
export function canModifyTask(
  role: Role,
  userDepartmentId: string | null,
  userPropertyId: string | null,
  task: { departmentId: string | null; propertyId: string | null }
): boolean {
  const departmentOk =
    canViewAllDepartments(role) ||
    (task.departmentId !== null && task.departmentId === userDepartmentId)
  if (!departmentOk) return false
  return propertyMatches(role, userPropertyId, task.propertyId)
}
