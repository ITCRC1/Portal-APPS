# SSO — Un solo login para todas las apps del dominio

La intranet (`apps.thecostaricacollection.com`) es el **único login**. Emite una cookie
firmada (`crc_sso`) sobre el dominio raíz `.thecostaricacollection.com`, y cada app del
dominio la **valida** para saber quién es el usuario. Así, con iniciar sesión una vez en
la intranet, quedas dentro de todas las apps.

- **Tickets** → sin guardia. Acceso directo por su link (mantiene su propio comportamiento).
- **Las demás apps** → con guardia. Si no hay sesión válida del portal, rebotan al login
  de la intranet y regresan después.

## Cómo funciona (flujo)

1. El usuario inicia sesión en `apps.thecostaricacollection.com`.
2. El portal pone la cookie `crc_sso` (JWT HS256, ~30 min) en `.thecostaricacollection.com`.
3. El usuario abre otra app (ej. `vouchers.thecostaricacollection.com`). El navegador
   manda la cookie sola (mismo dominio raíz).
4. El guardia de esa app verifica la cookie con el **secreto compartido** (`SSO_SECRET`):
   - Válida → entra. El usuario (id, email, rol) queda disponible para la app.
   - Vencida/ausente → redirige a `…/api/sso/refresh` (renueva sin pedir clave si la
     sesión del portal sigue viva) y, si ya no hay sesión, al login del portal.

Como el token dura poco y se revalida, **desactivar a un usuario en la intranet lo saca
de todas las apps** en minutos.

## Variables de entorno

Genera el secreto una vez: `openssl rand -base64 32`

**En el portal (esta intranet) y en CADA app** debe ir el MISMO valor:

```
SSO_SECRET=<el-mismo-secreto-en-todos>
```

Solo en el portal, además:

```
SSO_COOKIE_DOMAIN=.thecostaricacollection.com
```

> ⚠️ `SSO_SECRET` es distinto de `AUTH_SECRET`. No los mezcles.

## Requisito de dominio (CRÍTICO — sin esto el SSO NO funciona)

La cookie `crc_sso` está scopeada a `.thecostaricacollection.com`; el navegador **solo la
envía a hosts de ese dominio**. Por eso:

1. **Cada backend que valida la cookie debe estar servido bajo un subdominio de
   `thecostaricacollection.com`**, NO bajo `*.up.railway.app`. En Railway, asígnale un
   dominio personalizado, p. ej. `vouchers-api.thecostaricacollection.com`. Si el backend
   queda en `*.up.railway.app`, el navegador nunca manda la cookie y el guardia rechaza
   TODO, siempre.
2. **El frontend debe llamar al backend por ese subdominio** (no por la URL de railway).
3. **El frontend debe enviar la cookie**: `fetch(url, { credentials: "include" })` (o axios
   con `withCredentials: true`). Sin esto el navegador no adjunta la cookie.
4. **CORS del backend**: `allow_credentials=True` y el origen EXACTO del frontend (nunca `"*"`).

---

## Guardia para apps FastAPI  (`sso_guard.py`)

Sin dependencias externas (solo librería estándar). Copia este archivo a la app:

