import { test, expect } from "@playwright/test"
import { readSeed, loginAs, type Seed } from "./helpers"

let seed: Seed
test.beforeAll(() => {
  seed = readSeed()
})

test.describe("Tareas: aislamiento por departamento y permisos de edición", () => {
  test("Finanzas ve su tarea y la general, no la de Operaciones", async ({ page }) => {
    await loginAs(page, seed.users.finance.email, seed.password)
    await page.goto("/tasks")
    await expect(page.getByText(seed.tasks.finance.title)).toBeVisible()
    await expect(page.getByText(seed.tasks.general.title)).toBeVisible()
    await expect(page.getByText(seed.tasks.operations.title)).toHaveCount(0)
  })

  test("Operaciones ve su tarea y la general, no la de Finanzas", async ({ page }) => {
    await loginAs(page, seed.users.operations.email, seed.password)
    await page.goto("/tasks")
    await expect(page.getByText(seed.tasks.operations.title)).toBeVisible()
    await expect(page.getByText(seed.tasks.general.title)).toBeVisible()
    await expect(page.getByText(seed.tasks.finance.title)).toHaveCount(0)
  })

  test("Finanzas puede modificar su tarea pero no la general", async ({ page }) => {
    await loginAs(page, seed.users.finance.email, seed.password)
    await page.goto("/tasks")

    const own = page.locator(`[data-testid="task-card-${seed.tasks.finance.id}"]`)
    await expect(own).toHaveAttribute("data-can-modify", "true")
    await expect(own.getByRole("button", { name: "Eliminar" })).toHaveCount(1)

    const general = page.locator(`[data-testid="task-card-${seed.tasks.general.id}"]`)
    await expect(general).toHaveAttribute("data-can-modify", "false")
    await expect(general.getByRole("button")).toHaveCount(0)
  })

  test("Ejecutivo puede modificar la tarea general", async ({ page }) => {
    await loginAs(page, seed.users.exec.email, seed.password)
    await page.goto("/tasks")
    const general = page.locator(`[data-testid="task-card-${seed.tasks.general.id}"]`)
    await expect(general).toHaveAttribute("data-can-modify", "true")
  })
})
