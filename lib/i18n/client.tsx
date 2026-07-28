"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { Locale } from "./config"
import type { Dictionary } from "./dictionaries/es"

// El diccionario se inyecta desde el layout raíz (server) como prop. Los componentes
// de cliente lo consumen con useI18n() y acceden a las claves de forma tipada:
//   const { dict } = useI18n(); dict.nav.tasks

type I18nValue = { locale: Locale; dict: Dictionary }

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({
  locale,
  dict,
  children,
}: I18nValue & { children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n debe usarse dentro de <I18nProvider>")
  return ctx
}
