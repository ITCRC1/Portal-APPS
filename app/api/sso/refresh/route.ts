import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { SSO_COOKIE, signSsoToken, ssoCookieOptions } from "@/lib/sso"
import { safeNext } from "@/lib/safe-redirect"

/**
 * Renueva la cookie SSO y devuelve al usuario a `next`. Lo usan las otras apps cuando
 * detectan que la cookie venció: redirigen aquí, y si la sesión del portal sigue
 * viva se re-emite la cookie y se vuelve a la app; si no, se manda al login.
 *
 * Se re-valida contra la base (igual que el portal): un usuario desactivado no obtiene
 * cookie nueva, así que queda fuera de todas las apps.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const next = safeNext(url.searchParams.get("next"))

  const session = await auth()
  const id = (session?.user as { id?: string } | undefined)?.id

  const gotoLogin = () => {
    const login = new URL("/login", url.origin)
    if (next) login.searchParams.set("next", next)
    return NextResponse.redirect(login)
  }

  if (!session || !id) return gotoLogin()

  const dbUser = await prisma.user.findUnique({
    where: { id },
    select: { isActive: true, email: true, role: true },
  })
  if (!dbUser || !dbUser.isActive) return gotoLogin()

  const res = NextResponse.redirect(next ?? new URL("/dashboard", url.origin))
  res.cookies.set(
    SSO_COOKIE,
    signSsoToken({ sub: id, email: dbUser.email, role: dbUser.role }),
    ssoCookieOptions()
  )
  return res
}
