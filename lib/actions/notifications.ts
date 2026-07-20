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

// Marca una notificación como leída y navega a su enlace. El destino se toma de la
// propia notificación en la base (no del formulario) y se valida que sea una ruta
// interna, para no abrir un redirect a un sitio externo. Filtra por userId para que
// nadie toque notificaciones ajenas.
export async function openNotification(formData: FormData) {
  const userId = await requireUserId()
  const id = String(formData.get("id") ?? "")

  let link = "/dashboard"
  if (id) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
      select: { link: true },
    })
    if (notification) {
      await prisma.notification.update({ where: { id }, data: { read: true } })
      // Solo rutas internas ("/algo"); nunca "//host" ni URLs absolutas.
      if (notification.link && /^\/(?!\/)/.test(notification.link)) {
        link = notification.link
      }
    }
  }
  redirect(link)
}

export async function markAllNotificationsRead() {
  const userId = await requireUserId()
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } })
  revalidatePath("/", "layout")
}
