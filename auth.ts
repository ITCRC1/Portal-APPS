import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import argon2 from "argon2"
import { prisma } from "@/lib/prisma"

// Anti fuerza bruta: tras MAX_ATTEMPTS fallos seguidos, la cuenta se bloquea
// LOCK_MINUTES; luego se desbloquea sola. El admin puede desbloquear antes.
const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  // El cierre por inactividad (1 minuto) lo hace <IdleTimeout/> en el cliente, que
  // se reinicia con la actividad real del usuario. Aquí solo fijamos la vida máxima
  // absoluta de la sesión (una jornada), para no cortar a quien sí está trabajando.
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).toLowerCase() },
        })

        if (!user || !user.isActive) return null

        // Cuenta bloqueada por intentos: no entra aunque la clave sea correcta.
        if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
          return null
        }

        const isValid = await argon2.verify(user.passwordHash, credentials.password as string)

        if (!isValid) {
          const attempts = user.failedLoginAttempts + 1
          const shouldLock = attempts >= MAX_ATTEMPTS
          await prisma.user.update({
            where: { id: user.id },
            data: {
              // Al bloquear, reinicia el contador para dar otra tanda tras el desbloqueo.
              failedLoginAttempts: shouldLock ? 0 : attempts,
              lockedUntil: shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : user.lockedUntil,
            },
          })
          return null
        }

        // Éxito: limpia contador y bloqueo si venían de intentos previos.
        if (user.failedLoginAttempts !== 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          departmentId: user.departmentId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role
        token.departmentId = (user as { departmentId?: string | null }).departmentId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // token.sub es el id del usuario; sin esto session.user.id queda indefinido.
        if (token.sub) {
          session.user.id = token.sub
        }
        session.user.role = token.role as string
        session.user.departmentId = token.departmentId as string | null
      }
      return session
    },
  },
})
