import { requireModuleAccess } from "@/lib/require-module-access"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireModuleAccess("admin")

  return <>{children}</>
}
