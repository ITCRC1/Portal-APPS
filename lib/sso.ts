import crypto from "node:crypto"

/**
 * SSO del portal (proveedor de identidad para las demás apps del dominio).
 *
 * El portal emite un JWT estándar HS256 en la cookie `crc_sso`, sobre el dominio
 * raíz (`.thecostaricacollection.com`), para que cualquier app del dominio pueda
 * verificarlo con el mismo secreto (SSO_SECRET) y saber quién es el usuario.
 *
 * Se firma a mano con crypto de Node (sin dependencias): así el token es un JWT
 * normal que cualquier lenguaje verifica (en Python basta hmac/hashlib de la
 * librería estándar). NO se reutiliza el secreto de Auth.js: es un secreto aparte.
 */

export const SSO_COOKIE = "crc_sso"

// Vida corta a propósito: el guardia de cada app revalida en cada request, así que
// desactivar a alguien en el portal lo saca de todas las apps en pocos minutos.
export const SSO_TTL_SECONDS = 30 * 60

export type SsoClaims = { sub: string; email: string; role: string }
type SsoPayload = SsoClaims & { iat: number; exp: number }

function secret(): string {
  const s = process.env.SSO_SECRET
  if (!s || s.length < 16) {
    throw new Error("Falta SSO_SECRET (secreto de al menos 16 caracteres) para el SSO.")
  }
  return s
}

const b64url = (buf: Buffer) => buf.toString("base64url")

export function signSsoToken(claims: SsoClaims, ttlSeconds = SSO_TTL_SECONDS): string {
  const header = { alg: "HS256", typ: "JWT" }
  const now = Math.floor(Date.now() / 1000)
  const payload: SsoPayload = { ...claims, iat: now, exp: now + ttlSeconds }
  const h = b64url(Buffer.from(JSON.stringify(header)))
  const p = b64url(Buffer.from(JSON.stringify(payload)))
  const data = `${h}.${p}`
  const sig = b64url(crypto.createHmac("sha256", secret()).update(data).digest())
  return `${data}.${sig}`
}

export function verifySsoToken(token: string | undefined | null): SsoPayload | null {
  if (!token) return null
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [h, p, sig] = parts

  const expected = b64url(crypto.createHmac("sha256", secret()).update(`${h}.${p}`).digest())
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(Buffer.from(p, "base64url").toString()) as SsoPayload
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

// Opciones de la cookie SSO. El dominio se toma de env: en producción se pone
// `.thecostaricacollection.com` para compartirla entre subdominios; en local se deja
// vacío (cookie del propio host) para poder probar.
export function ssoCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    domain: process.env.SSO_COOKIE_DOMAIN || undefined,
    maxAge: SSO_TTL_SECONDS,
  }
}
