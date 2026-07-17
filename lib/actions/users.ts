"use server"

import argon2 from "argon2"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { recordAudit } from "@/lib/audit"

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

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new Error("Ese correo ya está registrado")
  }

  const passwordHash = await argon2.hash(password)

  const created = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role: roleValue as Role,
      departmentId,
    },
  })

  await recordAudit({
    action: "created",
    entityType: "user",
    entityId: created.id,
    entityLabel: `${fullName} <${email}>`,
    details: `rol: ${roleValue}`,
  })

  revalidatePath("/admin")
}

export async function updateUser(formData: FormData) {
  await requireSuperAdmin()

  const userId = String(formData.get("userId") ?? "")
  const fullName = String(formData.get("fullName") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const roleValue = String(formData.get("role") ?? "")
  const departmentId = String(formData.get("departmentId") ?? "") || null
  const password = String(formData.get("password") ?? "")

  if (!userId) {
    throw new Error("Falta el usuario")
  }

  if (!fullName || !email) {
    throw new Error("Nombre y correo son obligatorios")
  }

  if (!Object.values(Role).includes(roleValue as Role)) {
    throw new Error("Rol inválido")
  }

  const emailOwner = await prisma.user.findUnique({ where: { email } })
  if (emailOwner && emailOwner.id !== userId) {
    throw new Error("Ese correo ya está en uso por otro usuario")
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      fullName,
      email,
      role: roleValue as Role,
      departmentId,
      // Campo de clave vacío = se conserva la contraseña actual.
      ...(password ? { passwordHash: await argon2.hash(password) } : {}),
    },
  })

  await recordAudit({
    action: "updated",
    entityType: "user",
    entityId: userId,
    entityLabel: `${fullName} <${email}>`,
    details: password ? "incluye cambio de contraseña" : null,
  })

  revalidatePath("/admin")
}

export async function toggleUserActive(formData: FormData) {
  await requireSuperAdmin()

  const userId = String(formData.get("userId") ?? "")
  const nextActive = formData.get("nextActive") === "true"

  if (!userId) {
    throw new Error("Falta el usuario")
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: nextActive },
  })

  await recordAudit({
    action: nextActive ? "activated" : "deactivated",
    entityType: "user",
    entityId: userId,
    entityLabel: `${updated.fullName} <${updated.email}>`,
  })

  revalidatePath("/admin")
}
