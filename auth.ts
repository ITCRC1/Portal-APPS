import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import argon2 from "argon2"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
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
          where: { email: credentials.email as string },
        })

        if (!user || !user.isActive) return null

        const isValid = await argon2.verify(
          user.passwordHash,
          credentials.password as string
        )

        if (!isValid) return null

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
        token.role = (user as any).role
        token.departmentId = (user as any).departmentId
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