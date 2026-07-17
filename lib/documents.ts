import type { Prisma, Role } from "@prisma/client"
import { departmentScope } from "@/lib/permissions"

/**
 * Filtro Prisma para listar solo los documentos que el usuario puede ver.
 * Se aplica dentro de la consulta (PRD 13) para no traer filas fuera de alcance.
 *
 * - Roles corporativos: ven todos los documentos activos.
 * - Los demás: documentos "interno público" + los de su propio departamento.
 * - Sin departamento: solo los "interno público".
 */
export function visibleDocumentsWhere(
  role: Role,
  userDepartmentId: string | null
): Prisma.DocumentWhereInput {
  const scope = departmentScope(role, userDepartmentId)

  if (scope.kind === "all") {
    return { status: "active" }
  }

  const or: Prisma.DocumentWhereInput[] = [{ confidentiality: "public-internal" }]
  if (scope.kind === "department") {
    or.push({ confidentiality: "department", departmentId: scope.departmentId })
  }

  return { status: "active", OR: or }
}
