"use server"

import { revalidatePath } from "next/cache"
import type { Role } from "@prisma/client"
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

// "Oxygen Jungle Villas" -> "oxygen-jungle-villas"
function toSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita los acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function createProperty(formData: FormData) {
  await requireSuperAdmin()

  const name = String(formData.get("name") ?? "").trim()
  const icon = String(formData.get("icon") ?? "").trim() || null

  if (!name) {
    throw new Error("El nombre es obligatorio")
  }

  const slug = toSlug(name)
  if (!slug) {
    throw new Error("El nombre debe tener al menos una letra o número")
  }

  const existing = await prisma.property.findUnique({ where: { slug } })
  if (existing) {
    throw new Error("Ya existe una propiedad con ese nombre")
  }

  const last = await prisma.property.findFirst({ orderBy: { order: "desc" } })

  const created = await prisma.property.create({
    data: {
      name,
      slug,
      icon,
      order: (last?.order ?? 0) + 1,
    },
  })

  await recordAudit({
    action: "created",
    entityType: "property",
    entityId: created.id,
    entityLabel: name,
  })

  revalidatePath("/admin")
}

export async function updateProperty(formData: FormData) {
  await requireSuperAdmin()

  const id = String(formData.get("propertyId") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const icon = String(formData.get("icon") ?? "").trim() || null

  if (!id) {
    throw new Error("Falta la propiedad")
  }

  if (!name) {
    throw new Error("El nombre es obligatorio")
  }

  // El slug no se recalcula al renombrar (es identificador estable).
  await prisma.property.update({
    where: { id },
    data: { name, icon },
  })

  await recordAudit({
    action: "updated",
    entityType: "property",
    entityId: id,
    entityLabel: name,
  })

  revalidatePath("/admin")
}

export async function togglePropertyStatus(formData: FormData) {
  await requireSuperAdmin()

  const id = String(formData.get("propertyId") ?? "")
  const nextStatus = formData.get("nextStatus") === "active" ? "active" : "inactive"

  if (!id) {
    throw new Error("Falta la propiedad")
  }

  const updated = await prisma.property.update({
    where: { id },
    data: { status: nextStatus },
  })

  await recordAudit({
    action: nextStatus === "active" ? "activated" : "deactivated",
    entityType: "property",
    entityId: id,
    entityLabel: updated.name,
  })

  revalidatePath("/admin")
}
