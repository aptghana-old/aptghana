# Architecture

## Apps

```
apps/
  web/    aptghana.com          corporate website (marketing, brand storytelling)
  store/  store.aptghana.com    B2B/B2C commerce platform (catalogue, RFQ, accounts)
  admin/  admin.aptghana.com    internal operating system (CMS, RBAC, orders, customers)
```

All three are Next.js App Router apps managed as a Turborepo monorepo, composing from
the shared packages below rather than duplicating logic.

## Shared packages

```
packages/
  auth/       RBAC permission matrix + session/password helpers (hasPermission, requireXxx)
  config/     Single source of truth for domains, contact info, feature flags, env schema
  db/         Mongoose models + connection + cross-cutting data helpers (e.g. getSitePageData)
  documents/  PDF/export generation (quotes, invoices, reports)
  email/      Resend-backed transactional email sending
  odoo/       Odoo ERP sync
  payment/    Paystack integration
  search/     Meilisearch indexing + query helpers
  storage/    MinIO/S3-compatible object storage client
  types/      Shared TypeScript types, pure utilities (slugify), and zod validation schemas
  ui/         Cross-app content modules (FooterBase, BrandsPageContent) — see below
```

Each package exports through `src/index.ts` (or a sub-export like `@apt/ui/footer`) and
is consumed via the `@apt/*` workspace scope — no relative `../../packages/...` imports
across app boundaries.

## Why `@apt/ui` is scoped to content modules, not primitives

`@apt/ui` deliberately does **not** contain a shared `Button`/`Input`/`Card` primitive
library. Admin is an internal, density-optimized dashboard; web and store are public
marketing/commerce surfaces with a different visual language. Forcing one primitive
layer across both would mean either watering down admin's controls or over-engineering
web/store's. Instead, `@apt/ui` holds things that are genuinely the *same content* in
every app that uses them — `FooterBase` (column/contact/social config in, footer DOM
out) and `BrandsPageContent` (the brand directory, shared between web and store with
different surrounding chrome). The same principle now extends to legal/contact page
content (see Data flow below): the prose lives in one place, the chrome stays local.

## Data flow: legal & contact pages

`packages/db/src/sitePages.ts` exports `getSitePageData<T>(slug, fallback)`: it looks
up a published `SitePageModel` doc for `slug`, merges it field-by-field onto a typed
static `fallback`, and returns `fallback` unchanged if no doc exists or the DB is
unreachable. Every legal/contact page in both `apps/web` and `apps/store` calls this
with its own typed fallback (so each page never regresses to a blank screen) and its
own JSX/styling — only the prose comes from one editable source. Admin edits the
content through `apps/admin/app/api/site-pages/[slug]/route.ts`; both public apps pick
up the change on their next `revalidate` (1 hour).

## Data flow: validated API routes

`packages/types/src/validation/` holds zod schemas per domain (`customer.ts`,
`article.ts`, `category.ts`) plus a `parseBody<T>(schema, raw)` helper that returns
`{ ok: true, data } | { ok: false, error }`. Routes that have adopted this pattern
(customers create/update/bulk, articles create/update, categories create) call
`parseBody` once at the top and return a `422` with `parsed.error` on failure — instead
of a chain of hand-rolled `if (!field) return ...` checks. **This is the pattern for
all new routes**; the ~25 routes not yet converted keep their existing hand-rolled
checks until migrated (see `REFACTOR_REPORT.md` for the explicit list).

## Env config pattern

`packages/config/src/env.ts` exports a zod-validated `getEnv()` that lazily parses and
caches `process.env` against a schema covering the variables already read directly
elsewhere (`MONGODB_URI`, `MEILISEARCH_*`, `RESEND_API_KEY`, `PAYSTACK_SECRET_KEY`,
`ODOO_*`, `STORAGE_*`, `UPSTASH_REDIS_*`). This is additive: existing direct
`process.env.X` reads in `packages/db`, `packages/email`, etc. are untouched. New code
should call `getEnv()` instead of reading `process.env` directly.

## Feature flags

`packages/config/src/flags.ts` exports a typed `FEATURE_FLAGS` object and an
`isEnabled(flag)` helper. There was no flag mechanism before this; it's a minimal,
additive starting point for the next flag instead of an inline `if (true)`.

## RBAC

Centralized in `packages/auth/src/permissions.ts` (4 roles: `super_admin`, `manager`,
`sales`, `account`). Route-level enforcement via `requirePermission()` /
`requireAdmin()` wrappers in `apps/admin/lib/auth/require.ts`, action-level enforcement
via `hasPermission(role, overrides, action)` in UI code. No duplicate matrices exist in
store or web — this was verified, not assumed, during the audit behind this pass.
