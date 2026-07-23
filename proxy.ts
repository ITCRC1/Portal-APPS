import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { SSO_COOKIE, signSsoToken, verifySsoToken, ssoCookieOptions } from "@/lib/sso"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/sso") ||
    pathname === "/logo.png"

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    // Guarda a dónde iba para volver ahí tras iniciar sesión.
    loginUrl.searchParams.set("next", pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // Usuario autenticado: mantiene viva la cookie SSO que consumen las demás apps del
  // dominio. Solo se re-firma si falta o le quedan menos de 10 minutos, para no poner
  // un Set-Cookie en cada request.
  if (isLoggedIn && process.env.SSO_SECRET) {
    const u = req.auth!.user as { id?: string; email?: string | null; role?: string } | undefined
    if (u?.id && u.email) {
      const current = verifySsoToken(req.cookies.get(SSO_COOKIE)?.value)
      const secondsLeft = current ? current.exp - Math.floor(Date.now() / 1000) : 0
      if (secondsLeft < 10 * 60) {
        const res = NextResponse.next()
        res.cookies.set(
          SSO_COOKIE,
          signSsoToken({ sub: u.id, email: u.email, role: u.role ?? "" }),
          ssoCookieOptions()
        )
        return res
      }
    }
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
