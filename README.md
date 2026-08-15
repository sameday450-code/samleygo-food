# Food Delivery — Full-Stack NestJS + React Native Course

A full-stack food delivery application built from scratch with NestJS and Expo. This is the companion repository for the **SamTeck Digital**.


## What You'll Build

A complete food delivery platform with three roles — customers order food, restaurant owners manage menus and fulfill orders, and drivers deliver in real time.

**Customer**
- Browse open restaurants with search and ratings
- View menus, add items to cart, and place orders
- Pay with Stripe (Payment Sheet)
- Track order status live via WebSockets
- Watch the driver on a map during delivery (GPS + Redis)
- View order history and rate restaurant + driver after delivery

**Restaurant owner**
- Register and create one restaurant
- Upload images via Cloudinry
- Manage categories and menu items
- Receive and update orders (confirmed → preparing → ready)
- View today's analytics (revenue, status breakdown)

**Driver**
- Toggle online / offline
- Receive assigned orders via WebSocket
- Navigate active delivery with live GPS broadcasting
- Mark orders picked up and delivered
- View delivery history

**Backend**
- JWT auth with role-based guards (`CUSTOMER`, `RESTAURANT_OWNER`, `DRIVER`)
- Real-time order updates via Socket.IO
- Stripe webhooks for payment confirmation
- Upstash Redis for driver location + restaurant/menu caching
- Shared TypeScript types across API and mobile

---

## Stack

| Layer | Tool |
|---|---|
| Monorepo | pnpm workspaces |
| API | [NestJS](https://nestjs.com) |
| Mobile | [Expo](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/) |
| Database | [Neon](https://neon.tech) — serverless Postgres |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Cache / GPS | [Upstash Redis](https://upstash.com) |
| Payments | [Stripe](https://stripe.com) |
| Real-time | [Socket.IO](https://socket.io) |
| File uploads | [Cloudinary](https://cloudinary.com) |
| Shared types | `@samleygo-food/types` workspace package |
| Package manager | pnpm |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/sameday450-code/samleygo-food.git
cd samleygo-food
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Copy the example files and fill in your values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

See [API environment variables](#api-environment-variables) and [Mobile environment variables](#mobile-environment-variables) below.

### 4. Push the database schema

```bash
cd apps/api
pnpm db:push
```

### 5. Start the API

```bash
# from repo root
pnpm dev:api
```

API runs at [http://localhost:3000](http://localhost:3000) — routes are prefixed with `/api`.

### 6. Start the mobile app

```bash
# from repo root (iOS simulator)
pnpm dev:mobile

# or from apps/mobile
pnpm start
```

> **Maps & GPS:** Google Maps and background location require a **development build** (`npx expo run:ios` / `run:android`), not Expo Go.

> **Stripe webhooks (local):** Forward events with the [Stripe CLI](https://stripe.com/docs/stripe-cli):
> ```bash
> stripe listen --forward-to localhost:3000/api/payments/webhook
> ```
> Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET` in `apps/api/.env`.

---

## API environment variables

`apps/api/.env`:

```bash
# Neon — console.neon.tech → Connection string
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Auth — generate with: openssl rand -base64 32
JWT_SECRET=your-random-secret-here

# Stripe — dashboard.stripe.com → Developers → API keys
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Upstash Redis — console.upstash.com → REST API
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Coudinary — cloudinary.com → your dashboard → API Keys
CLOUDINARY_CLOUD_NAME=*********
CLOUDINARY_API_KEY=******************
CLOUDINARY_API_SECRET=****************************

# Optional
PORT=3000
```

---

## Mobile environment variables

`apps/mobile/.env`:

```bash
# NestJS API (include /api prefix)
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Socket.IO + UploadThing base (no /api suffix)
EXPO_PUBLIC_SERVER_URL=http://localhost:3000

# Stripe — publishable key (test mode)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Google Maps — Android maps in app.config.ts
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

> Use your machine's LAN IP instead of `localhost` when testing on a physical device, e.g. `http://192.168.1.10:3000/api`.

---

## Project Structure

```
food-delivery/
├── apps/
│   ├── api/                    # NestJS backend
│   │   └── src/
│   │       ├── auth/           # Register, login, JWT guards
│   │       ├── restaurants/    # Restaurant CRUD
│   │       ├── menu/           # Categories + menu items
│   │       ├── orders/         # Order flow + status transitions
│   │       ├── payments/       # Stripe intents + webhooks
│   │       ├── driver/         # Online status + assignment
│   │       ├── location/       # Driver GPS in Redis
│   │       ├── gateway/        # Socket.IO (orders namespace)
│   │       ├── reviews/        # Restaurant + driver ratings
│   │       ├── cache/          # Redis cache-aside (restaurants + menus)
│   │       ├── db/schema/      # Drizzle tables
│   │       └── uploadthing/    # Image upload router
│   └── mobile/                 # Expo React Native app
│       └── src/
│           ├── app/
│           │   ├── (customer)/ # Home, cart, orders, order tracking
│           │   ├── (owner)/    # Dashboard, menu, analytics
│           │   └── (driver)/   # Online toggle, active delivery
│           ├── components/
│           ├── context/        # Auth context
│           ├── hooks/          # WebSockets, debounce
│           └── lib/            # Axios, auth storage
└── packages/
    └── types/                  # Shared TypeScript interfaces
```

---

## Key Concepts Covered

- **pnpm monorepo** — shared types package consumed by API and mobile
- **NestJS modules** — feature-based architecture with guards and DTOs
- **Drizzle ORM** — type-safe schema against serverless Postgres
- **JWT + role guards** — protect routes by `CUSTOMER`, `RESTAURANT_OWNER`, `DRIVER`
- **Order state machine** — validated status transitions per role
- **Stripe Payment Sheet** — mobile payments + webhook confirmation
- **Socket.IO** — real-time order updates and driver assignment
- **Live GPS tracking** — driver broadcasts location, customer sees map
- **Redis cache-aside** — cache restaurant lists and menus with TTL + invalidation
- **Ratings & reviews** — post-delivery restaurant + driver scores
- **Expo Router** — file-based routing with role-protected stacks

---

## Scripts

```bash
# Root
pnpm dev              # API + mobile concurrently
pnpm dev:api          # NestJS watch mode
pnpm dev:mobile       # Expo (iOS)

# API (apps/api)
pnpm db:push          # Push Drizzle schema to Neon
pnpm db:studio        # Open Drizzle Studio
pnpm start:dev        # Dev server with hot reload
pnpm build            # Production build

# Mobile (apps/mobile)
pnpm start            # Expo dev server
pnpm ios              # Open iOS simulator
pnpm android          # Open Android emulator
```

---

Built with [NestJS](https://nestjs.com) · [Expo](https://expo.dev) · **Samley Technology Team**