```python
# sso_guard.py — Guardia SSO para apps FastAPI del dominio.
# Verifica la cookie `crc_sso` que emite la intranet.
import base64, hashlib, hmac, json, os, time
from urllib.parse import quote

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, RedirectResponse

SSO_SECRET = os.environ["SSO_SECRET"].encode()          # MISMO valor que en el portal
BASE = "https://apps.thecostaricacollection.com"
PORTAL_REFRESH = f"{BASE}/api/sso/refresh"
PORTAL_LOGIN = f"{BASE}/login"
COOKIE_NAME = "crc_sso"

# Rutas que NO requieren sesión (ajústalas a tu app). El resto queda protegido.
PUBLIC_PREFIXES = ("/health", "/docs", "/openapi.json", "/redoc", "/static")


def _b64url_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def verify_sso_token(token: str | None) -> dict | None:
    """Devuelve los claims si el token es válido y no expiró; si no, None."""
    if not token or token.count(".") != 2:
        return None
    header_b64, payload_b64, sig_b64 = token.split(".")
    expected = hmac.new(SSO_SECRET, f"{header_b64}.{payload_b64}".encode(), hashlib.sha256).digest()
    try:
        got = _b64url_decode(sig_b64)
    except Exception:
        return None
    if not hmac.compare_digest(expected, got):
        return None
    try:
        payload = json.loads(_b64url_decode(payload_b64))
    except Exception:
        return None
    if not isinstance(payload.get("exp"), (int, float)) or payload["exp"] < time.time():
        return None
    return payload


class SsoGuardMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if any(path.startswith(p) for p in PUBLIC_PREFIXES):
            return await call_next(request)

        claims = verify_sso_token(request.cookies.get(COOKIE_NAME))
        if claims is None:
            wants_html = "text/html" in request.headers.get("accept", "")
            if wants_html:
                # Si ya venimos de un intento de refresco y sigue sin cookie, al login
                # (evita bucles si algo está mal configurado).
                if request.query_params.get("_sso") == "1":
                    dest = f"{PORTAL_LOGIN}?next={quote(str(request.url), safe='')}"
                else:
                    sep = "&" if request.url.query else "?"
                    back = quote(f"{request.url}{sep}_sso=1", safe="")
                    dest = f"{PORTAL_REFRESH}?next={back}"
                return RedirectResponse(dest, status_code=307)
            # Llamada de API (no navegador) -> 401.
            return JSONResponse({"detail": "No autenticado"}, status_code=401)

        # Usuario válido: disponible en request.state.user
        request.state.user = {
            "id": claims["sub"],
            "email": claims["email"],
            "role": claims.get("role", ""),
        }
        return await call_next(request)
```

Registrarlo (en el `main.py` de la app):

```python
from fastapi import FastAPI
from sso_guard import SsoGuardMiddleware

app = FastAPI()
app.add_middleware(SsoGuardMiddleware)
```

Usar el usuario dentro de un endpoint:

```python
@app.get("/mi-endpoint")
async def handler(request: Request):
    user = request.state.user      # {"id": ..., "email": ..., "role": ...}
    ...
```

> **Tickets:** simplemente **no** agregues este middleware.

---

## (Opcional) Frontend Next.js

El backend Python ya protege de verdad. En el frontend Next basta un `middleware.ts` que
mande al login del portal cuando falta la cookie (solo mejora la experiencia; la seguridad
la hace el backend):

```ts
import { NextResponse, type NextRequest } from "next/server"

const BASE = "https://apps.thecostaricacollection.com"

export function middleware(req: NextRequest) {
  if (req.cookies.get("crc_sso")) return NextResponse.next()
  const url = encodeURIComponent(req.nextUrl.href)
  return NextResponse.redirect(`${BASE}/api/sso/refresh?next=${url}`)
}

export const config = { matcher: ["/((?!_next|favicon.ico|api/health).*)"] }
```

---

## Checklist de despliegue

1. **Portal**: define `SSO_SECRET` y `SSO_COOKIE_DOMAIN=.thecostaricacollection.com` en
   Railway y redepliega. (El código del portal ya está listo.)
2. **Cada app (menos Tickets)**:
   - Define `SSO_SECRET` con el MISMO valor.
   - Copia `sso_guard.py` y registra el middleware.
   - (Opcional) agrega el `middleware.ts` a su frontend Next.
   - Redepliega.
3. **Verifica** (ver abajo).

## Cómo probar

- Sin sesión, abre `vouchers.thecostaricacollection.com` directo → debe **rebotarte** al
  login del portal; tras entrar, te devuelve a Vouchers ya adentro.
- Con sesión iniciada en la intranet, abre otra app → entra **sin pedir login**.
- Abre `tickets.thecostaricacollection.com` → entra directo (sin guardia).
- Desactiva un usuario en la intranet → en pocos minutos queda fuera de todas las apps.

## Notas de seguridad

- La seguridad de todas depende de que **cada app valide bien**: no publiques una app con
  el guardia mal puesto.
- `SSO_SECRET` es un secreto: solo en variables de entorno del servidor, nunca en el repo.
- Todo va por **HTTPS** (Railway lo da). La cookie es `HttpOnly`, `Secure`, `SameSite=Lax`.
- La cookie SSO **no reemplaza** la autorización interna de cada app: dice *quién* es el
  usuario (y su rol), pero cada app decide *qué puede hacer*.
