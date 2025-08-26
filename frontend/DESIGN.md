# DESIGN.md — Frontend Style Guide

A hard design contract for the Fresh/Preact UI. All new UI and refactors must conform to these rules. The goal is **predictable, accessible, minimal** UI built with Tailwind v4 utilities and a small set of reusable primitives.

---

## 0) TL;DR (Implement in this order)

1. **Tokens**: add/maintain design tokens in `frontend/static/styles.css` under `@theme` (colors, radii, spacing, shadows).
2. **Primitives**: use `.btn`, `.card`, `.input`, `.label`, `.badge` component classes defined with `@apply`.
3. **Patterns**: page container, grid, and state standards (loading/empty/error) below.
4. **Accessibility**: enforce focus rings, keyboard nav, contrast.
5. **No drift**: use tokens/utilities only; no inline styles, no arbitrary hex, no ad‑hoc radii/shadows.

---

## 1) Foundations (Design Tokens)

Tokens live in `frontend/static/styles.css` using Tailwind v4 `@theme`. These become classes like `bg-brand`, `text-muted`, `rounded-xl`, etc.

```css
/* static/styles.css (excerpt) */
@import "tailwindcss";

@theme {
  /* Colors */
  --color-brand: oklch(0.26 0 0);              /* brand surface for CTAs (near-black) */
  --color-brand-contrast: oklch(0.97 0 0);     /* text on brand */
  --color-accent: oklch(0.78 0.12 155);        /* accent (green) */
  --color-accent-600: oklch(0.72 0.12 155);
  --color-muted: oklch(0.65 0 0);              /* secondary text */
  --color-border: oklch(0.85 0 0);
  --color-bg: oklch(0.98 0 0);
  --color-card: oklch(0.99 0 0);

  /* Radii */
  --radius-sm: 0.375rem;  /* 6px  */
  --radius-md: 0.75rem;   /* 12px */
  --radius-lg: 1rem;      /* 16px */
  --radius-xl: 1.25rem;   /* 20px */

  /* Shadows */
  --shadow-card: 0 1px 2px rgba(0,0,0,.04), 0 6px 20px rgba(0,0,0,.06);
  --shadow-card-hover: 0 2px 6px rgba(0,0,0,.05), 0 12px 24px rgba(0,0,0,.10);

  /* Spacing scale extensions (optional) */
  --spacing-4_5: 1.125rem; /* consistent in-between spacing */
}

/* Global base */
:root { color-scheme: light; }
html, body { background: var(--color-bg); }
```

### Do / Don’t

* ✅ Use tokenized utilities (e.g., `bg-brand`, `text-muted`, `rounded-xl`).
* ❌ Don’t use inline styles or raw hex values (except inside `@theme`).
* ❌ Don’t invent new radius/shadow classes; use tokens.

---

## 2) Component Primitives

Define once in `static/styles.css` using `@layer components` and reuse everywhere.

```css
@layer components {
  /* Buttons */
  .btn { @apply inline-flex items-center justify-center font-medium rounded-xl px-4 py-3 transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600; }
  .btn-primary { @apply bg-brand text-brand-contrast hover:bg-neutral-800; }
  .btn-ghost   { @apply bg-transparent text-neutral-800 hover:bg-neutral-100; }
  .btn-danger  { @apply bg-red-600 text-white hover:bg-red-700; }
  .btn-sm      { @apply px-3 py-2 rounded-lg text-sm; }
  .btn-lg      { @apply px-5 py-3 rounded-xl text-base; }

  /* Cards */
  .card { @apply bg-white rounded-2xl border border-border shadow-[var(--shadow-card)]; }
  .card-hover { box-shadow: var(--shadow-card-hover); }
  .card-body { @apply p-6; }

  /* Forms */
  .label { @apply block text-sm font-medium text-neutral-700; }
  .input { @apply w-full rounded-xl border border-border bg-white px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600; }

  /* Badges */
  .badge { @apply inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-700; }
}
```

