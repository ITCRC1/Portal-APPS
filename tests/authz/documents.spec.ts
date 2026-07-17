import { test, expect } from "@playwright/test"
import { readSeed, loginAs, type Seed } from "./helpers"

let seed: Seed
test.beforeAll(() => {
  seed = readSeed()
})

const dl = (id: string) => `/documents/${id}/download`

test.describe("Documentos: visibilidad y descarga por confidencialidad", () => {
  test("Finanzas ve el público y el de su depto, no el ejecutivo", async ({ page }) => {
    await loginAs(page, seed.users.finance.email, seed.password)
    await page.goto("/documents")
    await expect(page.getByText(seed.documents.public.name)).toBeVisible()
    await expect(page.getByText(seed.documents.finance.name)).toBeVisible()
    await expect(page.getByText(seed.documents.executive.name)).toHaveCount(0)
  })

  test("Operaciones ve solo el interno-público (no el de Finanzas ni el ejecutivo)", async ({ page }) => {
    await loginAs(page, seed.users.operations.email, seed.password)
    await page.goto("/documents")
    await expect(page.getByText(seed.documents.public.name)).toBeVisible()
    await expect(page.getByText(seed.documents.finance.name)).toHaveCount(0)
    await expect(page.getByText(seed.documents.executive.name)).toHaveCount(0)
  })

  test("Finanzas descarga su depto (200) pero NO el ejecutivo (403)", async ({ page }) => {
    await loginAs(page, seed.users.finance.email, seed.password)
    expect((await page.request.get(dl(seed.documents.finance.id))).status()).toBe(200)
    expect((await page.request.get(dl(seed.documents.executive.id))).status()).toBe(403)
  })

  test("Operaciones NO descarga el documento de Finanzas (403)", async ({ page }) => {
    await loginAs(page, seed.users.operations.email, seed.password)
    expect((await page.request.get(dl(seed.documents.finance.id))).status()).toBe(403)
  })

  test("Ejecutivo descarga el documento ejecutivo (200)", async ({ page }) => {
    await loginAs(page, seed.users.exec.email, seed.password)
    expect((await page.request.get(dl(seed.documents.executive.id))).status()).toBe(200)
  })

  test("Anónimo no obtiene el archivo: lo corta el proxy hacia /login", async ({ request }) => {
    const res = await request.get(dl(seed.documents.public.id), { maxRedirects: 0 })
    expect([302, 307, 401]).toContain(res.status())
    // Nunca debe entregar el binario del documento.
    expect(res.headers()["content-type"] ?? "").not.toContain("application/pdf")
  })
})
