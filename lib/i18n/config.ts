// Configuración de idioma del portal. El idioma se guarda en una cookie (`lang`);
// no hay segmento de URL por idioma (ver docs/plan): la app es una intranet con login,
// así que el idioma es una preferencia por navegador, no parte de la ruta.

export const LOCALES = ["es", "en"] as const
export type Locale = (typeof LOCALES)[number]

// Español por defecto: es el idioma actual del portal, así nadie ve un cambio inesperado.
export const DEFAULT_LOCALE: Locale = "es"

export const LOCALE_COOKIE = "lang"

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "es" || value === "en"
}
