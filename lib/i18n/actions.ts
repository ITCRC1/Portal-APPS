"use server"

import { cookies } from "next/headers"
import { LOCALE_COOKIE, isLocale, type Locale } from "./config"

// Guarda la preferencia de idioma en la cookie `lang`. La llama el selector ES/EN.
// No es httpOnly a propósito: no es dato sensible y así el cliente también puede leerla.
export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) return
  const store = await cookies()
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 año
    sameSite: "lax",
  })
}
