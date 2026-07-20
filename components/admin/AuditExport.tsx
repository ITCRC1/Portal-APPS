"use client"

import { useState } from "react"
import {
  cardStyle,
  sectionHintStyle,
  sectionTitleStyle,
  inputStyle,
  labelStyle,
  createButtonStyle,
} from "./styles"

function pad(n: number) {
  return String(n).padStart(2, "0")
}
function dateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function AuditExport() {
  const now = new Date()
  const today = dateStr(now)
  const firstOfMonth = dateStr(new Date(now.getFullYear(), now.getMonth(), 1))

  const [onlyToday, setOnlyToday] = useState(false)
  const [from, setFrom] = useState(firstOfMonth)
  const [to, setTo] = useState(today)

  function download() {
    const f = onlyToday ? today : from
    const t = onlyToday ? today : to
    const params = new URLSearchParams({ from: f, to: t })
    // El PDF se sirve como descarga (Content-Disposition), así que no cambia de página.
    window.location.href = `/admin/audit/export?${params.toString()}`
  }

  return (
    <section style={cardStyle}>
      <h2 style={sectionTitleStyle}>Bitácora de auditoría</h2>
      <p style={sectionHintStyle}>
        Todo lo que se hace (usuarios, departamentos, documentos, tareas, avisos y tickets) queda
        registrado. Descarga el historial en PDF por el rango de fechas que necesites.
      </p>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1rem",
          color: "var(--crc-brown)",
          fontSize: "0.9rem",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={onlyToday}
          onChange={(e) => setOnlyToday(e.target.checked)}
          style={{ width: "auto" }}
        />
        Solo el día de hoy
      </label>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "end" }}>
        <label style={{ ...labelStyle, opacity: onlyToday ? 0.45 : 1 }}>
          Desde
          <input
            type="date"
            value={from}
            max={to}
            disabled={onlyToday}
            onChange={(e) => setFrom(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={{ ...labelStyle, opacity: onlyToday ? 0.45 : 1 }}>
          Hasta
          <input
            type="date"
            value={to}
            min={from}
            max={today}
            disabled={onlyToday}
            onChange={(e) => setTo(e.target.value)}
            style={inputStyle}
          />
        </label>

        <button type="button" onClick={download} style={createButtonStyle}>
          Descargar PDF
        </button>
      </div>
    </section>
  )
}
