# Smart Solar Microgrid — Web Application (Stage 1)

React + Vite + Tailwind CSS frontend for the Backoffice and Grid Operator roles.

## Pages

- `/` — landing page (redirects to a dashboard if already logged in)
- `/login` — login form
- `/create-account` — Backoffice-only account creation form
- `/dashboard/backoffice` — Backoffice dashboard shell
- `/dashboard/operator` — Grid Operator dashboard shell

## Setup

```bash
npm install
cp .env.example .env   # adjust VITE_API_BASE if the backend runs on a different port
npm run dev
```

The dev server prints a local URL (typically `http://localhost:5173`).

## Configuration

`VITE_API_BASE` (see `.env.example`) points at the backend API, e.g. `http://localhost:5151/api`.

## Default seed login

- Email: `admin@smartsolar.com`
- Password: `Admin@123`
- Role: `Backoffice`
