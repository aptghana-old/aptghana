# Refactor Report

Changelog for this pass. See `CODEBASE_AUDIT.md` for the findings this responds to and
`ARCHITECTURE.md` for the resulting patterns going forward.

## Stream A — Foundational fixes

- **`slugify()` centralized.** New canonical implementation at
  `packages/types/src/slugify.ts`, exported from `@apt/types`. All 22 duplicate
  definitions removed and replaced with `import { slugify } from "@apt/types"`
  (21 in `apps/admin/app/api/**/route.ts` and `apps/admin/components/**/*Form.tsx`,
  plus `apps/admin/lib/articleHelpers.ts`, which now re-exports it instead of defining
  its own copy).
- **`@apt/storage` dependency declared explicitly** in `apps/admin/package.json` and
  `apps/store/package.json` (was working only via workspace hoisting before).
- **Contact/social constants centralized**: new `packages/config/src/contact.ts`
  (`CONTACT_PHONE`, `CONTACT_PHONE_HREF`, `CONTACT_ADDRESS`, `CONTACT_MAPS_URL`,
  `SOCIAL_LINKS`). `apps/web/components/navigation/Footer.tsx` and
  `apps/store/components/navigation/StoreFooter.tsx` now both import from here instead
  of hand-typing the same values.
- **Feature flags**: new `packages/config/src/flags.ts` — `FEATURE_FLAGS` +
  `isEnabled()`. Net-new, additive.
- **Env config**: new `packages/config/src/env.ts` — zod-validated `getEnv()`,
  additive only; existing direct `process.env.X` reads elsewhere are unchanged.

## Stream B — Legal/contact page de-duplication

- New `packages/db/src/sitePages.ts` exports `getSitePageData<T>(slug, fallback)` —
  extracted from the fetch-with-fallback pattern that was duplicated inline across
  `apps/web/app/{privacy,terms,contact}/page.tsx`.
- `apps/web/app/{privacy,terms,contact}/page.tsx` now call the shared helper instead
  of their own inline `getData()` — same fallback data, same shape, no behavior change.
- `apps/store/app/(store)/{privacy,terms,contact}/page.tsx` were rewritten to also
  call `getSitePageData()` for the same three slugs. Store's existing hardcoded copy
  became the typed `fallback` argument (so nothing regresses if the admin hasn't
  published these slugs yet), and store's own layout/styling (`container-store`,
  card-based contact details, sidebar nav) was preserved — only the prose content is
  now shared with web through one admin-editable source.
  - As part of this, the store legal pages' phone number (previously
    `+233 30 212 3456`, which had drifted from the footer's `+233 30 396 4346`) now
    uses the same `CONTACT_PHONE` constant as the footer, resolving that inconsistency.

## Stream C — Validation layer, first batch

- `zod` added as a dependency of `packages/types` and `packages/config`.
- New `packages/types/src/validation/`: `helpers.ts` (`parseBody<T>`), `customer.ts`
  (`customerCreateSchema`, `customerUpdateSchema`, `customerBulkActionSchema`),
  `article.ts` (`articleCreateSchema`, `articleUpdateSchema`), `category.ts`
  (`categoryCreateSchema`). All re-exported from `@apt/types`.
- Converted to the new pattern:
  - `apps/admin/app/api/customers/route.ts` (POST)
  - `apps/admin/app/api/customers/[id]/route.ts` (PATCH)
  - `apps/admin/app/api/customers/bulk/route.ts`
  - `apps/admin/app/api/articles/route.ts` (POST)
  - `apps/admin/app/api/articles/[id]/route.ts` (PATCH)
  - `apps/admin/app/api/categories/route.ts` (POST)
- Every other API route (~25+) keeps its existing hand-rolled validation unchanged.
  `ARCHITECTURE.md` documents the pattern so the rest can be converted incrementally.

## Explicitly not done

See `CODEBASE_AUDIT.md` → "Explicitly not done in this pass" for the full list and
rationale (no shared Button/Input/Card library, no collapsing of bulk-status allow-lists,
no full zod rollout, no new store pages).

## Verification performed

- `npx tsc --noEmit` clean for `apps/admin`, `apps/web`, `apps/store` after every stream.
- `npx eslint` clean for all touched files.
- Manual trace of the `getSitePageData` fallback-merge logic to confirm store's legal
  pages render identical copy to today when no CMS doc exists for a slug yet.
