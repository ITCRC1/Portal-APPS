// Lista blanca de redirección para el flujo SSO. Solo se permite volver a la propia
// intranet o a otra app del dominio corporativo; así el parámetro ?next= no puede
// usarse para un "open redirect" hacia un sitio externo.
//
// Sin dependencias de Node: lo usan tanto el servidor (middleware, rutas) como el
// cliente (página de login).
const ROOT_DOMAIN = "thecostaricacollection.com"

export function safeNext(next: string | null | undefined): string | null {
  if (!next) return null

  // Ruta relativa interna ("/algo"), nunca "//host" ni "/\host".
  if (/^\/(?![/\\])/.test(next)) return next

  try {
    const u = new URL(next)
    if (u.protocol !== "https:" && u.protocol !== "http:") return null
    const host = u.hostname.toLowerCase()
    if (host === ROOT_DOMAIN || host.endsWith("." + ROOT_DOMAIN)) {
      return u.toString()
    }
    return null
  } catch {
    return null
  }
}
