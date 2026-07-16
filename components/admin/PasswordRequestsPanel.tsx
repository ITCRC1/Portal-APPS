import { prisma } from "@/lib/prisma"
import { resolvePasswordChangeRequest } from "@/lib/actions/password-requests"
import { cardStyle, outlineButtonStyle } from "./styles"

export async function PasswordRequestsPanel() {
  const pendingRequests = await prisma.passwordChangeRequest.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
  })

  if (pendingRequests.length === 0) return null

  return (
    <section style={{ ...cardStyle, borderLeft: "4px solid var(--crc-gold)" }}>
      <h2 style={{ fontSize: "1.05rem", color: "var(--crc-brown-dark)", marginBottom: "1rem" }}>
        Solicitudes de cambio de contraseña ({pendingRequests.length})
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {pendingRequests.map((r) => (
          <div
            key={r.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              padding: "0.75rem",
              borderRadius: 8,
              backgroundColor: "var(--crc-sand)",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: "var(--crc-brown-dark)", fontSize: "0.9rem" }}>
                {r.email}
              </div>
              {r.message && <div style={{ fontSize: "0.8rem", color: "#777" }}>{r.message}</div>}
              <div style={{ fontSize: "0.75rem", color: "#999" }}>
                {r.createdAt.toLocaleString("es-CR")}
              </div>
            </div>
            <form action={resolvePasswordChangeRequest}>
              <input type="hidden" name="id" value={r.id} />
              <button
                type="submit"
                style={{ ...outlineButtonStyle, padding: "0.5rem 0.75rem", fontSize: "0.8rem" }}
              >
                Marcar resuelta
              </button>
            </form>
          </div>
        ))}
      </div>
    </section>
  )
}
