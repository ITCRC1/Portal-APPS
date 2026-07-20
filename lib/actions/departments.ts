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

// "Operación & Logística" -> "operacion-logistica"
function toSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita los acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function createDepartment(formData: FormData) {
  await requireSuperAdmin()

  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim() || null
  const icon = String(formData.get("icon") ?? "").trim() || null
  const ownerName = String(formData.get("ownerName") ?? "").trim() || null

  if (!name) {
    throw new Error("El nombre es obligatorio")
  }

  const slug = toSlug(name)
  if (!slug) {
    throw new Error("El nombre debe tener al menos una letra o número")
  }

  const existing = await prisma.department.findUnique({ where: { slug } })
  if (existing) {
    throw new Error("Ya existe un departamento con ese nombre")
  }

  const last = await prisma.department.findFirst({ orderBy: { order: "desc" } })

  const created = await prisma.department.create({
    data: {
      name,
      slug,
      description,
      icon,
      ownerName,
      order: (last?.order ?? 0) + 1,
    },
  })

  await recordAudit({
    action: "created",
    entityType: "department",
    entityId: created.id,
    entityLabel: name,
  })

  revalidatePath("/admin")
  revalidatePath("/departments")
}

export async function updateDepartment(formData: FormData) {
  await requireSuperAdmin()

  const id = String(formData.get("departmentId") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim() || null
  const icon = String(formData.get("icon") ?? "").trim() || null
  const ownerName = String(formData.get("ownerName") ?? "").trim() || null

  if (!id) {
    throw new Error("Falta el departamento")
  }

  if (!name) {
    throw new Error("El nombre es obligatorio")
  }

  // El slug no se recalcula al renombrar: es la URL del departamento y cambiarlo
  // rompería los enlaces que la gente ya tenga guardados.
  await prisma.department.update({
    where: { id },
    data: { name, description, icon, ownerName },
  })

  await recordAudit({
    action: "updated",
    entityType: "department",
    entityId: id,
    entityLabel: name,
  })

  revalidatePath("/admin")
  revalidatePath("/departments")
}

export async function toggleDepartmentStatus(formData: FormData) {
  await requireSuperAdmin()

  const id = String(formData.get("departmentId") ?? "")
  const nextStatus = formData.get("nextStatus") === "active" ? "active" : "inactive"

  if (!id) {
    throw new Error("Falta el departamento")
  }

  const updated = await prisma.department.update({
    where: { id },
    data: { status: nextStatus },
  })

  await recordAudit({
    action: nextStatus === "active" ? "activated" : "deactivated",
    entityType: "department",
    entityId: id,
    entityLabel: updated.name,
  })

  revalidatePath("/admin")
  revalidatePath("/departments")
}
