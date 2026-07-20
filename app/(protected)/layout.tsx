import { auth } from "@/auth"
import { redirect } from "next/navigation"
import type { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"
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

  const role = session.user.role as Role
  const userId = session.user.id

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

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <IdleTimeout />
      <Toaster />
      <Sidebar role={role} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar user={session.user} notifications={notifications} unreadCount={unreadCount} />
        <main
          style={{
            flex: 1,
            padding: "2rem",
            backgroundColor: "var(--crc-sand)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
