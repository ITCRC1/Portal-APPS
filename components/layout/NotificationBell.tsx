"use client"

import { useState } from "react"
import { openNotification, markAllNotificationsRead } from "@/lib/actions/notifications"

export type NotificationView = {
  id: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  when: string
}

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationView[]
  unreadCount: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 38,
          height: 38,
          borderRadius: 999,
          border: "1px solid #e5ddd3",
          backgroundColor: "var(--crc-white)",
          cursor: "pointer",
          color: "var(--crc-brown-dark)",
        }}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              minWidth: 18,
              height: 18,
              padding: "0 4px",
              borderRadius: 999,
              background: "#a33",
              color: "#fff",
              fontSize: "0.65rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Capa para cerrar al hacer clic fuera. */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              zIndex: 50,
              width: 340,
              maxHeight: 420,
              overflowY: "auto",
              backgroundColor: "var(--crc-white)",
              borderRadius: 10,
              border: "1px solid #e5ddd3",
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.7rem 0.9rem",
                borderBottom: "1px solid #f0ebe3",
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--crc-brown-dark)", fontSize: "0.9rem" }}>
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <form action={markAllNotificationsRead}>
                  <button
                    type="submit"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--crc-green)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    Marcar todas como leídas
                  </button>
                </form>
              )}
            </div>

            {notifications.length === 0 ? (
              <div style={{ padding: "1.5rem 0.9rem", textAlign: "center", color: "#aaa", fontSize: "0.85rem" }}>
                No tienes notificaciones.
              </div>
            ) : (
              notifications.map((n) => (
                <form key={n.id} action={openNotification}>
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="link" value={n.link ?? "/dashboard"} />
                  <button
                    type="submit"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      gap: "0.6rem",
                      alignItems: "start",
                      padding: "0.7rem 0.9rem",
                      border: "none",
                      borderBottom: "1px solid #f5f1ea",
                      background: n.read ? "var(--crc-white)" : "#f6f2ea",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        marginTop: 6,
                        background: n.read ? "transparent" : "var(--crc-green)",
                      }}
                    />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: "0.83rem", fontWeight: 600, color: "var(--crc-brown-dark)" }}>
                        {n.title}
                      </span>
                      {n.body && (
                        <span style={{ display: "block", fontSize: "0.78rem", color: "#666", lineHeight: 1.3 }}>
                          {n.body}
                        </span>
                      )}
                      <span style={{ display: "block", fontSize: "0.68rem", color: "#aaa", marginTop: 2 }}>
                        {n.when}
                      </span>
                    </span>
                  </button>
                </form>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
