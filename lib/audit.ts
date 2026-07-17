import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "activated"
  | "deactivated"
  | "resolved"

export type AuditEntity =
  | "user"
  | "department"
  | "document"
  | "task"
  | "announcement"
  | "password-request"

type RecordInput = {
  action: AuditAction
  entityType: AuditEntity
  entityId?: string | null
  entityLabel: string
  details?: string | null
  // Para acciones sin sesión (p. ej. una solicitud pública de cambio de clave).
  actor?: { email: string; role?: string }
}

/**
 * Escribe una entrada en la bitácora. El actor sale de la sesión salvo que se pase
 * explícito. Nunca lanza: si el registro falla, la operación real no debe romperse.
 */
export async function recordAudit(input: RecordInput): Promise<void> {
  try {
    let actorId: string | null = null
    let actorEmail = input.actor?.email
    let actorRole = input.actor?.role

    if (!actorEmail) {
      const session = await auth()
      const u = session?.user as { id?: string; email?: string; role?: Role } | undefined
      actorId = u?.id ?? null
      actorEmail = u?.email ?? "sistema"
      actorRole = u?.role
    }

    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        entityLabel: input.entityLabel,
        details: input.details ?? null,
        actorId,
        actorEmail,
        actorRole: actorRole ?? "desconocido",
      },
    })
  } catch (e) {
    console.error("[audit] no se pudo registrar la acción:", e)
  }
}

export const ACTION_LABELS: Record<string, string> = {
  created: "Creó",
  updated: "Editó",
  deleted: "Eliminó",
  activated: "Activó",
  deactivated: "Desactivó",
  resolved: "Resolvió",
}

export const ENTITY_LABELS: Record<string, string> = {
  user: "Usuario",
  department: "Departamento",
  document: "Documento",
  task: "Tarea",
  announcement: "Aviso",
  "password-request": "Ticket de contraseña",
}
