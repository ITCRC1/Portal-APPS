import { auth } from "@/auth"

const kpis = [
  { title: "Ingresos MTD", value: "$578K" },
  { title: "Ingresos YTD", value: "$3.8M" },
  { title: "Ocupación", value: "54.2%" },
  { title: "ADR", value: "$607" },
  { title: "RevPAR", value: "$329" },
  { title: "Posición de Caja", value: "$583K" },
  { title: "CAPEX Utilizado", value: "68%" },
  { title: "Variación de Forecast", value: "-$112K" },
]

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div>
      <h1 style={{ color: "var(--crc-brown-dark)", marginBottom: "0.25rem", fontSize: "1.5rem" }}>
        Bienvenido, {session?.user?.name}
      </h1>
      <p style={{ color: "#777", marginBottom: "2rem" }}>
        Resumen ejecutivo — datos de ejemplo, se conectarán a fuentes reales más adelante.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        {kpis.map((k) => (
          <div
            key={k.title}
            style={{
              backgroundColor: "var(--crc-white)",
              borderRadius: 10,
              padding: "1.25rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.4rem" }}>
              {k.title}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--crc-brown-dark)" }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
