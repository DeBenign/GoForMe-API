# GoForMe Customer Web App

Consumer-facing web app for placing and tracking errands — React + Vite + Tailwind v4, built directly against `GoForMe-API` routes/controllers/models. Mobile-first single-column layout.

## Flow

Register → OTP verify (SMS-based, 6-digit, 10 min expiry) → Login → Home (wallet + active errands) → New Errand → live tracking + in-order chat → Wallet top-ups via Paystack → Report a problem (disputes) on completed/cancelled errands.

## Backend routes used

| Feature | Routes |
|---|---|
| Auth | `POST /auth/register`, `/verify-otp`, `/resend-otp`, `/login`, `/logout`, `/refresh-token` |
| Home / wallet | `GET /wallet/me` |
| Create errand | `POST /orders` |
| Errand list/detail | `GET /orders`, `GET /orders/:id` |
| Cancel | `PATCH /orders/:id/cancel` |
| Runner card | `GET /runners/:id` |
| Chat | `GET /chat/:orderId`, Socket.IO `chat:send` / `chat:receive` |
| Live tracking | Socket.IO `order:join`, `order:locationUpdate`, `order:update` |
| Wallet top-up | `POST /wallet/fund` (redirects to Paystack), `GET /wallet/verify?reference=` |
| Disputes | `POST /disputes`, `GET /disputes` |
| Profile | `PATCH /users/:id` |

## Backend quirks — fixed in this update

These were bugs in `GoForMe-API` at the time this app was first built, and have since been fixed there:

- **`POST /orders` now saves `title` and `category`.** `createOrder` previously never read them from the request body even though the `Order` model has both fields — fixed in `controllers/order.controller.js`. This form now includes a title field and category chips.
- **Chat messages are now actually persisted.** The Socket.IO `chat:send` handler in `config/socket.js` previously broadcast an in-memory object that didn't match the `Message` schema and never saved to the database — chat history looked empty on reload. Fixed to create a real `Message` document and broadcast that.
- **Wallet top-ups now redirect back to this app.** `initializePayment` didn't set a Paystack `callback_url`, so after paying, Paystack redirected to its own generic success page instead of back here. Fixed — set `CUSTOMER_APP_URL` in the API's `.env` to this app's deployed origin (e.g. `https://goforme.vercel.app`), and Paystack will redirect to `{CUSTOMER_APP_URL}/wallet?reference=...`.
- **CORS is now locked down.** `server.js` used to accept requests from any origin. Set `ALLOWED_ORIGINS` in the API's `.env` to a comma-separated list that includes this app's deployed URL, or requests will be blocked in production.

## Still worth knowing

- **Chat is only allowed via REST while an order is `accepted` or `in_progress`** (`chat.controller.js`), but the Socket.IO `chat:send` path has no such check. This app sends exclusively over the socket, matching what's actually enforced end-to-end.
- **Wallet funding is a two-step redirect flow**: `POST /wallet/fund` returns a Paystack `authorization_url`; after payment, Paystack redirects back with `?reference=` (now pointed at `/wallet` — see above), which the Wallet page picks up and passes to `GET /wallet/verify`.

## Setup

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your deployed API
npm run dev
```

`VITE_API_BASE_URL` must include the `/api/v1` prefix. Socket.IO connects to the same host minus that prefix (handled automatically in `src/lib/socket.js`).

## Build & deploy

```bash
npm run build   # outputs to dist/
```

Static bundle — deploy to Vercel/Netlify. Set `VITE_API_BASE_URL` as a build-time environment variable in the hosting provider's dashboard.

## Design notes

Where the admin console is a dark "dispatch" control room, this is a warm consumer app — errand cards are styled as perforated paper tickets (`.ticket-edge` in `index.css`), echoing the hand-written errand notes people give house help or okada riders. Sora for display type, Inter for body, JetBrains Mono for amounts/references. Deep green-black base with a marigold accent, distinct from the admin dashboard's neutral charcoal/amber pairing while staying in the same brand family.
