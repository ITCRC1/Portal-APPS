"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Correo o contraseña incorrectos")
      return
    }

    router.push("/dashboard")
    router.refresh()
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

        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl p-8 shadow-2xl ring-1 ring-black/5"
          style={{ backgroundColor: "var(--crc-sand)" }}
        >
          <div className="mb-6 text-center">
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--crc-brown-dark)" }}
            >
              Portal de Plataformas Internas
            </h1>
            <p
              className="mt-1 text-sm opacity-70"
              style={{ color: "var(--crc-brown)" }}
            >
              Ingresa con tus credenciales corporativas
            </p>
          </div>

          <div className="flex flex-col gap-4">
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
                Contraseña
              </span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm outline-none transition focus:ring-2"
                  style={{
                    border: "1px solid var(--crc-brown)",
                    backgroundColor: "var(--crc-white)",
                    color: "var(--crc-brown-dark)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute inset-y-0 right-0 flex items-center px-3"
                  style={{ color: "var(--crc-brown)" }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-lg py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "var(--crc-green)" }}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

            <Link
              href="/forgot-password"
              className="text-center text-sm underline"
              style={{ color: "var(--crc-brown)" }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>

        <p className="text-xs" style={{ color: "var(--crc-sand)" }}>
          © {new Date().getFullYear()} The Costa Rica Collection
        </p>
      </div>
    </div>
  )
}
