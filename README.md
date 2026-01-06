# Invoice Server — Ausschreibung

Projekt: Backend für Rechnungserstellung (Express + MongoDB)

Zweck
- Bereitstellung einer robusten, sicheren REST-API zum Erstellen, Lesen, Aktualisieren und Löschen von Rechnungen.
- Persistenz in MongoDB, Admin-Verwaltung (Admin-Login / Credentials).

Hinweis zur Datenbank
- Die Anwendung verwendet die MongoDB‑Datenbank `invoices` (konfigurierbar in `config.env` via `MONGODB_URI`).

Wichtige Dateien
- Server-Entry: server.js
- DB-Connector: config/db.js
- Routes: routes/invoices.js, routes/company.js, routes/admin.js
- Models: models/Invoice.js, models/Company.js, models/Admin.js
- Env: config.env

Technologie-Stack
- Node.js, Express, MongoDB (Mongoose)
- JWT für Auth, bcryptjs für Passwort-Hashing

# Invoice Server

Backend für die Rechnungserstellung (Express + MongoDB). Dieses Repository stellt eine REST‑API bereit, verwaltet Firmen‑ und Admin‑Daten und bietet CRUD‑Operationen für Rechnungen.

Kurzüberblick
- Die Implementierung ist in schlanke Routen und Controller aufgeteilt:
	- Routen: `server/routes/*` — definieren Endpunkte
	- Controller: `server/controllers/*` — enthalten DB‑ und Business‑Logik
	- Models: `server/models/*` — Mongoose Schemata
	- Scripts: `server/scripts/*` — Hilfs­scripte (z. B. `createAdmin.js`, `checkAdmin.js`)

Wichtige Dateien
- Entrypoint: `server.js`
- DB Connector: `config/db.js`
- Routes: `server/routes/invoices.js`, `server/routes/company.js`, `server/routes/admin.js`
- Controllers: `server/controllers/invoicesController.js`, `server/controllers/companyController.js`, `server/controllers/adminController.js`
- Models: `server/models/Invoice.js`, `server/models/Company.js`, `server/models/Admin.js`
- Env: `server/config.env`

Technologie-Stack
- Node.js, Express, MongoDB (Mongoose)
- JWT für Auth, `bcryptjs` für Passwort‑Hashing

Datenbank
- Standardmäßig zeigt `MONGODB_URI` in `server/config.env` auf die Datenbank `invoices`. Passe diese URI an deine Umgebung an, falls nötig.

Wichtige Endpunkte (Kurz)
- `GET /api/invoices` — Liste aller Rechnungen
- `GET /api/invoices/:id` — Einzelne Rechnung
- `POST /api/invoices` — Neue Rechnung erstellen
- `PUT /api/invoices/:id` — Rechnung aktualisieren
- `DELETE /api/invoices/:id` — Rechnung löschen
- `GET /api/company` — Firmeninfo lesen
- `PUT /api/company` — Firmeninfo aktualisieren
- `POST /api/admin/login` — Admin Login
- `POST /api/admin/change-credentials` — Admin: Benutzer/Passwort ändern (benötigt JWT)

Admin anlegen (lokal)
- Ein Skript zum Anlegen eines initialen Admin-Benutzers ist vorhanden:

```powershell
cd server
node scripts/createAdmin.js
```

- Zur Kontrolle vorhandener Admins:

```powershell
node scripts/checkAdmin.js
```

Run & Deploy
- Install: `npm install` (im `server`-Ordner)
- Dev: `npm run dev` (falls `nodemon` konfiguriert ist)
- Prod: `npm start`
- Env: setze `MONGODB_URI` und `JWT_SECRET` in `server/config.env` oder als Umgebungsvariablen


Fehlerbehebung & Hinweise
- Beim Start gibt `node server.js` Informationen zur DB‑Verbindung und dem Port aus. Falls Verbindungsfehler auftreten, prüfe `MONGODB_URI` in `server/config.env`.
