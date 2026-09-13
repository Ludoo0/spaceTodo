# Spaces – persönliches Todo- & Notiz-Tool

Ein kleines, selbst gehostetes Tool zum Organisieren mehrerer Lebensbereiche
("Spaces"). Jeder Space hat eine Todo-Liste oben und ein Cork­board mit
frei verschiebbaren Sticky Notes darunter. Auf der Startseite laufen alle
Todos zusammen, die du in irgendeinem Space mit ★ als "wichtig" markiert hast.

Login läuft ausschließlich über OIDC (Keycloak, Authentik, Zitadel, Google
Workspace, Azure AD, Authelia, Pocket ID, …) – es gibt kein eigenes Passwort-System.

## Architektur

- **frontend/** – React + Vite, wird als statische Seite über Nginx ausgeliefert
  (Nginx reicht `/api` und `/auth` an das Backend weiter)
- **backend/** – Node.js/TypeScript (Express), Prisma ORM, `openid-client` für OIDC
- **db** – PostgreSQL (Daten + Session-Store)

## Schnellstart

1. `.env` anlegen:

   ```bash
   cp .env.example .env
   ```

2. `.env` ausfüllen – mindestens `POSTGRES_PASSWORD`, `SESSION_SECRET` sowie
   die `OIDC_*`-Variablen (siehe unten).

3. Starten:

   ```bash
   docker compose up -d --build
   ```

4. App unter `http://localhost:8080` (bzw. dem in `HTTP_PORT` gesetzten Port)
   öffnen.

## OIDC-Provider einrichten

Das Backend spricht mit jedem Standard-OIDC-Provider, der Authorization Code
Flow mit PKCE unterstützt. Wichtig ist nur die exakte Redirect-URI.

Beim Provider registrierst du einen "Confidential" bzw. "Web" Client mit:

- **Redirect URI**: `${FRONTEND_URL}/auth/callback`, z. B.
  `http://localhost:8080/auth/callback`
- **Grant Type**: Authorization Code (mit PKCE)
- **Scopes**: `openid profile email`

Beispiel für **Keycloak**:

- Client anlegen unter *Clients → Create client*
- Client-ID z. B. `spacetodo`, "Client authentication" aktivieren
- Valid redirect URI: `http://localhost:8080/auth/callback`
- `OIDC_ISSUER_URL` = `https://<dein-keycloak>/realms/<realm>`
- Client Secret aus dem Tab *Credentials* in `OIDC_CLIENT_SECRET` eintragen

Für **Authentik**, **Zitadel**, **Google**, **Azure AD** und **Pocket ID** gilt dasselbe
Prinzip – lediglich `OIDC_ISSUER_URL` (muss `/.well-known/openid-configuration`
bereitstellen), `OIDC_CLIENT_ID` und `OIDC_CLIENT_SECRET` ändern sich.

Der allererste Login legt automatisch einen Benutzer in der Datenbank an
(Zuordnung über die `sub`-Claim des Providers).

## Produktivbetrieb

- Setze `COOKIE_SECURE=true`, sobald die App über HTTPS erreichbar ist
  (z. B. hinter Traefik/Caddy/nginx-proxy als TLS-Terminator).
- `FRONTEND_URL` und `OIDC_REDIRECT_URI` müssen auf die öffentliche Domain
  zeigen, unter der die App tatsächlich läuft.
- Datenbank-Daten liegen im Docker-Volume `db_data` – für Backups
  `pg_dump` gegen den `db`-Container laufen lassen.
- Beim Start des Backend-Containers wird das Datenbankschema automatisch
  über `prisma db push` synchronisiert – kein manueller Migrationsschritt
  nötig.

## Lokale Entwicklung ohne Docker

```bash
# Backend
cd backend
npm install
npx prisma generate
npm run dev   # erwartet eine laufende Postgres-Instanz via DATABASE_URL

# Frontend (in zweitem Terminal)
cd frontend
npm install
npm run dev   # http://localhost:5173, proxyt /api und /auth auf Port 4000
```

## Funktionsumfang

- OIDC-Login (Authorization Code + PKCE), Server-Side-Sessions in Postgres
- Beliebig viele Spaces (Job, Hobby, …) mit Farbe
- Todo-Liste pro Space: hinzufügen, abhaken, löschen, mit ★ priorisieren
- Sticky-Note-Corkboard pro Space: frei positionierbar (Drag & Drop), Farben,
  freier Text
- Startseite mit automatisch aggregierter Liste aller priorisierten,
  offenen Todos aus allen Spaces
