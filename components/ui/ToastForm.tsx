"use client"

import type { ComponentProps, ReactNode } from "react"
import { toast } from "@/components/ui/toast"

// La acción puede devolver void (éxito) o un resultado con un error para mostrar.
type ActionResult = void | { ok: boolean; message?: string }

type Props = Omit<ComponentProps<"form">, "action"> & {
  action: (formData: FormData) => Promise<ActionResult>
  success?: string
  error?: string
  children: ReactNode
}

/**
 * Formulario que ejecuta una Server Action y muestra un toast al terminar.
 * Reemplaza a <form action={serverAction}> sin cambiar la acción: en éxito muestra
 * `success`; si la acción devuelve `{ ok: false, message }` muestra ese mensaje, y si
 * lanza un error muestra `error`.
 */
export function ToastForm({
  action,
  success = "Guardado",
  error = "No se pudo completar la acción",
  children,
  ...rest
}: Props) {
  async function clientAction(formData: FormData) {
    try {
      const result = await action(formData)
      if (result && result.ok === false) {
        toast.error(result.message || error)
      } else {
        toast.success(success)
      }
    } catch {
      toast.error(error)
    }
  }

  return (
    <form {...rest} action={clientAction}>
      {children}
    </form>
  )
}
