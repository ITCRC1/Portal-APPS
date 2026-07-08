import { prisma } from '@/lib/prisma'
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from 'react'

export const dynamic = 'force-dynamic'

export default async function HealthPage() {
  // Crea un registro de prueba cada vez que se visita (solo para probar el circuito)
  await prisma.healthCheck.create({
    data: { label: 'Ping desde la pagina /health' },
  })

  const checks = await prisma.healthCheck.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Estado de la conexión</h1>
      <p>Si ves registros abajo, Next.js está hablando con Postgres en Railway.</p>
      <ul>
        {checks.map((c: { id: Key | null | undefined; label: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; createdAt: { toLocaleString: () => string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined } }) => (
          <li key={c.id}>
            {c.label} — {c.createdAt.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  )
}
