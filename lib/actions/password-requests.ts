"use server"

import { revalidatePath } from "next/cache"
import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function createPasswordChangeRequest(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const message = String(formData.get("message") ?? "").trim() || null

  if (!email) {
    throw new Error("El correo es obligatorio")
  }

  await prisma.passwordChangeRequest.create({
    data: { email, message },
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

  await prisma.passwordChangeRequest.update({
    where: { id },
    data: { status: "resolved", resolvedAt: new Date() },
  })

  revalidatePath("/admin")
}
