import { auth } from "@/auth"
import { redirect } from "next/navigation"
import type { Role } from "@prisma/client"
import { canAccessModule, type ModuleKey } from "@/lib/permissions"

export async function requireModuleAccess(moduleKey: ModuleKey) {
  const session = await auth()
  const role = (session?.user as { role?: Role } | undefined)?.role

  if (!session || !role) {
    redirect("/login")
  }

  if (!canAccessModule(role, moduleKey)) {
    redirect("/dashboard")
  }

  return session
}
