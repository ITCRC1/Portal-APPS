import { CONFIDENTIALITY_LABELS } from "@/lib/permissions"

type Props = {
  doc: {
    id: string
    name: string
    description: string | null
    category: string
    fileName: string
    size: number
    confidentiality: string
    department?: { name: string } | null
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileKind(fileName: string): string {
  const ext = fileName.split(".").pop()?.toUpperCase() ?? ""
  return ext || "Archivo"
}

export function DocumentCard({ doc }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--crc-white)",
        borderRadius: 10,
        padding: "1.25rem",
        border: "1px solid var(--crc-border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "1.5rem" }}>📄</span>
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "var(--crc-brown)",
            border: "1px solid var(--crc-brown)",
            borderRadius: 4,
            padding: "0.05rem 0.35rem",
          }}
        >
          {fileKind(doc.fileName)}
        </span>
        <span style={{ fontSize: "0.75rem", color: "#999" }}>{formatSize(doc.size)}</span>
      </div>

      <div style={{ fontWeight: 700, color: "var(--crc-brown-dark)", marginBottom: "0.35rem" }}>
        {doc.name}
      </div>
      {doc.description && (
        <p style={{ fontSize: "0.85rem", color: "#777", margin: "0 0 0.75rem" }}>{doc.description}</p>
      )}

      <div style={{ fontSize: "0.72rem", color: "#999", marginBottom: "1rem" }}>
        {doc.category}
        {doc.department ? ` · ${doc.department.name}` : ""} ·{" "}
        {CONFIDENTIALITY_LABELS[doc.confidentiality] ?? doc.confidentiality}
      </div>

      <a
        href={`/documents/${doc.id}/download`}
        style={{
          marginTop: "auto",
          textAlign: "center",
          padding: "0.55rem 0.75rem",
          borderRadius: 6,
          backgroundColor: "var(--crc-green)",
          color: "var(--crc-white)",
          fontWeight: 600,
          fontSize: "0.85rem",
          textDecoration: "none",
        }}
      >
        Descargar
      </a>
    </div>
  )
}
