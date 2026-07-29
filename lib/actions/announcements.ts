"use server"

import { revalidatePath } from "next/cache"
import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { recordAudit } from "@/lib/audit"
import { notifyAnnouncementPublished } from "@/lib/notifications"
import { canViewAllDepartments, canViewAllProperties } from "@/lib/permissions"
import {
  ANNOUNCEMENT_LEVELS,
  canPublishAnnouncements,
  canModifyAnnouncement,
} from "@/lib/announcements"

type Publisher = { id: string; role: Role; departmentId: string | null; propertyId: string | null }

async function requirePublisher(): Promise<Publisher> {
  const session = await auth()
  const user = session?.user as
    | { id?: string; role?: Role; departmentId?: string | null; propertyId?: string | null }
    | undefined
  if (!user?.id || !user.role || !canPublishAnnouncements(user.role)) {
    throw new Error("No autorizado")
  }
  return {
    id: user.id,
    role: user.role,
    departmentId: user.departmentId ?? null,
    propertyId: user.propertyId ?? null,
  }
}

// Autoriza sobre un aviso ya existente: los no corporativos solo pueden tocar los suyos.
async function requireModifiableAnnouncement(publisher: Publisher, id: string) {
  const ann = await prisma.announcement.findUnique({
    where: { id },
    select: { id: true, publishedById: true },
  })
  if (!ann) throw new Error("El aviso no existe")
  if (!canModifyAnnouncement(publisher.role, publisher.id, ann)) {
    throw new Error("No autorizado")
  }
  return ann
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

  const expiresRaw = String(formData.get("expiresAt") ?? "").trim()
  const expiresAt = expiresRaw ? new Date(expiresRaw) : null
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    throw new Error("Fecha de vencimiento inválida")
  }

  // Alcance del aviso. Los corporativos eligen (toda la empresa, un departamento,
  // una propiedad); los demás quedan ATADOS a su propio departamento + propiedad,
  // ignorando lo que llegue del formulario para que no publiquen fuera de su ámbito.
  let departmentId: string | null
  let propertyId: string | null

  if (canViewAllDepartments(publisher.role)) {
    departmentId = String(formData.get("departmentId") ?? "") || null
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId }, select: { id: true } })
      if (!dept) throw new Error("Departamento inválido")
    }
  } else {
    if (!publisher.departmentId) {
      throw new Error("No tienes un departamento asignado para publicar avisos")
    }
    departmentId = publisher.departmentId
  }

  if (canViewAllProperties(publisher.role)) {
    propertyId = String(formData.get("propertyId") ?? "") || null
    if (propertyId) {
      const prop = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } })
      if (!prop) throw new Error("Propiedad inválida")
    }
  } else {
    propertyId = publisher.propertyId
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
      propertyId,
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

  await notifyAnnouncementPublished({ title, departmentId, propertyId, publisherId: publisher.id })

  revalidatePath("/alerts")
  revalidatePath("/dashboard")
}

export async function toggleAnnouncementStatus(formData: FormData) {
  const publisher = await requirePublisher()

  const id = String(formData.get("announcementId") ?? "")
  if (!id) throw new Error("Falta el aviso")
  await requireModifiableAnnouncement(publisher, id)
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
  const publisher = await requirePublisher()

  const id = String(formData.get("announcementId") ?? "")
  if (!id) throw new Error("Falta el aviso")
  await requireModifiableAnnouncement(publisher, id)
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
  const publisher = await requirePublisher()

  const id = String(formData.get("announcementId") ?? "")
  if (!id) throw new Error("Falta el aviso")
  await requireModifiableAnnouncement(publisher, id)

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
