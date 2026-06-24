APT Ghana Enterprise Platform Development Rules

@AGENTS.md

Mission

You are building the digital ecosystem for Automation & Plant Technologies Ltd (APT Ghana).

This is not a typical company website or ecommerce platform.

The objective is to create an enterprise-grade platform comparable to:

* Schneider Electric
* Siemens
* ABB
* Rockwell Automation
* Grainger
* RS Components
* Rexel
* Apple
* Stripe

Every implementation must prioritize:

* Scalability
* Maintainability
* Performance
* Accessibility
* Reusability
* Enterprise UX
* Investor-ready presentation

⸻

Mobile-First Mandate (Highest Priority)

For web (aptghana.com) and store (store.aptghana.com):

Mobile is the primary platform.

Design and build for:

1. Mobile
2. Tablet
3. Laptop
4. Desktop
5. Ultrawide

Never design for desktop first and then attempt to make it responsive.

Every feature, component, page, modal, drawer, form, search experience, navigation system, product listing, filter, checkout flow, article page, catalogue page, and marketing page must be optimized for mobile first.

Mobile Requirements

Target devices include:

* iPhone SE
* iPhone 12/13/14/15
* Samsung Galaxy A-series
* Samsung Galaxy S-series
* Pixel devices
* Small Android devices (320px+)

The platform must function correctly at:

* 320px
* 360px
* 375px
* 390px
* 414px
* 768px
* 1024px+
* 1440px+

⸻

Store & Web Mobile UX Rules

Navigation

Navigation must be designed for touch-first interaction.

Requirements:

* Large touch targets (minimum 44x44px)
* No hover-only functionality
* Mega menus must have mobile equivalents
* Drawers must be thumb-friendly
* Search must never overflow small screens
* Menus must support one-handed navigation

Typography

Mobile readability takes priority.

Requirements:

* No tiny text
* Minimum readable body size
* Proper line heights
* Consistent spacing hierarchy

Avoid:

* Dense enterprise dashboards on mobile
* Compressed tables
* Tiny metadata blocks

Product Cards

Product cards must:

* Scale elegantly on mobile
* Prevent layout shifts
* Maintain image ratios
* Use responsive typography
* Keep actions accessible

Search

Search is a primary feature.

Requirements:

* Mobile-first autocomplete
* Product previews
* Keyboard-friendly
* Touch-friendly
* No horizontal scrolling
* Fast rendering

Images

Images must:

* Reserve space before loading
* Prevent CLS
* Use responsive sizing
* Support lazy loading
* Use optimized formats

Tables

Avoid traditional desktop tables on mobile.

Use:

* Cards
* Stacked layouts
* Responsive data views

Only use horizontal scrolling when absolutely necessary.

⸻

Admin Platform Exception

Admin is an internal operating system.

Admin should support mobile usage, but may prioritize:

1. Desktop
2. Laptop
3. Tablet
4. Mobile

Complex workflows such as:

* Product management
* Search administration
* Category management
* User management
* Analytics
* Reporting

may use desktop-optimized layouts.

However:

* No broken mobile layouts
* No overflowing content
* No unusable forms
* No inaccessible actions

⸻

Platform Architecture

apps/
admin/ → admin.aptghana.com
store/ → store.aptghana.com
web/ → aptghana.com

These are three applications sharing one ecosystem.

⸻

Shared First Philosophy

Whenever possible, DO NOT duplicate:

* pages
* layouts
* components
* sections
* hooks
* utilities
* services
* schemas
* validation
* types
* SEO logic

Create shared packages instead.

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

Applications should compose from shared modules.

⸻

Shared Content

Pages that exist in multiple applications must share implementations:

* About
* Brands
* Contact
* Careers
* Resources
* Industries
* Legal pages
* Support pages

Extend shared implementations instead of duplicating them.

⸻

Design System

Maintain a single enterprise design language across all applications.

Everything should feel like one ecosystem.

Standardize:

* Typography
* Spacing
* Buttons
* Cards
* Forms
* Tables
* Drawers
* Dialogs
* Navigation
* Elevation
* Animations

⸻

Theme System

Every component must support:

* Light mode
* Dark mode
* System mode

Never hardcode:

* text-black
* bg-white
* bg-black

Always use semantic tokens.

⸻

Performance

Prefer:

* Server Components
* Streaming
* Suspense
* Partial prerendering
* Lazy loading
* Optimized images
* Optimized fonts

Avoid unnecessary client rendering.

⸻

Loading States

Every route must include:

* loading.tsx
* error.tsx
* not-found.tsx

Use reusable skeleton systems.

Avoid static fallback content.

⸻

Empty States

Never use placeholder fallback data.

Instead create:

* Empty states
* No results states
* Not found states
* Missing content states

Each should be visually polished and contextual.

⸻

Code Quality

Always:

* Centralize configuration
* Centralize constants
* Centralize types
* Centralize interfaces
* Centralize schemas

Never duplicate business logic.

⸻

Enterprise Mindset

Before implementing any feature ask:

1. Is it mobile-first?
2. Can it be shared?
3. Can it scale to millions of records?
4. Can non-developers manage it?
5. Does it avoid duplication?
6. Does it meet Fortune 500 quality expectations?

If not, redesign before implementation.

⸻

Final Rule

For Store and Web:

Mobile experience is more important than desktop experience.

A feature is not complete until it works flawlessly on small mobile devices.

Optimize for long-term architecture, enterprise UX, accessibility, performance, and scalability.
