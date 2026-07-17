import { auth } from "@/auth"
import { redirect } from "next/navigation"
import type { Role } from "@prisma/client"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"
import { IdleTimeout } from "@/components/layout/IdleTimeout"

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

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <IdleTimeout />
      <Sidebar role={role} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar user={session.user} />
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
