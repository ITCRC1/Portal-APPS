import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import type { Role } from "@prisma/client"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ACTION_LABELS, ENTITY_LABELS } from "@/lib/audit"
import { ROLE_LABELS } from "@/lib/permissions"

const CR_TZ = "America/Costa_Rica"
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function fmtDateTime(date: Date): string {
  return new Intl.DateTimeFormat("es-CR", {
    timeZone: CR_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

// Quita caracteres que la fuente estándar (WinAnsi) no puede dibujar (emojis, etc.).
function sanitize(text: string): string {
  return text.replace(/[^\t\n\r\x20-\x7E\xA0-\xFF]/g, "")
}

// Recorta el texto con "…" para que quepa en el ancho de la columna.
function fit(text: string, font: PDFFont, size: number, maxW: number): string {
  const clean = sanitize(text)
  if (font.widthOfTextAtSize(clean, size) <= maxW) return clean
  let t = clean
  while (t.length > 1 && font.widthOfTextAtSize(t + "…", size) > maxW) {
    t = t.slice(0, -1)
  }
  return t + "…"
}

export async function GET(request: Request) {
  const session = await auth()
  const role = (session?.user as { role?: Role } | undefined)?.role
  if (!session || role !== "SUPER_ADMIN") {
    return new Response("No autorizado", { status: 403 })
  }

  const url = new URL(request.url)
  const fromStr = url.searchParams.get("from") ?? ""
  const toStr = url.searchParams.get("to") ?? ""
  if (!DATE_RE.test(fromStr) || !DATE_RE.test(toStr)) {
    return new Response("Rango de fechas inválido", { status: 400 })
  }

  // Costa Rica es UTC-6 y no usa horario de verano, así que el offset es fijo.
  const start = new Date(`${fromStr}T00:00:00-06:00`)
  const end = new Date(`${toStr}T23:59:59.999-06:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return new Response("Rango de fechas inválido", { status: 400 })
  }

  const rows = await prisma.auditLog.findMany({
    where: { createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  })

  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const pageW = 842
  const pageH = 595
  const margin = 36
  const ink = rgb(0.15, 0.12, 0.1)
  const gray = rgb(0.5, 0.5, 0.5)

  const cols = [
    { label: "Fecha", w: 115 },
    { label: "Responsable", w: 205 },
    { label: "Acción", w: 70 },
    { label: "Tipo", w: 95 },
    { label: "Elemento", w: pageW - 2 * margin - (115 + 205 + 70 + 95) },
  ]

  let page: PDFPage = pdf.addPage([pageW, pageH])
  let y = pageH - margin

  function drawHeaderRow() {
    let x = margin
    for (const c of cols) {
      page.drawText(c.label, { x, y, size: 9, font: bold, color: rgb(0.35, 0.35, 0.35) })
      x += c.w
    }
    y -= 5
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageW - margin, y },
      thickness: 0.5,
      color: rgb(0.8, 0.78, 0.74),
    })
    y -= 13
  }

  function newPage(withTitle: boolean) {
    page = pdf.addPage([pageW, pageH])
    y = pageH - margin - 6
    if (withTitle) {
      page.drawText("Bitácora de auditoría", { x: margin, y, size: 16, font: bold, color: ink })
      y -= 20
      const subtitle = `Del ${fromStr} al ${toStr}  ·  ${rows.length} acción(es)  ·  Generado ${fmtDateTime(new Date())}`
      page.drawText(sanitize(subtitle), { x: margin, y, size: 9, font, color: gray })
      y -= 22
    }
    drawHeaderRow()
  }

  // Primera página (reusa la ya creada).
  y = pageH - margin - 6
  page.drawText("Bitácora de auditoría", { x: margin, y, size: 16, font: bold, color: ink })
  y -= 20
  page.drawText(
    sanitize(`Del ${fromStr} al ${toStr}  ·  ${rows.length} acción(es)  ·  Generado ${fmtDateTime(new Date())}`),
    { x: margin, y, size: 9, font, color: gray }
  )
  y -= 22
  drawHeaderRow()

  if (rows.length === 0) {
    page.drawText("No hay acciones registradas en el rango seleccionado.", {
      x: margin,
      y,
      size: 10,
      font,
      color: gray,
    })
  }

  for (const r of rows) {
    if (y < margin + 16) newPage(false)

    const cells = [
      fmtDateTime(r.createdAt),
      `${r.actorEmail}  (${ROLE_LABELS[r.actorRole as keyof typeof ROLE_LABELS] ?? r.actorRole})`,
      ACTION_LABELS[r.action] ?? r.action,
      ENTITY_LABELS[r.entityType] ?? r.entityType,
      r.details ? `${r.entityLabel} — ${r.details}` : r.entityLabel,
    ]

    let x = margin
    for (let i = 0; i < cols.length; i++) {
      page.drawText(fit(cells[i], font, 8, cols[i].w - 6), { x, y, size: 8, font, color: ink })
      x += cols[i].w
    }
    y -= 14
  }

  const bytes = await pdf.save()
  const filename = `bitacora_${fromStr}_a_${toStr}.pdf`

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
