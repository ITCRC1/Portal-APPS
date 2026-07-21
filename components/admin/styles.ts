import type { CSSProperties } from "react"

export const cardStyle: CSSProperties = {
  backgroundColor: "var(--crc-white)",
  borderRadius: 12,
  padding: "1.5rem",
  // Borde tenue en vez de sombra: separa sin recargar (menos cansancio visual).
  border: "1px solid var(--crc-border)",
}

export const sectionTitleStyle: CSSProperties = {
  fontSize: "1.05rem",
  color: "var(--crc-brown-dark)",
  marginBottom: "0.35rem",
}

export const sectionHintStyle: CSSProperties = {
  color: "#777",
  fontSize: "0.85rem",
  marginBottom: "1rem",
}

export const labelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
  fontSize: "0.85rem",
  color: "var(--crc-brown)",
}

export const inputStyle: CSSProperties = {
  padding: "0.55rem 0.65rem",
  borderRadius: 6,
  border: "1px solid var(--crc-brown)",
  backgroundColor: "var(--crc-white)",
  color: "var(--crc-brown-dark)",
  minWidth: 0,
}

// Los campos de tabla se estiran a su celda; table-layout: fixed les da el ancho.
export const cellInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding: "0.4rem 0.45rem",
  borderRadius: 6,
  border: "1px solid var(--crc-brown)",
  backgroundColor: "var(--crc-white)",
  color: "var(--crc-brown-dark)",
  fontSize: "0.8rem",
}

export const outlineButtonStyle: CSSProperties = {
  padding: "0.4rem 0.5rem",
  borderRadius: 6,
  border: "1px solid var(--crc-brown)",
  backgroundColor: "var(--crc-white)",
  color: "var(--crc-brown-dark)",
  cursor: "pointer",
  fontSize: "0.75rem",
  whiteSpace: "nowrap",
}

export const primaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: "0.4rem 0.5rem",
  borderRadius: 6,
  border: "none",
  backgroundColor: "var(--crc-green)",
  color: "var(--crc-white)",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.75rem",
  whiteSpace: "nowrap",
}

export const createButtonStyle: CSSProperties = {
  padding: "0.6rem 1rem",
  borderRadius: 6,
  border: "none",
  backgroundColor: "var(--crc-green)",
  color: "var(--crc-white)",
  fontWeight: 600,
  cursor: "pointer",
  height: "fit-content",
}

export const createFormStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "1rem",
  alignItems: "end",
}

export const thStyle: CSSProperties = {
  padding: "0.4rem 0.35rem",
  fontSize: "0.75rem",
  fontWeight: 600,
  whiteSpace: "nowrap",
}

export const tdStyle: CSSProperties = { padding: "0.4rem 0.35rem", verticalAlign: "middle" }

export const tableStyle: CSSProperties = {
  width: "100%",
  tableLayout: "fixed",
  borderCollapse: "collapse",
}

export const theadRowStyle: CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #e5ddd3",
  color: "#888",
}

export const tbodyRowStyle: CSSProperties = { borderBottom: "1px solid #f0ebe3" }

export function badgeStyle(ok: boolean): CSSProperties {
  return {
    display: "inline-block",
    padding: "0.15rem 0.45rem",
    borderRadius: 999,
    fontSize: "0.7rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
    backgroundColor: ok ? "#e6f0e0" : "#f3e6e6",
    color: ok ? "var(--crc-green)" : "#a33",
  }
}
