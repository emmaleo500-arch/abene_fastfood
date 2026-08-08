# Sarvoraa Backend

Node.js / Express / MongoDB backend for the Sarvoraa fastfood website.  
Handles orders, contact messages, admin authentication, and email notifications.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Database | MongoDB (Mongoose) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Email | Nodemailer (Gmail SMTP) |
| Validation | express-validator |

---

## Project Structure

```
backend/
├── admin/              # Admin dashboard (static HTML — served at /admin)
│   └── index.html
├── config/
│   ├── db.js           # Mongoose connection
│   └── mailer.js       # Nodemailer transporter
├── middleware/
│   └── auth.js         # JWT protect + adminOnly guards
├── models/
│   ├── Order.js        # Order schema
│   ├── User.js         # Admin user schema (bcrypt hashed password)
│   └── ContactMessage.js
├── routes/
│   ├── auth.js         # POST /api/auth/login, GET /api/auth/me
│   ├── orders.js       # CRUD /api/orders
│   ├── contact.js      # CRUD /api/contact
│   └── stats.js        # GET /api/stats (dashboard summary)
├── utils/
│   └── seedAdmin.js    # Seeds first admin on startup
├── .env                # ← your secrets (never commit this)
├── .env.example        # Template
├── package.json
└── server.js           # Entry point
```

---

## Quick Start

### 1. MongoDB Atlas (free tier)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free account.
2. Create a new **Shared** cluster (M0 — free forever).
3. Under **Database Access** → Add a database user (username + password).
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all) for development.
5. Click **Connect** → **Connect your application** → copy the connection string.
6. Paste it into `.env` as `MONGO_URI`, replacing `<user>` and `<password>`.

### 2. Gmail App Password (for email)

1. Enable 2-Factor Authentication on your Google account.
2. Go to **Google Account → Security → App Passwords**.
3. Generate a password for "Mail / Windows Computer".
4. Copy the 16-character password into `.env` as `MAIL_PASS`.
5. Set `MAIL_USER` to your Gmail address.

### 3. Fill in .env

Open `backend/.env` and replace every placeholder:

```env
MONGO_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/sarvoraa
JWT_SECRET=paste_a_long_random_string_here
PORT=5000
CLIENT_ORIGIN=http://127.0.0.1:5500

ADMIN_EMAIL=admin@sarvoraa.com
ADMIN_PASSWORD=Admin@1234

MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=your_gmail@gmail.com
MAIL_PASS=your_16_char_app_password
MAIL_FROM="Sarvoraa" <your_gmail@gmail.com>
ADMIN_NOTIFY_EMAIL=your_gmail@gmail.com
```

> Generate a secure JWT secret:
> ```
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Install dependencies

```bash
cd backend
npm install
```

### 5. Start the server

```bash
# Development (auto-restarts on file change)
npm run dev

# Production
npm start
```

Server runs at **http://localhost:5000**

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login with email + password → returns JWT |
| GET | `/api/auth/me` | Admin | Returns current admin info |

**Login body:**
```json
{ "email": "admin@sarvoraa.com", "password": "Admin@1234" }
```

---

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | Public | Customer places an order |
| GET | `/api/orders` | Admin | List all orders (filter by `?status=pending`) |
| GET | `/api/orders/:id` | Admin | Get single order detail |
| PATCH | `/api/orders/:id/status` | Admin | Update order status |
| DELETE | `/api/orders/:id` | Admin | Delete an order |

**POST /api/orders body:**
```json
{
  "customerName": "Ama Kusi",
  "customerPhone": "+233201240546",
  "deliveryAddress": "KTU Campus, Koforidua",
  "items": [
    { "id": "jollof-rice", "name": "Jollof Rice", "price": 14000, "qty": 2, "image": "image/..." }
  ],
  "subtotal": 28000,
  "deliveryFee": 2000,
  "total": 30000
}
```

**Order statuses:**  
`pending` → `confirmed` → `preparing` → `out_for_delivery` → `delivered` | `cancelled`

---

### Contact Messages

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/contact` | Public | Customer sends a message |
| GET | `/api/contact` | Admin | List all messages |
| PATCH | `/api/contact/:id/read` | Admin | Mark message as read |
| DELETE | `/api/contact/:id` | Admin | Delete a message |

**POST /api/contact body:**
```json
{
  "name": "Kofi Boateng",
  "email": "kofi@example.com",
  "subject": "Bulk order",
  "message": "I'd like to place a catering order for 50 people."
}
```

---

### Stats (Dashboard)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/stats` | Admin | Returns order counts, revenue, unread messages + 5 recent orders |

---

### Health Check

```
GET /api/health
→ { "success": true, "message": "Sarvoraa API is running 🚀" }
```

---

## Admin Dashboard

Once the server is running, open:

```
http://localhost:5000/admin
```

Login with the credentials set in `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).  
The default is `admin@sarvoraa.com` / `Admin@1234` — **change the password after first login.**

### Dashboard features
- **Dashboard tab** — live stats (total orders, pending, delivered, revenue, unread messages) + recent orders table
- **Orders tab** — full order list, filter by status, update status inline, click any order for full detail modal
- **Messages tab** — all contact messages, mark as read, delete, "New" badge for unread

---

## Frontend Integration

The frontend connects to the backend at `http://localhost:5000`.

| Frontend page | API call |
|---|---|
| `order.html` | `POST /api/orders` — submits the cart as an order |
| `contact.html` | `POST /api/contact` — submits the contact form |

Both pages show toast notifications on success or failure.  
On successful order, the cart is cleared and the admin receives an email immediately.

---

## Email Notifications

Every new order and contact message triggers two emails:

| Event | Recipient | Content |
|---|---|---|
| New order | Admin (`ADMIN_NOTIFY_EMAIL`) | Full order details + link to admin dashboard |
| New contact | Admin (`ADMIN_NOTIFY_EMAIL`) | Sender info + full message |
| New contact | Customer (their email) | Confirmation that message was received |

---

## Deployment (quick reference)

1. Push code to GitHub (**never push `.env`** — it is in `.gitignore`).
2. Deploy to [Railway](https://railway.app) or [Render](https://render.com) — both have free tiers.
3. Set all `.env` variables as environment variables in the dashboard.
4. Update `CLIENT_ORIGIN` to your live frontend URL.
5. Update the `API` constant in `order.html`, `contact.html`, and `backend/admin/index.html` from `http://localhost:5000` to your live backend URL.
