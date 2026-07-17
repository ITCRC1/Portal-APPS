import { test, expect } from "@playwright/test"
import { readSeed, loginAs, type Seed } from "./helpers"

let seed: Seed
test.beforeAll(() => {
  seed = readSeed()
})

test.describe("Avisos: alcance de lectura y permiso de publicación", () => {
  test("Finanzas ve el general y el de su depto; no otros, ni vencidos/archivados", async ({ page }) => {
    await loginAs(page, seed.users.finance.email, seed.password)
    await page.goto("/alerts")
    await expect(page.getByText(seed.announcements.general.title)).toBeVisible()
    await expect(page.getByText(seed.announcements.finance.title)).toBeVisible()
    await expect(page.getByText(seed.announcements.operations.title)).toHaveCount(0)
    await expect(page.getByText(seed.announcements.expired.title)).toHaveCount(0)
    await expect(page.getByText(seed.announcements.archived.title)).toHaveCount(0)
  })

  test("Operaciones no ve el aviso de Finanzas", async ({ page }) => {
    await loginAs(page, seed.users.operations.email, seed.password)
    await page.goto("/alerts")
    await expect(page.getByText(seed.announcements.general.title)).toBeVisible()
    await expect(page.getByText(seed.announcements.finance.title)).toHaveCount(0)
  })

  test("Un lector no ve el formulario de publicar ni controles de gestión", async ({ page }) => {
    await loginAs(page, seed.users.finance.email, seed.password)
    await page.goto("/alerts")
    await expect(page.getByRole("button", { name: "Publicar aviso" })).toHaveCount(0)
    const genCard = page.locator(`[data-testid="announcement-card-${seed.announcements.general.id}"]`)
    await expect(genCard).toHaveAttribute("data-can-manage", "false")
    await expect(genCard.getByRole("button")).toHaveCount(0)
  })

  test("Un rol corporativo sí puede publicar y gestionar", async ({ page }) => {
    await loginAs(page, seed.users.exec.email, seed.password)
    await page.goto("/alerts")
    await expect(page.getByRole("button", { name: "Publicar aviso" })).toBeVisible()
    const genCard = page.locator(`[data-testid="announcement-card-${seed.announcements.general.id}"]`)
    await expect(genCard).toHaveAttribute("data-can-manage", "true")
  })
})
