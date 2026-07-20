import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { canAccessModule, type ModuleKey } from "@/lib/permissions"

/**
 * Guard de todas las páginas protegidas. Además de exigir sesión, re-valida al
 * usuario contra la base en cada carga: si fue desactivado o le cambiaron el rol,
 * se aplica de inmediato (el token JWT por sí solo tardaría hasta su expiración).
 * También refresca rol y departamento reales en la sesión que leen las páginas.
 */
export async function requireModuleAccess(moduleKey: ModuleKey) {
  const session = await auth()
  const id = (session?.user as { id?: string } | undefined)?.id

  if (!session || !id) {
    redirect("/login")
  }

  const dbUser = await prisma.user.findUnique({
    where: { id },
    select: { isActive: true, role: true, departmentId: true },
  })

  if (!dbUser || !dbUser.isActive) {
    redirect("/login")
  }

  if (!canAccessModule(dbUser.role, moduleKey)) {
    redirect("/dashboard")
  }

  // Valores reales (no los del token, que pueden estar desactualizados).
  session.user.role = dbUser.role
  session.user.departmentId = dbUser.departmentId
  return session
}
