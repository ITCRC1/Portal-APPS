import { prisma } from "@/lib/prisma"
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react"

export default async function SystemLinksPage() {
  const links = await prisma.systemLink.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: { department: true },
  })

  return (
    <div>
      <h1 style={{ color: "var(--crc-brown-dark)", fontSize: "1.5rem", marginBottom: "0.25rem" }}>
        Enlaces del Sistema
      </h1>
      <p style={{ color: "#777", marginBottom: "2rem" }}>
        Accesos directos a las plataformas internas de The Costa Rica Collection.
      </p>

      {links.length === 0 ? (
        <p style={{ color: "#777" }}>No hay enlaces registrados todavía.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1rem",
          }}
        >
          {links.map((link: { id: Key | null | undefined; url: string | undefined; icon: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; description: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined }) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                textDecoration: "none",
                backgroundColor: "var(--crc-white)",
                borderRadius: 10,
                padding: "1.25rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                transition: "transform 0.15s",
              }}
            >
              <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{link.icon}</div>
              <div style={{ fontWeight: 700, color: "var(--crc-brown-dark)", marginBottom: "0.35rem" }}>
                {link.name}
              </div>
              <p style={{ fontSize: "0.85rem", color: "#777", margin: 0 }}>{link.description}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
