# 🏃 GoForMe API

> **Your personal errand runner, on demand.**
> Too busy? We'll run it for you.

GoForMe is an on-demand errand platform that connects busy customers with nearby verified runners who handle errands — from grocery runs and pharmacy pickups to office deliveries and bank queues.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js v18+ |
| Framework | Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT + bcrypt |
| Real-time | Socket.IO |
| Payments | Paystack |
| SMS | Twilio |
| Email | Nodemailer (Gmail SMTP) |
| Queue | BullMQ + Redis |
| File Storage | Cloudinary |

---

## 📁 Project Structure

```
GoForMe/
├── config/
│   ├── db.js               # MongoDB connection
│   ├── paystack.js         # Paystack axios instance
│   └── socket.js           # Socket.IO setup + auth middleware
├── controllers/
│   ├── auth.controller.js  # Register, login, OTP, logout
│   ├── user.controller.js  # User CRUD
│   ├── runner.controller.js# Runner profile, availability, location
│   ├── order.controller.js # Order lifecycle
│   ├── wallet.controller.js# Wallet funding + balance
│   ├── payment.controller.js# Paystack integration
│   └── admin.controller.js # Admin dashboard controls
├── middleware/
│   ├── auth.middleware.js  # JWT protect guard
│   ├── admin.middleware.js # Admin-only guard
│   ├── role.middleware.js  # Role-based access control
│   └── runner.middleware.js# Approved runner guard
├── models/
│   ├── User.js             # User schema
│   ├── Runner.js           # Runner profile schema
│   ├── Order.js            # Order schema
│   ├── Wallet.js           # Wallet schema
│   ├── Payment.js          # Payment record schema
│   ├── Message.js          # Chat message schema
│   └── Notification.js     # Notification log schema
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── runner.routes.js
│   ├── order.routes.js
│   ├── wallet.routes.js
│   ├── payment.routes.js
│   └── admin.routes.js
├── services/
│   ├── matching.service.js # Smart runner matching engine
│   ├── notification.service.js # SMS, email, push
│   ├── payment.service.js  # Paystack helpers
│   └── order.service.js    # Order assignment helper
├── sockets/
│   ├── chat.socket.js      # Real-time chat
│   └── order.socket.js     # Order status broadcasts
├── jobs/
│   ├── push.job.js         # Firebase push job
│   └── notification.worker.js # BullMQ worker
├── utils/
│   ├── jwt.js              # Token generation + verification
│   └── distance.js         # Haversine distance calculator
├── .env.example
├── server.js
└── README.md
```

---

## ⚡ Quick Start

```bash
# 1. Clone the project
git clone https://github.com/yourname/goformebe.git
cd goformebe

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your values (see Environment Variables section below)

# 4. Start development server
npm run dev

# 5. Confirm server is running
GET http://localhost:5000/
# → { "status": "GoForMe API Running" }
```

---

## 🔐 Environment Variables

Create a `.env` file in the root with these values:

