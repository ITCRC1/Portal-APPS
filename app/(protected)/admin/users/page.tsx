import { redirect } from "next/navigation"

// La gestión de usuarios ahora vive directamente en /admin.
export default function AdminUsersPage() {
  redirect("/admin")
}
