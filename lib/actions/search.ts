"use server"

import type { Role } from "@prisma/client"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  canAccessModule,
  canViewAllDepartments,
  departmentScope,
  ROLE_LABELS,
} from "@/lib/permissions"
import { visibleTasksWhere, STATUS_LABELS } from "@/lib/tasks"
import { visibleAnnouncementsWhere, LEVEL_LABELS } from "@/lib/announcements"
import { visibleDocumentsWhere } from "@/lib/documents"

export type SearchType = "task" | "announcement" | "document" | "department" | "person"

export type SearchHit = {
  type: SearchType
  id: string
  title: string
  subtitle: string
  href: string
}

// Cuántos resultados por tipo. El buscador es un acceso rápido, no un listado.
const MAX_PER_TYPE = 5

/**
 * Buscador global. Se ejecuta siempre en el servidor y respeta el mismo
 * aislamiento que el resto del portal (PRD 13):
 *  - re-valida al usuario contra la base (un desactivado no busca nada) y usa
 *    su rol/departamento reales, no los del token;
 *  - cada tipo de resultado se filtra con su propio `visible*Where`/scope, así
 *    que nadie recibe filas fuera de su alcance;
 *  - si el rol no puede entrar a un módulo, ese tipo ni se consulta.
 */
export async function searchAll(rawQuery: string): Promise<SearchHit[]> {
  const session = await auth()
  const id = (session?.user as { id?: string } | undefined)?.id
  if (!session || !id) return []

  const q = rawQuery.trim()
  if (q.length < 2) return []

  const dbUser = await prisma.user.findUnique({
    where: { id },
    select: { isActive: true, role: true, departmentId: true },
  })
  if (!dbUser || !dbUser.isActive) return []

  const role = dbUser.role as Role
  const deptId = dbUser.departmentId
  const contains = { contains: q, mode: "insensitive" as const }

  const jobs: Promise<SearchHit[]>[] = []

  if (canAccessModule(role, "tasks")) {
    jobs.push(
      prisma.task
        .findMany({
          where: {
            AND: [
              visibleTasksWhere(role, deptId),
              { OR: [{ title: contains }, { description: contains }] },
            ],
          },
          orderBy: { updatedAt: "desc" },
          take: MAX_PER_TYPE,
          select: { id: true, title: true, status: true },
        })
        .then((rows) =>
          rows.map((t) => ({
            type: "task" as const,
            id: t.id,
            title: t.title,
            subtitle: STATUS_LABELS[t.status] ?? "Tarea",
            href: "/tasks",
          }))
        )
    )
  }

  if (canAccessModule(role, "alerts")) {
    jobs.push(
      prisma.announcement
        .findMany({
          where: {
            AND: [
              visibleAnnouncementsWhere(role, deptId),
              { OR: [{ title: contains }, { body: contains }] },
            ],
          },
          orderBy: { publishedAt: "desc" },
          take: MAX_PER_TYPE,
          select: { id: true, title: true, level: true },
        })
        .then((rows) =>
          rows.map((a) => ({
            type: "announcement" as const,
            id: a.id,
            title: a.title,
            subtitle: LEVEL_LABELS[a.level] ?? "Aviso",
            href: "/alerts",
          }))
        )
    )
  }

  if (canAccessModule(role, "documents")) {
    jobs.push(
      prisma.document
        .findMany({
          where: {
            AND: [
              visibleDocumentsWhere(role, deptId),
              {
                OR: [{ name: contains }, { description: contains }, { fileName: contains }],
              },
            ],
          },
          orderBy: { updatedAt: "desc" },
          take: MAX_PER_TYPE,
          select: { id: true, name: true, category: true },
        })
        .then((rows) =>
          rows.map((d) => ({
            type: "document" as const,
            id: d.id,
            title: d.name,
            subtitle: d.category,
            href: "/documents",
          }))
        )
    )
  }

  if (canAccessModule(role, "departments")) {
    const scope = departmentScope(role, deptId)
    if (scope.kind !== "none") {
      jobs.push(
        prisma.department
          .findMany({
            where: {
              status: "active",
              ...(scope.kind === "department" ? { id: scope.departmentId } : {}),
              OR: [{ name: contains }, { description: contains }],
            },
            orderBy: { order: "asc" },
            take: MAX_PER_TYPE,
            select: { id: true, name: true, slug: true },
          })
          .then((rows) =>
            rows.map((d) => ({
              type: "department" as const,
              id: d.id,
              title: d.name,
              subtitle: "Departamento",
              href: `/departments/${d.slug}`,
            }))
          )
      )
    }
  }

  // Personas: solo para roles con visión corporativa (Super Admin / Ejecutivo).
  // Los demás no ven un directorio del personal. El enlace lleva al panel de
  // usuarios únicamente si el rol puede entrar a Administración.
  if (canViewAllDepartments(role)) {
    const peopleHref = canAccessModule(role, "admin") ? "/admin/users" : "/dashboard"
    jobs.push(
      prisma.user
        .findMany({
          where: {
            isActive: true,
            OR: [{ fullName: contains }, { email: contains }],
          },
          orderBy: { fullName: "asc" },
          take: MAX_PER_TYPE,
          select: {
            id: true,
            fullName: true,
            role: true,
            department: { select: { name: true } },
          },
        })
        .then((rows) =>
          rows.map((u) => ({
            type: "person" as const,
            id: u.id,
            title: u.fullName,
            subtitle: `${ROLE_LABELS[u.role]}${u.department ? " · " + u.department.name : ""}`,
            href: peopleHref,
          }))
        )
    )
  }

  const settled = await Promise.all(jobs)
  return settled.flat()
}
