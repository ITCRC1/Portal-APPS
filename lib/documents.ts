import type { Prisma, Role } from "@prisma/client"
import { departmentScope, propertyWhere } from "@/lib/permissions"

/**
 * Filtro Prisma para listar solo los documentos que el usuario puede ver.
 * Se aplica dentro de la consulta (PRD 13) para no traer filas fuera de alcance.
 * Combina dos ejes con AND: departamento/confidencialidad y propiedad.
 *
 * - Roles corporativos: ven todos los documentos activos.
 * - Los demás: documentos "interno público" + los de su propio departamento,
 *   acotados además a su propiedad + lo corporativo (propertyId null).
 * - Sin departamento: solo los "interno público" de su propiedad/corporativos.
 */
export function visibleDocumentsWhere(
  role: Role,
  userDepartmentId: string | null,
  userPropertyId: string | null
): Prisma.DocumentWhereInput {
  const scope = departmentScope(role, userDepartmentId)
  const clauses: Prisma.DocumentWhereInput[] = [{ status: "active" }]

  if (scope.kind !== "all") {
    const or: Prisma.DocumentWhereInput[] = [{ confidentiality: "public-internal" }]
    if (scope.kind === "department") {
      or.push({ confidentiality: "department", departmentId: scope.departmentId })
    }
    clauses.push({ OR: or })
  }

  const prop = propertyWhere(role, userPropertyId)
  if ("OR" in prop) clauses.push(prop as Prisma.DocumentWhereInput)

  return clauses.length === 1 ? clauses[0] : { AND: clauses }
}
