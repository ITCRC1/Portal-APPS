import { Role } from "@prisma/client"

export type ModuleKey =
  | "dashboard"
  | "departments"
  | "documents"
  | "system-links"
  | "alerts"
  | "tasks"
  | "admin"

export const MODULES: { key: ModuleKey; href: string; label: string }[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard" },
  { key: "departments", href: "/departments", label: "Departamentos" },
  { key: "documents", href: "/documents", label: "Documentos" },
  { key: "system-links", href: "/system-links", label: "Enlaces del Sistema" },
  { key: "alerts", href: "/alerts", label: "Alertas" },
  { key: "tasks", href: "/tasks", label: "Tareas" },
  { key: "admin", href: "/admin", label: "Administración" },
]

// Módulos de solo consulta general (PRD 13: "Read Only User can only view approved general content").
const BASE_MODULES: ModuleKey[] = ["dashboard", "departments", "documents", "system-links"]
// Módulos operativos: además de consultar, coordinan alertas y tareas del día a día.
const OPERATIONAL_MODULES: ModuleKey[] = [...BASE_MODULES, "alerts", "tasks"]

const ACCESS: Record<Role, ModuleKey[]> = {
  SUPER_ADMIN: [...OPERATIONAL_MODULES, "admin"],
  EXECUTIVE: OPERATIONAL_MODULES,
  DEPARTMENT_MANAGER: OPERATIONAL_MODULES,
  FINANCE_USER: OPERATIONAL_MODULES,
  OPERATIONS_USER: OPERATIONAL_MODULES,
  SALES_USER: OPERATIONAL_MODULES,
  HR_USER: OPERATIONAL_MODULES,
  PROCUREMENT_USER: OPERATIONAL_MODULES,
  MAINTENANCE_USER: OPERATIONAL_MODULES,
  LEGAL_USER: OPERATIONAL_MODULES,
  IT_USER: OPERATIONAL_MODULES,
  READ_ONLY_USER: BASE_MODULES,
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Administrador",
  EXECUTIVE: "Ejecutivo",
  DEPARTMENT_MANAGER: "Gerente de Departamento",
  FINANCE_USER: "Finanzas",
  OPERATIONS_USER: "Operaciones",
  SALES_USER: "Ventas y Mercadeo",
  HR_USER: "Recursos Humanos",
  PROCUREMENT_USER: "Procura",
  MAINTENANCE_USER: "Mantenimiento / CAPEX",
  LEGAL_USER: "Legal / Administración",
  IT_USER: "TI / Sistemas",
  READ_ONLY_USER: "Solo Lectura",
}

export function getAccessibleModules(role: Role): ModuleKey[] {
  return ACCESS[role] ?? BASE_MODULES
}

export function canAccessModule(role: Role, moduleKey: ModuleKey): boolean {
  return getAccessibleModules(role).includes(moduleKey)
}

// ---------- Alcance por departamento (PRD 13) ----------

// Roles con visión corporativa: ven el contenido de todos los departamentos.
export function canViewAllDepartments(role: Role): boolean {
  return role === "SUPER_ADMIN" || role === "EXECUTIVE"
}

/**
 * Alcance departamental del usuario, usado para filtrar dentro de la consulta
 * misma (PRD 13), de modo que nadie reciba filas fuera de su ámbito.
 *
 * Los tres casos son explícitos a propósito: un solo `null` para "ve todo" y
 * "no tiene departamento" haría que omitir el filtro le mostrara todo a quien
 * no debe ver nada.
 */
export type DepartmentScope =
  | { kind: "all" }
  | { kind: "department"; departmentId: string }
  | { kind: "none" }

export function departmentScope(role: Role, userDepartmentId: string | null): DepartmentScope {
  if (canViewAllDepartments(role)) return { kind: "all" }
  if (userDepartmentId) return { kind: "department", departmentId: userDepartmentId }
  return { kind: "none" }
}

// Un usuario sin departamento asignado (y sin visión corporativa) no tiene contenido departamental.
export function canAccessDepartment(
  role: Role,
  userDepartmentId: string | null,
  targetDepartmentId: string
): boolean {
  if (canViewAllDepartments(role)) return true
  return userDepartmentId === targetDepartmentId
}
