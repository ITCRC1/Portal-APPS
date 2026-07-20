import { promises as dns } from "node:dns"

// Formato razonable: algo@dominio.tld
const EMAIL_RE = /^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]{2,}$/

/**
 * Devuelve un mensaje de error si el correo no sirve, o null si es válido.
 * Además del formato, comprueba que el dominio tenga servidores de correo (registros
 * MX) vía DNS: así se rechazan dominios inexistentes o que no reciben correo, como
 * "example.com". No verifica que el buzón exacto exista (eso solo se sabría enviando
 * un correo), pero descarta los dominios falsos.
 */
export async function emailProblem(email: string): Promise<string | null> {
  const value = email.trim().toLowerCase()

  if (!EMAIL_RE.test(value)) {
    return "El correo no tiene un formato válido"
  }

  const domain = value.split("@")[1]
  let mx: { exchange: string; priority: number }[] = []
  try {
    mx = await dns.resolveMx(domain)
  } catch {
    mx = []
  }

  // Descarta el "null MX" (RFC 7505): un MX vacío o "." significa explícitamente que
  // el dominio NO recibe correo (es el caso de example.com).
  const usable = mx.filter((r) => r.exchange && r.exchange !== ".")
  if (usable.length === 0) {
    return `El dominio "${domain}" no existe o no puede recibir correo`
  }

  return null
}
