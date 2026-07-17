"use server"

import { revalidatePath } from "next/cache"
import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { recordAudit } from "@/lib/audit"
import { ANNOUNCEMENT_LEVELS, canPublishAnnouncements } from "@/lib/announcements"

type Publisher = { id: string; role: Role }

async function requirePublisher(): Promise<Publisher> {
  const session = await auth()
  const user = session?.user as { id?: string; role?: Role } | undefined
  if (!user?.id || !user.role || !canPublishAnnouncements(user.role)) {
    throw new Error("No autorizado")
  }
  return { id: user.id, role: user.role }
}

export async function createAnnouncement(formData: FormData) {
  const publisher = await requirePublisher()

  const title = String(formData.get("title") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()
  if (!title) throw new Error("El aviso necesita un título")
  if (!body) throw new Error("El aviso necesita un mensaje")

  const level = String(formData.get("level") ?? "info")
  if (!ANNOUNCEMENT_LEVELS.includes(level as (typeof ANNOUNCEMENT_LEVELS)[number])) {
    throw new Error("Nivel inválido")
  }

  const pinned = formData.get("pinned") === "on"
  const departmentId = String(formData.get("departmentId") ?? "") || null

  const expiresRaw = String(formData.get("expiresAt") ?? "").trim()
  const expiresAt = expiresRaw ? new Date(expiresRaw) : null
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    throw new Error("Fecha de vencimiento inválida")
  }

  // El departamento se valida contra los existentes; los roles corporativos pueden
  // dirigir el aviso a cualquier departamento o dejarlo general (departmentId null).
  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId }, select: { id: true } })
    if (!dept) throw new Error("Departamento inválido")
  }

  const created = await prisma.announcement.create({
    data: {
      title,
      body,
      level,
      pinned,
      status: "active",
      expiresAt,
      departmentId,
      publishedById: publisher.id,
    },
  })

  await recordAudit({
    action: "created",
    entityType: "announcement",
    entityId: created.id,
    entityLabel: title,
    details: `nivel: ${level}`,
  })

  revalidatePath("/alerts")
  revalidatePath("/dashboard")
}

export async function toggleAnnouncementStatus(formData: FormData) {
  await requirePublisher()

  const id = String(formData.get("announcementId") ?? "")
  if (!id) throw new Error("Falta el aviso")
  const nextStatus = formData.get("nextStatus") === "active" ? "active" : "archived"

  const updated = await prisma.announcement.update({ where: { id }, data: { status: nextStatus } })

  await recordAudit({
    action: nextStatus === "active" ? "activated" : "deactivated",
    entityType: "announcement",
    entityId: id,
    entityLabel: updated.title,
  })

  revalidatePath("/alerts")
  revalidatePath("/dashboard")
}

export async function toggleAnnouncementPinned(formData: FormData) {
  await requirePublisher()

  const id = String(formData.get("announcementId") ?? "")
  if (!id) throw new Error("Falta el aviso")
  const pinned = formData.get("pinned") === "true"

  const updated = await prisma.announcement.update({ where: { id }, data: { pinned } })

  await recordAudit({
    action: "updated",
    entityType: "announcement",
    entityId: id,
    entityLabel: updated.title,
    details: pinned ? "fijado" : "desfijado",
  })

  revalidatePath("/alerts")
  revalidatePath("/dashboard")
}

export async function deleteAnnouncement(formData: FormData) {
  await requirePublisher()

  const id = String(formData.get("announcementId") ?? "")
  if (!id) throw new Error("Falta el aviso")

  const ann = await prisma.announcement.findUnique({ where: { id }, select: { title: true } })
  await prisma.announcement.delete({ where: { id } })

  await recordAudit({
    action: "deleted",
    entityType: "announcement",
    entityId: id,
    entityLabel: ann?.title ?? id,
  })

  revalidatePath("/alerts")
  revalidatePath("/dashboard")
}
