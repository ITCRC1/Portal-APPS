import { test, expect } from "@playwright/test"
import { readSeed, loginAs, type Seed } from "./helpers"

let seed: Seed
test.beforeAll(() => {
  seed = readSeed()
})

test.describe("Guardas de ruta y acceso a módulos", () => {
  test("sin sesión, cualquier ruta protegida redirige a /login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/)
  })

  test("READ_ONLY no accede a Tareas, Alertas ni Administración", async ({ page }) => {
    await loginAs(page, seed.users.readonly.email, seed.password)
    for (const path of ["/tasks", "/alerts", "/admin"]) {
      await page.goto(path)
      await expect(page, `debería salir de ${path}`).toHaveURL(/\/dashboard/)
    }
  })

  test("usuario de departamento no accede a Administración", async ({ page }) => {
    await loginAs(page, seed.users.finance.email, seed.password)
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test("SUPER_ADMIN sí accede a Administración", async ({ page }) => {
    await loginAs(page, seed.users.admin.email, seed.password)
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/admin/)
  })

  test("Finanzas no puede abrir el departamento de Operaciones", async ({ page }) => {
    await loginAs(page, seed.users.finance.email, seed.password)
    await page.goto("/departments/operations")
    await expect(page).toHaveURL(/\/departments$/)
  })

  test("Finanzas sí abre su propio departamento", async ({ page }) => {
    await loginAs(page, seed.users.finance.email, seed.password)
    await page.goto("/departments/finance")
    await expect(page).toHaveURL(/\/departments\/finance/)
  })

  test("Ejecutivo abre cualquier departamento", async ({ page }) => {
    await loginAs(page, seed.users.exec.email, seed.password)
    await page.goto("/departments/operations")
    await expect(page).toHaveURL(/\/departments\/operations/)
  })
})