**Rules**

* Use `.btn` + size + variant (e.g., `class="btn btn-primary btn-lg"`).
* Wrap content sections in `.card > .card-body`.
* Inputs always use `.input` with visible focus.

---

## 3) Layout & Spacing

* Page wrapper: `min-h-screen bg-[--color-bg] px-4 py-8` with `max-w-7xl mx-auto` container.
* Grid gap defaults: `gap-6` for dense, `gap-8` for spacious.
* Corner rounding: default `rounded-xl` for interactive surfaces; `rounded-2xl` for cards/sheets.
* Borders: `border border-border` only; no `border-2`.

---

## 4) Typography

* Headings: `text-4xl/none font-bold` for H1, `text-xl font-semibold` for section titles.
* Body: `text-neutral-700` for primary, `text-muted` for secondary.
* Use `tabular-nums` only where numeric alignment matters.

---

## 5) State Patterns

**Loading**: skeleton or spinner area with `aria-busy="true"`.

**Empty**: icon/emoji + one sentence + primary action (optional). Use `text-muted`.

**Error**: concise message + retry button `.btn-ghost` or help link. Never `alert()` in production.

---

## 6) Accessibility

* Keyboard focus must be visible (`focus-visible:ring-2 ring-accent-600`).
* Tap targets ≥ 44×44 px (`py-2` minimum, ideally `py-3`).
* Color contrast ≥ 4.5:1.
* Provide `alt` text for images; avoid decorative images without `alt=""`.

---

## 7) Islands & Server Separation

* Islands must import **client-safe** modules only.
* Shared utilities (e.g., money formatting) must live in an isomorphic file without server-only deps.
* Only pass **serializable props** into islands.

---

## 8) Product & Cart Patterns (Reference)

* **Product card** = `.card` → `.card-body` with image (rounded-xl, aspect-square), title, description (line-clamp), price, and primary CTA `.btn-primary`.
* **Cart sheet** = `.card sticky top-4` with header (count badge), scroll area, summary row, primary CTA.

---

## 9) Banned & Required

**Banned**

* Inline styles for color/spacing/shadows.
* Raw hex colors in markup.
* `rounded-sm`, `border-2`, inconsistent ad-hoc shadows.
* `alert()` for user-facing errors (use inline error UI).

**Required**

* Tokenized utilities (`bg-brand`, `border-border`, `rounded-xl`).
* Focus-visible rings on interactive elements.
* Buttons via `.btn` primitives.

---

## 10) Code Examples

### Button primitive usage

```tsx
<button class="btn btn-primary btn-lg" type="button">Checkout</button>
<button class="btn btn-ghost btn-sm" type="button">Clear</button>
```

### Card block

```tsx
<div class="card">
  <div class="card-body">
    <h2 class="text-xl font-semibold">Order Summary</h2>
    <!-- content -->
  </div>
</div>
```

### Input group

```tsx
<label class="label" for="email">Email</label>
<input id="email" class="input" type="email" placeholder="you@example.com" />
```

---

## 11) Refactor Checklist (to adopt this guide)

* Extract an isomorphic money formatter to `frontend/lib/money.ts` and import it from server and islands.
* Replace ad-hoc button elements with the `Button` component or `.btn` classes.
* Wrap product cards and cart in `.card` + `.card-body` and remove bespoke borders/shadows.
* Replace `border-2` & `rounded-sm` with tokenized `border`, `rounded-xl`.
* Replace `text-gray-XYZ` with semantic (`text-neutral-900`, `text-muted`).
* Move any `alert()` usage to inline error components.

---

## 12) Enforcement

* Keep this file as the single source of truth.
* Hooks/pipelines should block merges if lints/tests or design checks fail (see repo hooks).
* PRs touching UI must link to the relevant section in **DESIGN.md** and note compliance.

---

## 13) Versioning

* Update this document with a `## Changelog` section on material changes.
* Breaking UI changes should be accompanied by a small migration note (before/after snippet).
