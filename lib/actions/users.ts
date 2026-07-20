"use server"

import argon2 from "argon2"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { recordAudit } from "@/lib/audit"
import { emailProblem } from "@/lib/email"

// Resultado de validación que ToastForm muestra al admin como mensaje de error.
type ActionError = { ok: false; message: string }
const fail = (message: string): ActionError => ({ ok: false, message })

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
    return fail("Nombre, correo y contraseña son obligatorios")
  }

  if (password.length < 8) {
    return fail("La contraseña debe tener al menos 8 caracteres")
  }

  if (!Object.values(Role).includes(roleValue as Role)) {
    return fail("Rol inválido")
  }

  const badEmail = await emailProblem(email)
  if (badEmail) {
    return fail(badEmail)
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return fail("Ese correo ya está registrado")
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
    return fail("Nombre y correo son obligatorios")
  }

  if (password && password.length < 8) {
    return fail("La contraseña debe tener al menos 8 caracteres")
  }

  if (!Object.values(Role).includes(roleValue as Role)) {
    return fail("Rol inválido")
  }

  const badEmail = await emailProblem(email)
  if (badEmail) {
    return fail(badEmail)
  }

  const emailOwner = await prisma.user.findUnique({ where: { email } })
  if (emailOwner && emailOwner.id !== userId) {
    return fail("Ese correo ya está en uso por otro usuario")
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      fullName,
      email,
      role: roleValue as Role,
      departmentId,
      // Campo de clave vacío = se conserva la contraseña actual. Al cambiarla,
      // se desbloquea la cuenta (útil cuando el usuario olvidó la clave).
      ...(password
        ? { passwordHash: await argon2.hash(password), failedLoginAttempts: 0, lockedUntil: null }
        : {}),
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

// Quita el bloqueo por intentos fallidos de forma inmediata (lo usa el admin).
export async function unlockUser(formData: FormData) {
  await requireSuperAdmin()

  const userId = String(formData.get("userId") ?? "")
  if (!userId) {
    throw new Error("Falta el usuario")
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  })

  await recordAudit({
    action: "updated",
    entityType: "user",
    entityId: userId,
    entityLabel: `${updated.fullName} <${updated.email}>`,
    details: "desbloqueado",
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
