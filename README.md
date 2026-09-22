# Smart Solar Microgrid Trading System — Web Application

React, Vite, and Tailwind CSS web portal for the Backoffice and Grid Operator roles. It connects to the separate Smart Solar Microgrid Web Service API. Prosumers use the mobile app.

## What the web portal does

| Role | Features |
| --- | --- |
| Backoffice | Dashboard KPIs and approval queue; prosumer approval and lifecycle management; station map, location, schedule, and slot management; reservation management and booking history; user accounts and operator station assignment; reports. |
| Grid Operator | Assigned-station overview, transfer monitor and pending approvals, station-scoped slot updates, completed transaction history, and a read-only station view with map. |
| Prosumer | Uses the mobile app for station discovery and bookings. Prosumer login is refused by this web portal. |

The API owns authentication, station assignment, reservation rules, availability, and lifecycle decisions. The web client displays API data and errors. Grid Operators cannot reach Backoffice management routes.

## Requirements

- Node.js and npm compatible with the versions in `package.json` and `package-lock.json`.
- The Smart Solar Microgrid Web Service backend and its MongoDB database, configured and running separately.
- Network access to OpenStreetMap tiles for station maps.

## Local setup

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

The Vite console prints the local web URL. Start the backend first, then open that URL and log in. The example configuration points to `http://localhost:5151/api`.

| Environment variable | Purpose | Example |
| --- | --- | --- |
| `VITE_API_BASE` | Base URL of the backend API, including `/api`. It is embedded in the browser build. | `http://localhost:5151/api` |

Change `.env` for a different backend address. Restart the dev server after changing it. Do not put secrets in `VITE_` variables because they are included in client assets.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Vite dev server. |
| `npm run lint` | Run ESLint. |
| `npm run build` | Create the production site in `dist/`. |
| `npm run preview` | Serve the production build locally for review. |

## Seeded login

The backend's default Backoffice seed account is `admin@smartsolar.com` with password `Admin@123`. Use that account only in a local development database. Backoffice creates Grid Operator accounts and assigns stations through User Management; there is no fixed operator login in this repository.

## Pages and roles

- `/` — public introduction and Login link; a signed-in user is redirected to their dashboard.
- `/login` — Backoffice and Grid Operator login.
- `/dashboard/backoffice` — Backoffice sections: Dashboard, Prosumer Management, Station Management, Slot Management, Reservation Management, User Management, Reports, and Booking History.
- `/dashboard/operator` — Grid Operator sections: Overview, Transfer Monitor, Update Slots, Transaction History, and Station View.
- `/create-account` — Backoffice-only account creation route.
- Other paths — application 404 page.

Map markers show active and deactivated stations differently. Station creation and editing use the same coordinate picker and schedule string expected by the API. The web map uses OpenStreetMap tiles through Leaflet, avoiding a browser billing key. The Android app requires Google Maps separately.

For operator behavior details, see [Operator Web Workflow](docs/OPERATOR_WEB_WORKFLOW.md). For screen capture filenames and captions, see [Screenshot Checklist](docs/screenshots/README.md).

## DEPLOYMENT

1. Configure a browser-reachable backend URL in `.env` using `VITE_API_BASE`. For an HTTPS website, use an HTTPS API URL as well. Configure the backend to allow the web origin.
2. Run `npm ci`, `npm run lint`, and `npm run build`.
3. Install IIS with the URL Rewrite module. Point the IIS site's physical path to the generated `dist/` directory, or copy the entire contents of `dist/` to that site root.
4. Keep `dist/web.config` with the built files. It rewrites routes that are not real files or directories to `index.html`, so direct navigation and refresh work with React Router. Existing assets continue to load normally.
5. Open `/login`, refresh `/dashboard/backoffice` after signing in, and open an unknown path to check the application 404 page.

`VITE_API_BASE` is fixed at build time. Rebuild the site after changing the production API URL. Deploy the backend separately; `web.config` only handles the web app's client-side routes.
