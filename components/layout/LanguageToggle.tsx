"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/client"
import { setLocale } from "@/lib/i18n/actions"
import { LOCALES, type Locale } from "@/lib/i18n/config"

// Selector ES/EN. Cambia la cookie `lang` (server action) y refresca para que el
// servidor vuelva a renderizar todo en el idioma elegido.
export function LanguageToggle() {
  const { locale, dict } = useI18n()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function change(next: Locale) {
    if (next === locale || pending) return
    startTransition(async () => {
      await setLocale(next)
      router.refresh()
    })
  }

  return (
    <div
      role="group"
      aria-label={dict.topbar.changeLanguage}
      style={{
        display: "inline-flex",
        border: "1px solid #e5ddd3",
        borderRadius: 6,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {LOCALES.map((l) => {
        const activo = l === locale
        return (
          <button
            key={l}
            type="button"
            onClick={() => change(l)}
            aria-pressed={activo}
            disabled={pending}
            style={{
              padding: "0.3rem 0.55rem",
              border: "none",
              backgroundColor: activo ? "var(--crc-brown-dark)" : "transparent",
              color: activo ? "var(--crc-white)" : "var(--crc-brown-dark)",
              cursor: activo ? "default" : "pointer",
              fontSize: "0.72rem",
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            {l.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
