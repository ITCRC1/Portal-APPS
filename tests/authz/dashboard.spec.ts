import { test, expect } from "@playwright/test"
import { readSeed, loginAs, type Seed } from "./helpers"

let seed: Seed
test.beforeAll(() => {
  seed = readSeed()
})

test.describe("Dashboard: KPIs y actividad con alcance por rol", () => {
  test("Finanzas no ve KPIs corporativos y su lista muestra solo sus tareas", async ({ page }) => {
    await loginAs(page, seed.users.finance.email, seed.password)
    await page.goto("/dashboard")

    await expect(page.getByText("Usuarios activos")).toHaveCount(0)

    const mis = page.locator("section", { hasText: "Mis tareas" })
    await expect(mis.getByText(seed.tasks.finance.title)).toBeVisible()
    // La tarea de Operaciones no está asignada a Finanzas: no debe aparecer.
    await expect(mis.getByText(seed.tasks.operations.title)).toHaveCount(0)
  })

  test("SUPER_ADMIN ve los KPIs corporativos", async ({ page }) => {
    await loginAs(page, seed.users.admin.email, seed.password)
    await page.goto("/dashboard")
    await expect(page.getByText("Usuarios activos")).toBeVisible()
    await expect(page.locator('a[href="/departments"]').filter({ hasText: /\d/ })).toBeVisible()
  })
})
