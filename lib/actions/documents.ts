"use server"

import { revalidatePath } from "next/cache"
import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { CONFIDENTIALITY_LABELS } from "@/lib/permissions"

const MAX_SIZE = 15 * 1024 * 1024 // 15 MB

// Extensiones permitidas -> tipo MIME con que se sirve la descarga.
const ALLOWED: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
}

const CATEGORIES = [
  "SOP",
  "Policy",
  "Financial Report",
  "Board Package",
  "Contract",
  "Insurance",
  "HR Document",
  "CAPEX",
  "Legal",
  "Template",
  "Otro",
]

async function requireSuperAdminId(): Promise<string> {
  const session = await auth()
  const user = session?.user as { id?: string; role?: Role } | undefined
  if (user?.role !== "SUPER_ADMIN" || !user.id) {
    throw new Error("No autorizado")
  }
  return user.id
}

export async function createDocument(formData: FormData) {
  const uploadedById = await requireSuperAdminId()

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Debes seleccionar un archivo")
  }
  if (file.size > MAX_SIZE) {
    throw new Error("El archivo supera el límite de 15 MB")
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  const mimeType = ALLOWED[ext]
  if (!mimeType) {
    throw new Error(`Tipo de archivo no permitido: .${ext}`)
  }

  const name = String(formData.get("name") ?? "").trim() || file.name.replace(/\.[^.]+$/, "")
  const description = String(formData.get("description") ?? "").trim() || null
  const category = String(formData.get("category") ?? "Otro")
  const confidentiality = String(formData.get("confidentiality") ?? "department")
  const departmentId = String(formData.get("departmentId") ?? "") || null

  if (!CATEGORIES.includes(category)) {
    throw new Error("Categoría inválida")
  }
  if (!(confidentiality in CONFIDENTIALITY_LABELS)) {
    throw new Error("Nivel de confidencialidad inválido")
  }

  const bytes = Buffer.from(await file.arrayBuffer())

  const last = await prisma.document.findFirst({
    where: { departmentId },
    orderBy: { order: "desc" },
  })

  await prisma.document.create({
    data: {
      name,
      description,
      category,
      fileName: file.name,
      mimeType,
      size: bytes.length,
      content: bytes,
      confidentiality,
      status: "active",
      order: (last?.order ?? 0) + 1,
      departmentId,
      uploadedById,
    },
  })

  revalidatePath("/admin")
  revalidatePath("/documents")
}

export async function toggleDocumentStatus(formData: FormData) {
  await requireSuperAdminId()

  const id = String(formData.get("documentId") ?? "")
  const nextStatus = formData.get("nextStatus") === "active" ? "active" : "inactive"
  if (!id) {
    throw new Error("Falta el documento")
  }

  await prisma.document.update({ where: { id }, data: { status: nextStatus } })

  revalidatePath("/admin")
  revalidatePath("/documents")
}

export async function deleteDocument(formData: FormData) {
  await requireSuperAdminId()

  const id = String(formData.get("documentId") ?? "")
  if (!id) {
    throw new Error("Falta el documento")
  }

  await prisma.document.delete({ where: { id } })

  revalidatePath("/admin")
  revalidatePath("/documents")
}
