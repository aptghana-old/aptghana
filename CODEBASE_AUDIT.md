# Codebase Audit

Findings verified by direct inspection (grep/read), not taken on faith from any single
pass. Two independent audits were run; where they disagreed, the disagreement and the
verified resolution are recorded below rather than silently picking one.

## Confirmed issues (acted on — see REFACTOR_REPORT.md)

1. **`slugify()` duplicated 22 times**, byte-for-byte identical, across
   `apps/admin/app/api/{products,brands,resources,industries,categories,company,services}/**/route.ts`,
   `apps/admin/components/{products,resources,industries,brands,categories,services,company}/*Form.tsx`,
   and `apps/admin/lib/articleHelpers.ts`. (One audit pass undercounted this as 2;
   the real count, confirmed by `grep -rln "function slugify"`, was 22.)
2. **`@apt/storage` used in production code but never declared as a dependency** in
   `apps/admin/package.json` or `apps/store/package.json` — it only worked by accident
   of workspace hoisting + `transpilePackages`. Used by
   `apps/admin/app/api/assets/upload/route.ts` and
   `apps/store/app/api/rfq/attachments/route.ts`.
3. **Contact info / social links duplicated** between
   `apps/web/components/navigation/Footer.tsx` and
   `apps/store/components/navigation/StoreFooter.tsx` — identical LinkedIn/Twitter/
   YouTube URLs and phone number, each hand-typed separately.
4. **Legal/contact page content drift, not just code duplication**: `apps/web/app/
   {privacy,terms,contact}/page.tsx` already fetched from `SitePageModel` with a typed
   static fallback — a working CMS-backed pattern, admin-editable via
   `apps/admin/app/api/site-pages/[slug]/route.ts`. `apps/store/app/(store)/
   {privacy,terms,contact}/page.tsx` never called this model at all: fully hardcoded,
   shorter, and materially different in content (different office address, different
   phone number, different policy depth) from the web versions. A compliance-relevant
   inconsistency, not a style nit.
5. **No validation library anywhere** — confirmed zero `zod`/`yup`/`joi` in any
   `package.json` prior to this pass. All API routes hand-rolled
   `if (!field) return NextResponse.json(...)`.
6. **No centralized, schema-validated env config** — every package read
   `process.env.X` directly with ad hoc fallbacks.
7. **No feature-flag mechanism existed at all** — net-new gap, not something to
   consolidate.

## Investigated, no issue found

- **`CURRENCY_OPTIONS` duplication** — one audit pass flagged this as duplicated
  across product/category forms. Verified false by direct grep: it's defined exactly
  once, in `apps/admin/components/products/ProductForm.tsx`. No action taken.
- **RBAC duplication** — verified there is exactly one permission matrix
  (`packages/auth/src/permissions.ts`); no parallel/duplicate matrices in store or web.
- **`@apt/ui` brand/footer sharing** — already correctly shared between web and store
  (`FooterBase`, `BrandsPageContent`). Cited as evidence the content-module pattern
  works, not as something needing fixing.

## Explicitly not done in this pass (with reasons)

- **No shared `Button`/`Input`/`Card` library across web/store/admin.** Admin is an
  internal density-optimized dashboard; web/store are public marketing/commerce sites
  with a deliberately different visual language. Unifying primitives would degrade one
  side or the other. `@apt/ui` stays scoped to shared *content*, not shared *pixels*.
- **No collapsing of bulk-action status allow-lists into one shared enum.** E.g. the
  quotes-bulk endpoint only allows `cancelled`/`expired` (not the full quote status
  enum) because approval/payment transitions have dedicated workflows with side effects
  (audit logs, emails, order creation) that must never be reachable through a generic
  bulk-status endpoint. These lists look like duplication but encode different business
  rules.
- **Not migrating all ~25 remaining API routes to zod in this pass** — see
  REFACTOR_REPORT.md for the routes converted and the documented pattern for the rest.
- **No new pages built for `apps/store`** (e.g. a Resources/Industries equivalent) —
  out of scope for a de-duplication pass; would be net-new scope.
