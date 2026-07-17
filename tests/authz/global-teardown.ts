import fs from "node:fs"
import { prisma, SEED_FILE, readSeed } from "./helpers"

// Borra todo lo sembrado por global-setup. Filtra por el runId único, de modo que
// nunca toca datos reales aunque compartan la misma base.
export default async function globalTeardown(): Promise<void> {
  if (!fs.existsSync(SEED_FILE)) return
  const { runId } = readSeed()

  await prisma.task.deleteMany({ where: { title: { contains: runId } } })
  await prisma.announcement.deleteMany({ where: { title: { contains: runId } } })
  await prisma.document.deleteMany({ where: { name: { contains: runId } } })
  await prisma.user.deleteMany({ where: { email: { endsWith: `${runId}.invalid` } } })

  await prisma.$disconnect()
  fs.rmSync(SEED_FILE, { force: true })
  console.log(`[authz] datos de prueba eliminados (runId=${runId})`)
}
