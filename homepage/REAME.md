# GoForMe Homepage

Public marketing site for GoForMe — React + Vite + Tailwind v4, matching the
visual identity (colors, type, ticket motif) of the customer/runner/admin
apps. Static only: no API calls, no auth, no backend dependency.

## What it does

Single scrolling page: hero (styled as a giant errand ticket — the same
paper-stub motif used for real orders in the other apps), how it works,
categories served, a transparent pricing example, about, and contact. The
header and footer link out to each app's login page.

## Login links

Configured in `.env` (see `.env.example`):

```
VITE_CUSTOMER_APP_URL=http://localhost:5174
VITE_RUNNER_APP_URL=http://localhost:5175
VITE_ADMIN_APP_URL=http://localhost:5173
```

Defaults match local dev. Set these to your deployed URLs
(e.g. `https://goforme-customer.vercel.app`) before deploying this site.

## Before deploying

`src/components/Contact.jsx` has placeholder email/phone/city — swap in the
real contact details.

## Local dev

```
npm install
npm run dev   # → http://localhost:5176
```