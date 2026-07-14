"use server"

import argon2 from "argon2"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

async function requireSuperAdmin() {
  const session = await auth()
  const role = (session?.user as { role?: Role } | undefined)?.role
  if (role !== "SUPER_ADMIN") {
    throw new Error("No autorizado")
  }
}

export async function createUser(formData: FormData) {
  await requireSuperAdmin()

  const fullName = String(formData.get("fullName") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const roleValue = String(formData.get("role") ?? "")
  const departmentId = String(formData.get("departmentId") ?? "") || null

  if (!fullName || !email || !password) {
    throw new Error("Nombre, correo y contraseña son obligatorios")
  }

  if (!Object.values(Role).includes(roleValue as Role)) {
    throw new Error("Rol inválido")
  }

  const passwordHash = await argon2.hash(password)

  await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role: roleValue as Role,
      departmentId,
    },
  })

  revalidatePath("/admin/users")
}

export async function resetPassword(formData: FormData) {
  await requireSuperAdmin()

  const userId = String(formData.get("userId") ?? "")
  const password = String(formData.get("password") ?? "")

  if (!userId || !password) {
    throw new Error("Falta el usuario o la contraseña nueva")
  }

  const passwordHash = await argon2.hash(password)

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })

  revalidatePath("/admin/users")
}

export async function toggleUserActive(formData: FormData) {
  await requireSuperAdmin()

  const userId = String(formData.get("userId") ?? "")
  const nextActive = formData.get("nextActive") === "true"

  if (!userId) {
    throw new Error("Falta el usuario")
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: nextActive },
  })

  revalidatePath("/admin/users")
}
