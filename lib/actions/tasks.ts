"use server"

import { revalidatePath } from "next/cache"
import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { recordAudit } from "@/lib/audit"
import { notifyUser } from "@/lib/notifications"
import { canAccessModule, canViewAllDepartments } from "@/lib/permissions"
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  canModifyTask,
  type TaskStatus,
} from "@/lib/tasks"

type Actor = { id: string; role: Role; departmentId: string | null }

async function requireTasksActor(): Promise<Actor> {
  const session = await auth()
  const user = session?.user as
    | { id?: string; role?: Role; departmentId?: string | null }
    | undefined
  if (!user?.id || !user.role || !canAccessModule(user.role, "tasks")) {
    throw new Error("No autorizado")
  }
  return { id: user.id, role: user.role, departmentId: user.departmentId ?? null }
}

/**
 * Departamento en el que la tarea puede vivir según quién la crea/edita.
 * Un usuario sin visión corporativa solo puede trabajar en su propio departamento;
 * se ignora cualquier departmentId que llegue del formulario para que no pueda
 * crear tareas en departamentos ajenos.
 */
function resolveDepartmentId(actor: Actor, requested: string | null): string | null {
  if (canViewAllDepartments(actor.role)) return requested
  if (!actor.departmentId) {
    throw new Error("No tienes un departamento asignado para crear tareas")
  }
  return actor.departmentId
}

// El responsable debe pertenecer al departamento de la tarea (o ser corporativo).
async function validateAssignee(
  assigneeId: string | null,
  taskDepartmentId: string | null
): Promise<string | null> {
  if (!assigneeId) return null
  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: { departmentId: true, role: true, isActive: true },
  })
  if (!assignee || !assignee.isActive) {
    throw new Error("El responsable seleccionado no es válido")
  }
  const assigneeIsCorporate = canViewAllDepartments(assignee.role)
  if (
    taskDepartmentId !== null &&
    !assigneeIsCorporate &&
    assignee.departmentId !== taskDepartmentId
  ) {
    throw new Error("El responsable no pertenece a ese departamento")
  }
  return assigneeId
}

export async function createTask(formData: FormData) {
  const actor = await requireTasksActor()

  const title = String(formData.get("title") ?? "").trim()
  if (!title) {
    throw new Error("La tarea necesita un título")
  }
  const description = String(formData.get("description") ?? "").trim() || null

  const priority = String(formData.get("priority") ?? "medium")
  if (!TASK_PRIORITIES.includes(priority as (typeof TASK_PRIORITIES)[number])) {
    throw new Error("Prioridad inválida")
  }

  const dueRaw = String(formData.get("dueDate") ?? "").trim()
  const dueDate = dueRaw ? new Date(dueRaw) : null
  if (dueDate && Number.isNaN(dueDate.getTime())) {
    throw new Error("Fecha límite inválida")
  }

  const departmentId = resolveDepartmentId(actor, String(formData.get("departmentId") ?? "") || null)
  const assignedToId = await validateAssignee(
    String(formData.get("assignedToId") ?? "") || null,
    departmentId
  )

  const last = await prisma.task.findFirst({
    where: { departmentId, status: "todo" },
    orderBy: { order: "desc" },
  })

  const created = await prisma.task.create({
    data: {
      title,
      description,
      status: "todo",
      priority,
      dueDate,
      order: (last?.order ?? 0) + 1,
      departmentId,
      assignedToId,
      createdById: actor.id,
    },
  })

  await recordAudit({
    action: "created",
    entityType: "task",
    entityId: created.id,
    entityLabel: title,
  })

  // Notifica al responsable (salvo que se la asigne a sí mismo).
  if (assignedToId && assignedToId !== actor.id) {
    await notifyUser({
      userId: assignedToId,
      type: "task-assigned",
      title: "Nueva tarea asignada",
      body: title,
      link: "/tasks",
    })
  }

  revalidatePath("/tasks")
}

// Autoriza sobre la tarea ya existente comprobando su departamento real.
async function requireModifiableTask(actor: Actor, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, departmentId: true },
  })
  if (!task) {
    throw new Error("La tarea no existe")
  }
  if (!canModifyTask(actor.role, actor.departmentId, task.departmentId)) {
    throw new Error("No autorizado")
  }
  return task
}

export async function updateTaskStatus(formData: FormData) {
  const actor = await requireTasksActor()
  const id = String(formData.get("taskId") ?? "")
  const status = String(formData.get("status") ?? "")
  if (!id) throw new Error("Falta la tarea")
  if (!TASK_STATUSES.includes(status as TaskStatus)) {
    throw new Error("Estado inválido")
  }

  await requireModifiableTask(actor, id)
  const updated = await prisma.task.update({ where: { id }, data: { status } })

  await recordAudit({
    action: "updated",
    entityType: "task",
    entityId: id,
    entityLabel: updated.title,
    details: `estado: ${status}`,
  })

  revalidatePath("/tasks")
}

export async function updateTask(formData: FormData) {
  const actor = await requireTasksActor()
  const id = String(formData.get("taskId") ?? "")
  if (!id) throw new Error("Falta la tarea")

  const current = await requireModifiableTask(actor, id)
  const before = await prisma.task.findUnique({ where: { id }, select: { assignedToId: true } })

  const title = String(formData.get("title") ?? "").trim()
  if (!title) throw new Error("La tarea necesita un título")
  const description = String(formData.get("description") ?? "").trim() || null

  const priority = String(formData.get("priority") ?? "medium")
  if (!TASK_PRIORITIES.includes(priority as (typeof TASK_PRIORITIES)[number])) {
    throw new Error("Prioridad inválida")
  }

  const dueRaw = String(formData.get("dueDate") ?? "").trim()
  const dueDate = dueRaw ? new Date(dueRaw) : null
  if (dueDate && Number.isNaN(dueDate.getTime())) {
    throw new Error("Fecha límite inválida")
  }

  // Solo los roles corporativos pueden mover la tarea a otro departamento; los demás
  // la mantienen en el suyo (el único que pueden modificar).
  const departmentId = canViewAllDepartments(actor.role)
    ? String(formData.get("departmentId") ?? "") || null
    : current.departmentId

  const assignedToId = await validateAssignee(
    String(formData.get("assignedToId") ?? "") || null,
    departmentId
  )

  const updated = await prisma.task.update({
    where: { id },
    data: { title, description, priority, dueDate, departmentId, assignedToId },
  })

  await recordAudit({
    action: "updated",
    entityType: "task",
    entityId: id,
    entityLabel: updated.title,
    details: "editada",
  })

  // Notifica si se asignó a un responsable nuevo (distinto del anterior y del editor).
  if (assignedToId && assignedToId !== before?.assignedToId && assignedToId !== actor.id) {
    await notifyUser({
      userId: assignedToId,
      type: "task-assigned",
      title: "Se te asignó una tarea",
      body: updated.title,
      link: "/tasks",
    })
  }

  revalidatePath("/tasks")
}

export async function deleteTask(formData: FormData) {
  const actor = await requireTasksActor()
  const id = String(formData.get("taskId") ?? "")
  if (!id) throw new Error("Falta la tarea")

  await requireModifiableTask(actor, id)
  const task = await prisma.task.findUnique({ where: { id }, select: { title: true } })
  await prisma.task.delete({ where: { id } })

  await recordAudit({
    action: "deleted",
    entityType: "task",
    entityId: id,
    entityLabel: task?.title ?? id,
  })

  revalidatePath("/tasks")
}
