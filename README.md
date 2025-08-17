@"
# CharmOps

Monorepo: Next.js (App Router, TS, Tailwind), Drizzle ORM, Postgres.
- Auth: next-auth (credentials, JWT)
- Roles: super_admin / admin / operator
- UI shell: Topbar + Sidebar (role-aware)
- Invitations: create/revoke, accept via token

## Dev
1) docker compose up -d   # Postgres
2) cd apps/web && pnpm dev
"@ | Out-File -Encoding UTF8 .\README.md
