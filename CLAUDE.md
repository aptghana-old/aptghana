@AGENTS.md

# APT Ghana Enterprise Platform Development Rules

## Mission

You are building the digital ecosystem for Automation & Plant Technologies Ltd (APT Ghana).

This is not a typical company website or ecommerce store.

The objective is to create an enterprise platform comparable to the digital experiences of:

- Schneider Electric
- Siemens
- ABB
- Rockwell Automation
- Grainger
- RS Components
- Rexel
- Apple
- Stripe

Every implementation should prioritize:

- Scalability
- Maintainability
- Performance
- Accessibility
- Reusability
- Enterprise UX
- Investor-ready presentation

---

## Platform Architecture

The platform consists of three applications:

```
apps/
  admin/   → admin.aptghana.com   (internal operating system)
  store/   → store.aptghana.com   (B2B/B2C commerce platform)
  web/     → aptghana.com         (corporate website)
```

These are three applications sharing one ecosystem, not three unrelated projects.

---

## Shared First Philosophy

Whenever possible, DO NOT duplicate:

- pages, layouts, components, sections
- utilities, hooks, services
- schemas, types, validation
- SEO logic

Instead create shared packages:

```
packages/
  ui/
  design-system/
  shared/
  cms/
  seo/
  analytics/
  auth/
  search/
  content/
  entities/
```

Applications should compose from shared modules rather than copy code.

---

## Shared Pages

Many pages exist in both the corporate website and the storefront:

- About, Brands, Contact, Careers, Resources, Industries
- Privacy Policy, Terms, Cookies, Warranty, Support, FAQs

Do NOT implement these twice. Create reusable page modules or shared content components. If one application requires additional functionality, extend the shared implementation rather than creating a duplicate.

```
Shared About Page
  ↓ Corporate Website (extra storytelling)
  ↓ Store (extra commerce CTAs)
```

---

## Shared Footer Sections

Never duplicate footer links. Compose each app's footer from shared building blocks:

```
shared/footer/company
shared/footer/resources
shared/footer/legal
shared/footer/support
```

---

## Shared Brand System

Maintain one source of truth for brand entities:

- logo, description, SEO, metadata
- manufacturer, country, website, related products

Store-specific additions (featured products, listings, filters) may extend the shared entity, but the underlying brand entity must remain shared.

---

## Shared SEO

Never duplicate SEO implementations. Create reusable utilities for:

- metadata generation, Open Graph, Twitter Cards
- canonical URLs, structured data, breadcrumbs, sitemap generation

---

## Design Language

Maintain one enterprise design system across every application:

- typography, spacing, icons, elevation, animations
- radius, shadows, grids, forms, buttons, cards, tables

Nothing should look like it belongs to another product.

---

## Color System

APT Ghana is a major distributor of Schneider Electric products. The visual identity should align with that level of professionalism.

Primary palette: premium greens and complementary neutral tones. Use color intentionally for hierarchy, emphasis, and usability — not decoration.

Avoid: random accent colors, inconsistent palettes, neon effects, oversaturated gradients.

The experience should feel clean, technical, and sophisticated.

---

## Theme System

Every component must support Light Mode, Dark Mode, and System Mode. Dark mode is not an afterthought — it must be designed intentionally.

Never hardcode `text-black`, `bg-white`, or `bg-black`. Always use semantic design tokens:

```
surface / surface-secondary
foreground / foreground-muted
border
primary / secondary / accent
```

---

## Mobile First

Design mobile → tablet → desktop → ultrawide. Do not create desktop layouts and shrink them.

Components that must always be responsive: Header, Footer, Navigation, Mega menus, Search, Tables, Product grids, Forms, Dashboards, Filters, Drawers, Dialogs, Cards.

---

## Adaptive Components

Every component must support:

- Light mode and dark mode
- Keyboard navigation and accessibility
- Touch and mouse interaction

Hover-only functionality is unacceptable.

---

## Performance

Prefer: Server Components, Streaming, Suspense, Partial prerendering, Lazy loading, Optimized images, Optimized fonts.

Avoid unnecessary client-side rendering.

---

## Loading States

Every route should include `loading.tsx`, `error.tsx`, and `not-found.tsx`. Static layout elements should render immediately. Only dynamic content should show skeletons. Create reusable skeleton components — not page-specific implementations.

---

## Code Quality

Never:

- duplicate logic or components
- hardcode business data, URLs, colors, or navigation

Always centralize configuration.

---

## Enterprise Mindset

Before implementing any feature, ask:

1. Can this be shared across applications?
2. Can this become part of the design system?
3. Can this scale to thousands of products and pages?
4. Can non-developers manage it in the future?
5. Is there unnecessary duplication?
6. Does this meet Fortune 500 quality expectations?

If the answer to any of these is no, redesign the implementation before writing code.

---

## Final Rule

Optimize for long-term architecture over short-term convenience. Every line of code should strengthen a scalable enterprise platform that can support the future growth of APT Ghana across admin, store, and web.
