"use server"

import { revalidatePath } from "next/cache"
import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { recordAudit } from "@/lib/audit"

export async function createPasswordChangeRequest(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const message = String(formData.get("message") ?? "").trim() || null

  if (!email) {
    throw new Error("El correo es obligatorio")
  }

  const created = await prisma.passwordChangeRequest.create({
    data: { email, message },
  })

  // Solicitud pública (sin sesión): el actor es quien pide el cambio.
  await recordAudit({
    action: "created",
    entityType: "password-request",
    entityId: created.id,
    entityLabel: email,
    actor: { email, role: "solicitante" },
  })
}

export async function resolvePasswordChangeRequest(formData: FormData) {
  const session = await auth()
  const role = (session?.user as { role?: Role } | undefined)?.role
  if (role !== "SUPER_ADMIN") {
    throw new Error("No autorizado")
  }

  const id = String(formData.get("id") ?? "")
  if (!id) {
    throw new Error("Falta el ticket")
  }

  const resolved = await prisma.passwordChangeRequest.update({
    where: { id },
    data: { status: "resolved", resolvedAt: new Date() },
  })

  await recordAudit({
    action: "resolved",
    entityType: "password-request",
    entityId: id,
    entityLabel: resolved.email,
  })

  revalidatePath("/admin")
}
