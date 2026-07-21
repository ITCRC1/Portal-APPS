import { auth } from "@/auth"
import { redirect } from "next/navigation"
import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { AppShell } from "@/components/layout/AppShell"
import { IdleTimeout } from "@/components/layout/IdleTimeout"
import { Toaster } from "@/components/ui/toast"
import type { NotificationView } from "@/components/layout/NotificationBell"

function formatWhen(date: Date): string {
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000)
  if (diffMin < 1) return "hace un momento"
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `hace ${diffHr} h`
  return date.toLocaleDateString("es-CR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const userId = session.user.id

  // Re-valida contra la base: un usuario desactivado no debe ver nada del portal,
  // aunque su token siga vigente.
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true, role: true },
  })
  if (!dbUser || !dbUser.isActive) {
    redirect("/login")
  }
  const role = dbUser.role as Role

  const [rawNotifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, title: true, body: true, link: true, read: true, createdAt: true },
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ])

  const notifications: NotificationView[] = rawNotifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    when: formatWhen(n.createdAt),
  }))

  // El estado del drawer (menú lateral en móvil) vive dentro de AppShell, un pequeño
  // contenedor cliente; este layout sigue siendo Server Component y solo le pasa datos.
  return (
    <>
      <IdleTimeout />
      <Toaster />
      <AppShell
        role={role}
        user={session.user}
        notifications={notifications}
        unreadCount={unreadCount}
      >
        {children}
      </AppShell>
    </>
  )
}
