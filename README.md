# Portal Interno · The Costa Rica Collection

Intranet corporativa (documentos, tareas, avisos, departamentos, notificaciones y
bitácora de auditoría) con control de acceso por rol y aislamiento por departamento.

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **Auth.js / NextAuth v5** — credenciales (usuario y contraseña), sesión JWT, hash con argon2
- **Prisma + PostgreSQL** (Railway)

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
```

Variables de entorno en `.env` (no se versiona): `DATABASE_URL`, `AUTH_SECRET`.

## Base de datos

```bash
npx prisma migrate dev     # aplica migraciones y regenera el cliente
```

## Pruebas de autorización

```bash
npm run test:authz         # Playwright: verifica el aislamiento por rol/departamento
```

## Seguridad (resumen)

- La autorización se valida **en el servidor** en cada ruta, acción y consulta; nunca solo en la UI.
- Las consultas por departamento filtran por `departmentId` dentro de la propia consulta.
- Los documentos internos viven en la base de datos (columna `Bytes`), nunca en el repo.
- Los secretos son solo del servidor; nunca se exponen con `NEXT_PUBLIC`.
