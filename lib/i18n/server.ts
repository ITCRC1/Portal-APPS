import "server-only"
import { cookies } from "next/headers"
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config"
import { es, type Dictionary } from "./dictionaries/es"
import { en } from "./dictionaries/en"

const DICTIONARIES: Record<Locale, Dictionary> = { es, en }

// Lee el idioma de la cookie `lang` (server-side). Si no hay o es inválido, español.
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}

// Atajo para páginas/layouts de servidor: idioma + diccionario en un solo await.
export async function getI18n(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale()
  return { locale, dict: getDictionary(locale) }
}
