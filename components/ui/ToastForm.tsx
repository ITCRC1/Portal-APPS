"use client"

import type { ComponentProps, ReactNode } from "react"
import { toast } from "@/components/ui/toast"

type Props = Omit<ComponentProps<"form">, "action"> & {
  action: (formData: FormData) => Promise<void>
  success?: string
  error?: string
  children: ReactNode
}

/**
 * Formulario que ejecuta una Server Action y muestra un toast al terminar.
 * Reemplaza a <form action={serverAction}> sin cambiar la acción: en éxito muestra
 * `success`, y si la acción lanza un error muestra `error`.
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
      await action(formData)
      toast.success(success)
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
