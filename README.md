# Sankofa Express Courier Management System

Final-year project courier management platform built with Next.js 16 App Router, TypeScript, Prisma, PostgreSQL, and Tailwind CSS.

## Features

- JWT-style HTTP-only cookie authentication with role-aware proxy protection.
- Dashboard with shipment, COD, rider, support, chart, trend, and recent-order metrics.
- Order management with waybills, tracking codes, address creation, rider assignment, and tracking events.
- Clients, riders, dispatch manifests, finance entries, payments, image orders, support tickets, rewards, reports, profile, and settings pages.
- Custom UI component library in `src/components/ui`.
- Prisma-backed API routes under `src/app/api`.
- Firebase/FCM, Paystack, email, SMS, and socket integration points with safe local stubs.

## Local Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET`.
2. Run Prisma:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

3. Start the app:

```bash
npm run dev -- --webpack
```

Turbopack may hit OS file-watch limits on some machines; webpack dev mode avoids that.

## Seeded Login

- Email: `admin@sankofaexpress.com`
- Password: `Admin@2026`

## Verification

```bash
npm run lint
npm run build
```

Both commands pass in the rebuilt codebase.
