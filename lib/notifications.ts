import { prisma } from "@/lib/prisma"

type NotifyInput = {
  userId: string
  type: "task-assigned" | "announcement"
  title: string
  body?: string | null
  link?: string | null
}

/**
 * Crea una notificación para un usuario. No lanza: un fallo aquí no debe romper la
 * acción principal (crear tarea, publicar aviso, etc.).
 */
export async function notifyUser(input: NotifyInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    })
  } catch (e) {
    console.error("[notify] no se pudo crear la notificación:", e)
  }
}

/**
 * Notifica a la audiencia de un aviso: si es general, a todos los usuarios activos;
 * si es de un departamento, solo a ese departamento. Nunca al propio autor.
 */
export async function notifyAnnouncementPublished(input: {
  title: string
  departmentId: string | null
  publisherId: string
}): Promise<void> {
  try {
    const recipients = await prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: input.publisherId },
        ...(input.departmentId ? { departmentId: input.departmentId } : {}),
      },
      select: { id: true },
    })
    if (recipients.length === 0) return

    await prisma.notification.createMany({
      data: recipients.map((r) => ({
        userId: r.id,
        type: "announcement" as const,
        title: "Nuevo aviso",
        body: input.title,
        link: "/alerts",
      })),
    })
  } catch (e) {
    console.error("[notify] no se pudo notificar el aviso:", e)
  }
}