```dotenv
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/goforme

# JWT
JWT_SECRET=your_jwt_secret_key

# Paystack
PAYSTACK_SECRET=sk_test_xxxxxxxxxxxxxx

# Twilio (SMS)
TWILIO_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE=+1234567890

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

# Redis (for BullMQ)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

## 🌐 Base URL

```
http://localhost:5000/api/v1
```

Set this as `{{BASE_URL}}` in your Postman environment.

---

---

# 👤 CUSTOMER JOURNEY

> A customer registers, funds their wallet, and posts an errand for a runner to fulfil.

---

## STEP 1 — Register

```
POST {{BASE_URL}}/auth/register
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@mail.com",
  "phone": "+2348012345678",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created. Please verify your OTP.",
  "userId": "64abc123..."
}
```

> An OTP is sent to your phone via SMS. Check your phone.

---

## STEP 2 — Verify OTP

```
POST {{BASE_URL}}/auth/verify-otp
```

**Body:**
```json
{
  "email": "john@mail.com",
  "otp": "482910"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account verified. You can now log in."
}
```

---

## STEP 2b — Resend OTP (if expired)

```
POST {{BASE_URL}}/auth/resend-otp
```

**Body:**
```json
{
  "email": "john@mail.com"
}
```

> A fresh OTP is sent. Valid for 10 minutes.

---

## STEP 3 — Login

```
POST {{BASE_URL}}/auth/login
```

**Body:**
```json
{
  "email": "john@mail.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGci...",
  "refreshToken": "uuid-v4-token",
  "user": { ... }
}
```

> **Save the `accessToken`** — add it to every protected request as:
> `Authorization: Bearer <accessToken>`

---

## STEP 4 — Fund Wallet

> Minimum ₦100 required before placing any order.

```
POST {{BASE_URL}}/wallet/fund
Authorization: Bearer <accessToken>
```

**Body:**
```json
{
  "amount": 500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authorization_url": "https://checkout.paystack.com/xxxx",
    "reference": "GFM-XXXXX"
  }
}
```

> Open the `authorization_url` in your browser to complete payment via Paystack.

---

## STEP 5 — Verify Wallet Funding

```
GET {{BASE_URL}}/wallet/verify?reference=GFM-XXXXX
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet funded successfully",
  "balance": 500
}
```

---

## STEP 6 — Check Wallet Balance

```
GET {{BASE_URL}}/wallet/me
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 500,
    "user_id": "64abc123..."
  }
}
```

---

## STEP 7 — Create an Order

> Wallet must have at least ₦100 AND enough to cover the order price.
> Order price is automatically deducted from wallet.

```
POST {{BASE_URL}}/orders
Authorization: Bearer <accessToken>
```

**Body:**
```json
{
  "description": "Buy 2 loaves of bread and a bottle of Milo from the market",
  "price": 300,
  "pickup_location": {
    "lat": 6.5244,
    "lng": 3.3792,
    "address": "Balogun Market, Lagos"
  },
  "dropoff_location": {
    "lat": 6.5355,
    "lng": 3.3087,
    "address": "12 Admiralty Way, Lekki"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created and runner matched",
  "data": { "status": "accepted", ... },
  "walletBalance": 200
}
```

> The matching engine finds the nearest available runner automatically.
> If no runner is found, status stays `"pending"`.

---

## STEP 8 — Track Your Order

```
GET {{BASE_URL}}/orders/:orderId
Authorization: Bearer <accessToken>
```

> Listen on Socket.IO for live updates:
> - `order:locationUpdate` — runner's live GPS position
> - `orderStarted` — runner picked up the errand
> - `orderCompleted` — errand delivered

---

## STEP 9 — View All Your Orders

```
GET {{BASE_URL}}/orders
Authorization: Bearer <accessToken>
```

---

## STEP 10 — Cancel an Order

> Only possible if status is `pending` or `accepted`.

```
PATCH {{BASE_URL}}/orders/:orderId/cancel
Authorization: Bearer <accessToken>
```

---

## STEP 11 — Logout

```
POST {{BASE_URL}}/auth/logout
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

---

# 🏃 RUNNER JOURNEY

> A runner registers, gets approved by admin, goes online, and fulfils orders.

---

## STEP 1 — Register (same as customer)

```
POST {{BASE_URL}}/auth/register
```

Use the same register → verify OTP → login flow as the customer.

---

## STEP 2 — Login + Get Token

```
POST {{BASE_URL}}/auth/login
```

Save your `accessToken`.

---

## STEP 3 — Apply as a Runner

```
POST {{BASE_URL}}/runners
Authorization: Bearer <accessToken>
```

**Body:**
```json
{
  "user_id": "64abc123...",
  "skills": ["grocery", "pharmacy", "delivery"],
  "location": {
    "lat": 6.5244,
    "lng": 3.3792
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Runner application submitted. Awaiting admin approval.",
  "data": { "status": "pending", ... }
}
```

> Your account is now `pending`. Wait for admin approval before continuing.

---

## STEP 4 — Wait for Admin Approval

> Admin approves your application (see Admin section).
> You will receive an SMS notification when approved.

---

## STEP 5 — Go Online (Toggle Availability)

> Only approved runners can go online.

```
PATCH {{BASE_URL}}/runners/toggle-availability
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "Runner is now ONLINE 🟢"
}
```

> Call this endpoint again to go **OFFLINE 🔴**.

---

## STEP 6 — Update Your Location

> Keep sending your GPS coordinates so the matching engine can find you.
> In production this is handled via Socket.IO automatically.
> Use this REST fallback if socket fails.

```
PATCH {{BASE_URL}}/runners/location
Authorization: Bearer <accessToken>
```

**Body:**
```json
{
  "lat": 6.5244,
  "lng": 3.3792
}
```

---

## STEP 7 — Receive a New Order

> When a customer creates an order, the matching engine finds you automatically.
> You receive a Socket.IO event `newOrder` on your personal room `user_<your_id>`.

Listen via Socket.IO:
```js
socket.on("newOrder", (data) => {
  console.log("New order assigned:", data.order)
})
```

---

## STEP 8 — Accept the Order

```
PATCH {{BASE_URL}}/orders/:orderId/accept
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": { "status": "accepted", ... }
}
```

---

## STEP 9 — Start the Order (picked up errand)

```
PATCH {{BASE_URL}}/orders/:orderId/start
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": { "status": "in_progress", ... }
}
```

> Customer receives Socket.IO event `orderStarted`.

---

## STEP 10 — Send Live Location Updates

> Broadcast your GPS to the customer's map in real time via Socket.IO:

```js
socket.emit("runner:updateLocation", {
  orderId: "64abc123...",
  lat: 6.5300,
  lng: 3.3800
})
```

> Customer receives `order:locationUpdate` event with your coordinates.

---

## STEP 11 — Complete the Order

```
PATCH {{BASE_URL}}/orders/:orderId/complete
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "Order completed",
  "data": { "status": "completed", ... }
}
```

> Your earnings are automatically credited:
> `runner.totalEarnings += order.price`
> `runner.completedJobs += 1`
> You are set back to `isAvailable: true` automatically.

---

## STEP 12 — View Your Runner Profile + Stats

```
GET {{BASE_URL}}/runners/me
Authorization: Bearer <accessToken>
```

---

---

# 🛡️ ADMIN JOURNEY

> Admin manages users, approves runners, monitors orders, and resolves issues.

---

## STEP 1 — Login as Admin

```
POST {{BASE_URL}}/auth/login
```

**Body:**
```json
{
  "email": "admin@gofor.me",
  "password": "adminpassword"
}
```

> Admin accounts are created directly in the database with `role: "admin"`.
> Save your `accessToken`.

---

## STEP 2 — View All Users

```
GET {{BASE_URL}}/admin/users
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "count": 42,
  "data": [ { "name": "John Doe", "role": "customer", ... } ]
}
```

---

## STEP 3 — View All Orders

```
GET {{BASE_URL}}/admin/orders
Authorization: Bearer <accessToken>
```

> See every order on the platform with full customer and runner details.

---

## STEP 4 — Approve a Runner ✅

> This is required before a runner can go online and accept orders.

```
PATCH {{BASE_URL}}/admin/runners/:runnerId/approve
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "Runner approved successfully",
  "data": { "status": "approved", "isAvailable": true, ... }
}
```

---

## STEP 5 — Reject a Runner ❌

```
PATCH {{BASE_URL}}/admin/runners/:runnerId/reject
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "Runner rejected"
}
```

> Runner's user role is reverted back to `"customer"` automatically.

---

## STEP 6 — Override an Order (edit any field)

```
PATCH {{BASE_URL}}/admin/orders/:orderId/override
Authorization: Bearer <accessToken>
```

**Body (example — force complete a stuck order):**
```json
{
  "status": "completed"
}
```

---

## STEP 7 — View All Wallets

```
GET {{BASE_URL}}/wallet
Authorization: Bearer <accessToken>
```

---

## STEP 8 — View a Single Wallet

```
GET {{BASE_URL}}/wallet/:walletId
Authorization: Bearer <accessToken>
```

---

---

# 💬 REAL-TIME EVENTS (Socket.IO)

Connect with your JWT token:

```js
const socket = io("http://localhost:5000", {
  auth: { token: "<accessToken>" }
})
```

---

### Events — Client Sends

| Event | Payload | Description |
|-------|---------|-------------|
| `order:join` | `{ orderId }` | Join an order room to receive updates |
| `runner:updateLocation` | `{ orderId, lat, lng }` | Runner sends live GPS |
| `chat:send` | `{ orderId, content, receiverId }` | Send a chat message |

### Events — Server Sends

| Event | Who Receives | Description |
|-------|-------------|-------------|
| `newOrder` | Runner | New order assigned |
| `order:locationUpdate` | Customer | Runner's live GPS position |
| `orderStarted` | Customer | Runner picked up the errand |
| `orderCompleted` | Customer | Errand delivered |
| `order:update` | Order room | General order status change |
| `chat:receive` | Order room | New chat message |
| `notification` | User | Personal notification |

---

# 📋 QUICK ENDPOINT REFERENCE

## Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new account |
| POST | `/auth/verify-otp` | ❌ | Verify phone OTP |
| POST | `/auth/resend-otp` | ❌ | Resend OTP |
| POST | `/auth/login` | ❌ | Login → get tokens |
| POST | `/auth/refresh` | ❌ | Refresh access token |
| POST | `/auth/logout` | ✅ | Logout |

## Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | ✅ Admin | Get all users |
| GET | `/users/:id` | ✅ | Get single user |
| PATCH | `/users/:id` | ✅ | Update user |
| DELETE | `/users/:id` | ✅ Admin | Delete user |

## Runners
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/runners` | ✅ | Apply as runner |
| GET | `/runners` | ✅ | Get all runners |
| GET | `/runners/:id` | ✅ | Get single runner |
| PATCH | `/runners/toggle-availability` | ✅ Runner | Go online/offline |
| PATCH | `/runners/location` | ✅ Runner | Update GPS location |
| PATCH | `/runners/:id` | ✅ Admin | Update runner profile |
| PATCH | `/runners/:id/availability` | ✅ Admin | Set availability |
| DELETE | `/runners/:id` | ✅ Admin | Delete runner |

## Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders` | ✅ Customer | Create order |
| GET | `/orders` | ✅ | Get my orders |
| GET | `/orders/:id` | ✅ | Get single order |
| PATCH | `/orders/:id/accept` | ✅ Runner | Accept order |
| PATCH | `/orders/:id/start` | ✅ Runner | Start order |
| PATCH | `/orders/:id/complete` | ✅ Runner | Complete order |
| PATCH | `/orders/:id/cancel` | ✅ | Cancel order |

## Wallet
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/wallet/me` | ✅ | Get my wallet |
| POST | `/wallet/fund` | ✅ | Initialize funding |
| GET | `/wallet/verify` | ✅ | Verify funding |
| GET | `/wallet` | ✅ Admin | Get all wallets |
| GET | `/wallet/:id` | ✅ Admin | Get single wallet |

## Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/initialize` | ✅ | Init payment |
| GET | `/payments/verify/:ref` | ✅ | Verify payment |
| POST | `/payments/webhook` | ❌ | Paystack webhook |

## Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/users` | ✅ Admin | All users |
| GET | `/admin/orders` | ✅ Admin | All orders |
| PATCH | `/admin/orders/:id/override` | ✅ Admin | Edit any order |
| PATCH | `/admin/runners/:id/approve` | ✅ Admin | Approve runner |
| PATCH | `/admin/runners/:id/reject` | ✅ Admin | Reject runner |

---

# 🔄 Complete Flow Summary

```
CUSTOMER                    PLATFORM                      RUNNER
────────                    ────────                      ──────
Register          →         Create account
Verify OTP        →         Mark isVerified: true
Login             →         Return JWT token
Fund Wallet       →         Paystack → credit balance
Create Order      →         Deduct from wallet
                  →         Run matching engine   →       Notify runner (socket)
                                                  ←       Accept order
Track on map      ←         Broadcast location    ←       Send GPS updates
                  ←         orderStarted event    ←       Start order
Errand delivered  ←         orderCompleted event  ←       Complete order
                  →         Credit runner earnings
                  →         Runner goes back online
```

---

## 🚀 What's Next (Roadmap)

| Week | Feature |
|------|---------|
| ✅ 3 | Auth layer — register, OTP, login, JWT |
| ✅ 4 | Core models, user + runner controllers |
| ✅ 5 | Errand engine, matching algorithm, Paystack |
| 🔜 6 | Chat history API, dispute system |
| 🔜 7 | Runner payout transfers |
| 🔜 8 | Firebase push notifications, mobile app |

---

**GoForMe API v1.0** — Built with ❤️ on Node.js + MongoDB