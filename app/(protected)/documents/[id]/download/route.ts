import type { Role } from "@prisma/client"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canAccessDocument } from "@/lib/permissions"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await auth()
  const role = (session?.user as { role?: Role; departmentId?: string | null } | undefined)?.role
  if (!session || !role) {
    return new Response("No autenticado", { status: 401 })
  }

  const doc = await prisma.document.findUnique({ where: { id } })
  if (!doc || doc.status !== "active") {
    return new Response("Documento no encontrado", { status: 404 })
  }

  // El guard corre antes de entregar el archivo (PRD 13): nadie descarga fuera de su alcance.
  const userDepartmentId = (session.user as { departmentId?: string | null }).departmentId ?? null
  if (!canAccessDocument(role, userDepartmentId, doc)) {
    return new Response("No autorizado", { status: 403 })
  }

  // Nombre de archivo con caracteres no-ASCII: filename* con UTF-8 (RFC 5987).
  const asciiName = doc.fileName.replace(/[^\x20-\x7E]/g, "_")
  const encodedName = encodeURIComponent(doc.fileName)

  return new Response(new Uint8Array(doc.content), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(doc.size),
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, no-store",
    },
  })
}
