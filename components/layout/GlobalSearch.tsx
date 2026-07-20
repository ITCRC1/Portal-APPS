"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { searchAll, type SearchHit, type SearchType } from "@/lib/actions/search"

const TYPE_LABEL: Record<SearchType, string> = {
  task: "Tareas",
  announcement: "Avisos",
  document: "Documentos",
  department: "Departamentos",
  person: "Personas",
}

const TYPE_ICON: Record<SearchType, string> = {
  task: "✓",
  announcement: "📣",
  document: "📄",
  department: "🏢",
  person: "👤",
}

// Orden en que se muestran los grupos de resultados.
const TYPE_ORDER: SearchType[] = ["task", "announcement", "document", "department", "person"]

export function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  // Ficha de petición: descarta respuestas que llegan tarde (fuera de orden).
  const reqId = useRef(0)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setHits([])
      setLoading(false)
      return
    }
    setLoading(true)
    const my = ++reqId.current
    const timer = setTimeout(async () => {
      try {
        const res = await searchAll(q)
        if (my === reqId.current) {
          setHits(res)
          setActive(0)
          setLoading(false)
        }
      } catch {
        if (my === reqId.current) {
          setHits([])
          setLoading(false)
        }
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  // Cerrar al hacer clic fuera del buscador.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  // Lista plana en el orden en que se pinta, para poder navegar con el teclado.
  const ordered = useMemo(() => {
    const groups = TYPE_ORDER.map((type) => ({
      type,
      items: hits.filter((h) => h.type === type),
    })).filter((g) => g.items.length > 0)
    return { groups, flat: groups.flatMap((g) => g.items) }
  }, [hits])

  function go(href: string) {
    setOpen(false)
    setQuery("")
    setHits([])
    router.push(href)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false)
      return
    }
    const flat = ordered.flat
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, flat.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      const hit = flat[active]
      if (hit) {
        e.preventDefault()
        go(hit.href)
      }
    }
  }

  const showPanel = open && query.trim().length >= 2

  // Índice global de cada resultado (para resaltar el activo entre grupos).
  let runningIndex = -1

  return (
    <div
      ref={boxRef}
      style={{ position: "relative", flex: "1 1 320px", maxWidth: 460, margin: "0 1.5rem" }}
    >
      <div style={{ position: "relative" }}>
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#b7ad9f",
            display: "flex",
            pointerEvents: "none",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          type="text"
          value={query}
          placeholder="Buscar tareas, avisos, documentos…"
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-label="Buscar en el portal"
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem 0.5rem 2.2rem",
            borderRadius: 999,
            border: "1px solid #e5ddd3",
            backgroundColor: "var(--crc-sand)",
            fontSize: "0.85rem",
            color: "var(--crc-brown-dark)",
            outline: "none",
          }}
        />
      </div>

      {showPanel && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 50,
            maxHeight: 440,
            overflowY: "auto",
            backgroundColor: "var(--crc-white)",
            borderRadius: 10,
            border: "1px solid #e5ddd3",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          }}
        >
          {loading && ordered.flat.length === 0 ? (
            <div style={{ padding: "1.25rem 0.9rem", textAlign: "center", color: "#aaa", fontSize: "0.85rem" }}>
              Buscando…
            </div>
          ) : ordered.flat.length === 0 ? (
            <div style={{ padding: "1.25rem 0.9rem", textAlign: "center", color: "#aaa", fontSize: "0.85rem" }}>
              Sin resultados para “{query.trim()}”.
            </div>
          ) : (
            ordered.groups.map((group) => (
              <div key={group.type}>
                <div
                  style={{
                    padding: "0.5rem 0.9rem 0.3rem",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "#a99",
                  }}
                >
                  {TYPE_LABEL[group.type]}
                </div>
                {group.items.map((hit) => {
                  runningIndex += 1
                  const isActive = runningIndex === active
                  return (
                    <button
                      key={hit.id}
                      type="button"
                      onMouseEnter={() => setActive(ordered.flat.indexOf(hit))}
                      onClick={() => go(hit.href)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        gap: "0.6rem",
                        alignItems: "center",
                        padding: "0.55rem 0.9rem",
                        border: "none",
                        background: isActive ? "#f6f2ea" : "var(--crc-white)",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          flexShrink: 0,
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          background: "var(--crc-sand)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.85rem",
                          color: "var(--crc-green)",
                        }}
                      >
                        {TYPE_ICON[hit.type]}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "var(--crc-brown-dark)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {hit.title}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.75rem",
                            color: "#888",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {hit.subtitle}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
