# Shiva Dental Clinic

Clinic operations dashboard built with Next.js, Tailwind CSS, Prisma, and PostgreSQL.

## Setup

1. Copy `.env.example` to `.env` and configure a Neon PostgreSQL database.
2. Run `npx prisma migrate dev --name init`.
3. Start the application with `npm run dev`.

## Security and operations

- Keep database URLs, auth secrets, and bootstrap credentials in Vercel environment variables.
- Retain `AuditEvent` records; do not update or delete them through application flows.
- Verify Neon backup and point-in-time recovery before production launch; test a restore in a separate database.
