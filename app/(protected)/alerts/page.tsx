import { requireModuleAccess } from "@/lib/require-module-access"

export default async function Page() {
  await requireModuleAccess("alerts")

  return (
    <div>
      <h1 style={{ color: "var(--crc-brown-dark)", fontSize: "1.5rem", marginBottom: "0.5rem" }}>
        Alertas
      </h1>
      <p style={{ color: "#777" }}>
        Este módulo se construirá en un próximo paso.
      </p>
    </div>
  )
}
