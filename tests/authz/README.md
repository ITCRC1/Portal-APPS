# Pruebas de autorización (RBAC + aislamiento por departamento)

Suite end-to-end con Playwright que fija las reglas de seguridad de la aplicación,
para que un cambio futuro no rompa los permisos sin que nos demos cuenta.

## Cómo correrla

```bash
npm run test:authz
```

Playwright levanta el servidor Next automáticamente (`npm run dev`) y lo apaga al
terminar. Si ya tienes uno corriendo en `localhost:3000`, lo reutiliza.

## Qué cubre

- **Guardas de ruta / módulos** (`modules.spec.ts`): sin sesión todo redirige a
  `/login`; `READ_ONLY` no entra a Tareas/Alertas/Administración; solo `SUPER_ADMIN`
  entra a `/admin`; un usuario no abre el departamento de otra área por URL.
- **Documentos** (`documents.spec.ts`): visibilidad por confidencialidad y, sobre
  todo, la **descarga** (`/documents/[id]/download`): 200 permitido, 403 fuera de
  alcance, y anónimo cortado por el proxy hacia `/login` (nunca entrega el binario).
- **Tareas** (`tasks.spec.ts`): aislamiento por departamento y quién puede editar
  (las tareas generales solo las modifican los roles corporativos).
- **Avisos** (`announcements.spec.ts`): alcance de lectura (general + propio depto,
  nada de otros, ni vencidos/archivados) y que solo los roles corporativos publican.
- **Dashboard** (`dashboard.spec.ts`): KPIs corporativos solo para roles corporativos
  y "Mis tareas" limitado a lo asignado a cada usuario.

## Modelo de seguridad de los datos de prueba

`global-setup.ts` siembra usuarios y contenido con un `runId` único (correos
`*@authz-<timestamp>.invalid`, títulos con el `runId`) **contra la base de
`DATABASE_URL`**. `global-teardown.ts` borra todo filtrando por ese `runId`, de modo
que nunca toca datos reales aunque se comparta la misma base. No usa el usuario
administrador real ni su contraseña. El archivo temporal `.authz-seed.json` está
ignorado por git.
