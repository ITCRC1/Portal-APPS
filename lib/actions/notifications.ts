"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

async function requireUserId(): Promise<string> {
  const session = await auth()
  const id = (session?.user as { id?: string } | undefined)?.id
  if (!id) throw new Error("No autorizado")
  return id
}

// Marca una notificación como leída y navega a su enlace (si tiene). Filtra por
// userId para que nadie marque notificaciones ajenas.
export async function openNotification(formData: FormData) {
  const userId = await requireUserId()
  const id = String(formData.get("id") ?? "")
  const link = String(formData.get("link") ?? "") || "/dashboard"
  if (id) {
    await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } })
  }
  redirect(link)
}

export async function markAllNotificationsRead() {
  const userId = await requireUserId()
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } })
  revalidatePath("/", "layout")
}
