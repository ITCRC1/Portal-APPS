import fs from "node:fs"
import argon2 from "argon2"
import type { Role } from "@prisma/client"
import { prisma, SEED_FILE, type Seed } from "./helpers"

// Siembra un conjunto fijo de usuarios y contenido de prueba (con un runId único y
// dominio de correo desechable) contra la base configurada en DATABASE_URL. Todo se
// borra en global-teardown. No se toca ningún usuario/real: solo filas con el runId.
export default async function globalSetup(): Promise<void> {
  const runId = `authz-${Date.now()}`
  const password = `Authz!${Date.now()}`
  const passwordHash = await argon2.hash(password)
  const domain = `${runId}.invalid`

  const finance = await prisma.department.findUniqueOrThrow({ where: { slug: "finance" } })
  const operations = await prisma.department.findUniqueOrThrow({ where: { slug: "operations" } })

  async function mkUser(key: string, role: Role, departmentId: string | null) {
    const u = await prisma.user.create({
      data: { fullName: `AUTHZ ${key}`, email: `${key}@${domain}`, passwordHash, role, departmentId },
    })
    return { id: u.id, email: u.email }
  }

  const users = {
    admin: await mkUser("admin", "SUPER_ADMIN", null),
    exec: await mkUser("exec", "EXECUTIVE", null),
    finance: await mkUser("finance", "FINANCE_USER", finance.id),
    operations: await mkUser("operations", "OPERATIONS_USER", operations.id),
    readonly: await mkUser("readonly", "READ_ONLY_USER", null),
  }

  const smallPdf = Buffer.from("%PDF-1.4\nauthz-test\n%%EOF\n")
  async function mkDoc(key: string, confidentiality: string, departmentId: string | null) {
    const name = `AUTHZ doc ${key} ${runId}`
    const d = await prisma.document.create({
      data: {
        name,
        category: "Otro",
        fileName: `${key}.pdf`,
        mimeType: "application/pdf",
        size: smallPdf.length,
        content: smallPdf,
        confidentiality,
        status: "active",
        departmentId,
        uploadedById: users.admin.id,
      },
    })
    return { id: d.id, name }
  }

  const documents = {
    public: await mkDoc("public", "public-internal", finance.id),
    finance: await mkDoc("finance", "department", finance.id),
    executive: await mkDoc("executive", "executive", finance.id),
  }

  async function mkTask(key: string, departmentId: string | null, assignedToId: string | null) {
    const title = `AUTHZ task ${key} ${runId}`
    const t = await prisma.task.create({
      data: { title, status: "todo", priority: "medium", departmentId, assignedToId, createdById: users.admin.id },
    })
    return { id: t.id, title }
  }

  const tasks = {
    finance: await mkTask("finance", finance.id, users.finance.id),
    operations: await mkTask("operations", operations.id, users.operations.id),
    general: await mkTask("general", null, null),
  }

  async function mkAnn(
    key: string,
    departmentId: string | null,
    extra: { status?: string; expiresAt?: Date } = {}
  ) {
    const title = `AUTHZ ann ${key} ${runId}`
    const a = await prisma.announcement.create({
      data: {
        title,
        body: "authz test",
        level: "info",
        status: extra.status ?? "active",
        expiresAt: extra.expiresAt ?? null,
        departmentId,
        publishedById: users.admin.id,
      },
    })
    return { id: a.id, title }
  }

  const announcements = {
    general: await mkAnn("general", null),
    finance: await mkAnn("finance", finance.id),
    operations: await mkAnn("operations", operations.id),
    expired: await mkAnn("expired", null, { expiresAt: new Date(Date.now() - 86_400_000) }),
    archived: await mkAnn("archived", null, { status: "archived" }),
  }

  const seed: Seed = {
    runId,
    password,
    users,
    departments: { finance: finance.id, operations: operations.id },
    documents,
    tasks,
    announcements,
  }

  fs.writeFileSync(SEED_FILE, JSON.stringify(seed, null, 2))
  await prisma.$disconnect()
  console.log(`[authz] datos sembrados (runId=${runId})`)
}
