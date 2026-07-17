import type { Prisma, Role } from "@prisma/client"
import { canViewAllDepartments } from "@/lib/permissions"

// ---------- Niveles ----------

export const ANNOUNCEMENT_LEVELS = ["info", "warning", "critical"] as const
export type AnnouncementLevel = (typeof ANNOUNCEMENT_LEVELS)[number]

export const LEVEL_LABELS: Record<string, string> = {
  info: "Informativo",
  warning: "Importante",
  critical: "Urgente",
}

/**
 * ¿Quién puede publicar/editar avisos? Solo los roles corporativos
 * (Super Admin / Ejecutivo); los demás únicamente los leen.
 */
export function canPublishAnnouncements(role: Role): boolean {
  return canViewAllDepartments(role)
}

/**
 * Filtro de avisos visibles para lectura (PRD 13). Solo activos y no vencidos:
 *  - roles corporativos: todos
 *  - usuario con departamento: los de su departamento + los generales
 *  - usuario sin departamento: solo los generales
 */
export function visibleAnnouncementsWhere(
  role: Role,
  userDepartmentId: string | null
): Prisma.AnnouncementWhereInput {
  const notExpired: Prisma.AnnouncementWhereInput = {
    status: "active",
    OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
  }

  if (canViewAllDepartments(role)) return notExpired

  const scope: Prisma.AnnouncementWhereInput = userDepartmentId
    ? { OR: [{ departmentId: userDepartmentId }, { departmentId: null }] }
    : { departmentId: null }

  return { AND: [notExpired, scope] }
}
