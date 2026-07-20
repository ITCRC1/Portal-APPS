import { prisma } from "@/lib/prisma"
import { requireModuleAccess } from "@/lib/require-module-access"

export const dynamic = "force-dynamic"

export default async function HealthPage() {
  // Diagnóstico reservado a administradores; ya no escribe en la base en cada visita.
  await requireModuleAccess("admin")

  const checks = await prisma.healthCheck.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Estado de la conexión</h1>
      <p>Si ves registros abajo, Next.js está hablando con Postgres en Railway.</p>
      <ul>
        {checks.map((c) => (
          <li key={c.id}>
            {c.label} — {c.createdAt.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  )
}
