import fs from "node:fs"
import path from "node:path"
import type { Page } from "@playwright/test"
import { PrismaClient } from "@prisma/client"

// Prisma no carga .env en tiempo de ejecución (solo lo hace su CLI). Las pruebas
// siembran datos directamente con Prisma, así que cargamos DATABASE_URL a mano.
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env")
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/)
    if (!m) continue
    const key = m[1]
    let val = m[2]
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}
loadEnv()

export const prisma = new PrismaClient()

export const SEED_FILE = path.join(process.cwd(), "tests", "authz", ".authz-seed.json")

type NamedRef = { id: string; title: string }
type DocRef = { id: string; name: string }
type UserRef = { id: string; email: string }

export type Seed = {
  runId: string
  password: string
  users: {
    admin: UserRef
    exec: UserRef
    finance: UserRef
    operations: UserRef
    readonly: UserRef
  }
  departments: { finance: string; operations: string }
  documents: { public: DocRef; finance: DocRef; executive: DocRef }
  tasks: { finance: NamedRef; operations: NamedRef; general: NamedRef }
  announcements: {
    general: NamedRef
    finance: NamedRef
    operations: NamedRef
    expired: NamedRef
    archived: NamedRef
  }
}

export function readSeed(): Seed {
  return JSON.parse(fs.readFileSync(SEED_FILE, "utf8")) as Seed
}

// Inicia sesión por la interfaz real (Credentials) y espera a llegar al dashboard.
export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login")
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button:has-text("Ingresar")')
  await page.waitForURL("**/dashboard")
}
