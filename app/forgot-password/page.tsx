"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { createPasswordChangeRequest } from "@/lib/actions/password-requests"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const formData = new FormData()
      formData.set("email", email)
      formData.set("message", message)
      await createPasswordChangeRequest(formData)
      setSent(true)
    } catch {
      setError("No se pudo enviar la solicitud. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(circle at 20% 20%, var(--crc-brown) 0%, var(--crc-brown-dark) 55%, #241811 100%)",
      }}
    >
      <div className="flex w-full max-w-[380px] flex-col items-center gap-8">
        <div className="w-[200px]">
          <Image
            src="/logo.png"
            alt="The Costa Rica Collection"
            width={800}
            height={260}
            style={{ width: "100%", height: "auto" }}
            priority
          />
        </div>

        <div
          className="w-full rounded-2xl p-8 shadow-2xl ring-1 ring-black/5"
          style={{ backgroundColor: "var(--crc-sand)" }}
        >
          {sent ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <h1 className="text-xl font-semibold" style={{ color: "var(--crc-brown-dark)" }}>
                Solicitud enviada
              </h1>
              <p className="text-sm" style={{ color: "var(--crc-brown)" }}>
                Un administrador revisará tu solicitud y actualizará tu contraseña. Te avisará por
                otro medio cuando esté lista.
              </p>
              <Link
                href="/login"
                className="mt-2 text-sm font-semibold underline"
                style={{ color: "var(--crc-brown-dark)" }}
              >
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-xl font-semibold" style={{ color: "var(--crc-brown-dark)" }}>
                  Solicitar cambio de contraseña
                </h1>
                <p className="mt-1 text-sm opacity-70" style={{ color: "var(--crc-brown)" }}>
                  Deja tu correo y un administrador te asignará una contraseña nueva.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: "var(--crc-brown)" }}
                  >
                    Correo
                  </span>
                  <input
                    type="email"
                    placeholder="nombre@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-lg px-3 py-2.5 text-sm outline-none transition focus:ring-2"
                    style={{
                      border: "1px solid var(--crc-brown)",
                      backgroundColor: "var(--crc-white)",
                      color: "var(--crc-brown-dark)",
                    }}
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: "var(--crc-brown)" }}
                  >
                    Mensaje (opcional)
                  </span>
                  <textarea
                    placeholder="Cualquier detalle adicional para el administrador"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="rounded-lg px-3 py-2.5 text-sm outline-none transition focus:ring-2"
                    style={{
                      border: "1px solid var(--crc-brown)",
                      backgroundColor: "var(--crc-white)",
                      color: "var(--crc-brown-dark)",
                      resize: "vertical",
                    }}
                  />
                </label>

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 rounded-lg py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: "var(--crc-green)" }}
                >
                  {loading ? "Enviando..." : "Enviar solicitud"}
                </button>

                <Link
                  href="/login"
                  className="text-center text-sm underline"
                  style={{ color: "var(--crc-brown)" }}
                >
                  Volver al login
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
