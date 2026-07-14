import Link from "next/link"

const sections = [
  { href: "/admin/users", label: "Usuarios", description: "Crear usuarios, asignar roles y administrar contraseñas." },
]

export default function Page() {
  return (
    <div>
      <h1 style={{ color: "var(--crc-brown-dark)", fontSize: "1.5rem", marginBottom: "0.5rem" }}>
        Panel de Administración
      </h1>
      <p style={{ color: "#777", marginBottom: "2rem" }}>
        Departamentos, enlaces, documentos, KPIs, anuncios, alertas y tareas se irán agregando aquí.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            style={{
              display: "block",
              textDecoration: "none",
              backgroundColor: "var(--crc-white)",
              borderRadius: 10,
              padding: "1.25rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--crc-brown-dark)", marginBottom: "0.35rem" }}>
              {s.label}
            </div>
            <p style={{ fontSize: "0.85rem", color: "#777", margin: 0 }}>{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
