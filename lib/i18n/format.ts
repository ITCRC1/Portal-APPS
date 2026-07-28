// Utilidad de formato compartida por servidor y cliente. NO lleva "use client":
// los Server Components la llaman directamente (una función exportada desde un
// módulo "use client" no se puede invocar en el servidor).

// Reemplaza {n} en una plantilla (p. ej. "hace {n} min").
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? `{${k}}`))
}
