# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Design Enforcement

- All UI changes MUST follow `frontend/DESIGN.md`.
- Use tokenized utilities and primitives only:
  - Colors/radii/shadows come from `@theme` tokens in `static/styles.css`.
  - Buttons/cards/inputs must use `.btn`, `.card`, `.input`, etc.
- Prohibited: inline styles for color/spacing/shadows, raw hex in markup,
  `border-2`, `rounded-sm`, ad-hoc box-shadows, missing focus-visible rings.
- PRs must link to the relevant `DESIGN.md` sections and note compliance.

## Project Overview

This is a Deno Fresh 2 application that uses:

- **Fresh Core**: JSR `@fresh/core@^2.0.0-alpha.62`
- **Preact**: For UI components with signals for state management
- **Tailwind CSS v4**: With Fresh plugin for styling
- **JSR**: As the primary package registry for dependencies

## Essential Commands

```bash
# Development
deno task dev          # Start development server with hot reload

# Code Quality
deno fmt               # Format code
deno lint              # Lint code
deno check             # Type check
deno task check        # Combined format check, lint, and type check

# Build & Production
deno task build        # Build for production
deno task start        # Serve production build

# Testing
deno test              # Run all tests
deno test path/to/test.ts  # Run specific test file

# Update Dependencies
deno task update       # Update Fresh framework
```

## Architecture

### Core Components

- **`main.ts`**: Application entry point defining middleware and programmatic
  routes
- **`dev.ts`**: Development server configuration with Tailwind plugin
- **`utils.ts`**: Defines typed helpers using `createDefine<State>()` for
  type-safe routes and middleware

### Directory Structure

- **`routes/`**: File-based routing with Fresh conventions
  - `_app.tsx`: Root layout component
  - `api/[name].tsx`: Dynamic API route example
  - `index.tsx`: Homepage route
- **`islands/`**: Interactive client-side components (hydrated)
- **`components/`**: Static server-rendered components
- **`static/`**: Static assets served directly

### State Management

Routes and middleware share state through the `State` interface defined in
`utils.ts`. The `define` helper provides type-safe route and middleware
definitions:

```typescript
export const define = createDefine<State>();
```

### Testing Conventions

Follow Deno's testing standards from
https://docs.deno.com/runtime/fundamentals/testing/:

- Place tests next to source files with `_test.ts` suffix
- Use `Deno.test()` for test definitions
- Leverage built-in assertions from `@std/assert`

### Fresh 2 Patterns

- Routes use `define.page()` for type-safe page components
- API routes use `define.handlers()` for HTTP method handlers
- Middleware uses `define.middleware()` for request processing
- Islands receive signals for reactive state management

## Deno Runtime Fundamentals

### TypeScript Support

- Deno runs TypeScript natively without transpilation
- Type checking with `deno check` and `--check` flag
- Use JSDoc comments for enhanced type information
- Support for strict TypeScript configuration via `deno.json`

### Module System

- ES modules only (import/export syntax)
- Import from URLs, JSR (`jsr:@scope/package`), or npm (`npm:package`)
- Module resolution follows web standards
- Use `import.meta.url` for current module URL
- Dynamic imports with `import()` for code splitting

### Configuration

- `deno.json` as the primary configuration file
- Define tasks, imports, compiler options, and lint/format settings
- Lock files (`deno.lock`) for dependency integrity
- Environment-specific configuration support

### Standard Library

- Comprehensive standard library at `@std/*` on JSR
- Modules for common operations: fs, path, http, crypto, testing
- Version-locked for stability: `@std/assert@^1.0.0`
- Prefer standard library over third-party alternatives

### Environment Variables

- Access via `Deno.env.get()` and `Deno.env.set()`
- Load from `.env` files using `@std/dotenv`
- Environment-specific configuration patterns
- Security permissions required (`--allow-env`)

### Continuous Integration

- GitHub Actions support with `denoland/setup-deno`
- Cache dependencies for faster builds
- Run tests, formatting, and linting in CI

## Fresh Framework Deep Dive

### What Fresh Is

Fresh is an edge-first, zero build-step, full-stack web framework built
specifically for Deno. It's designed for simplicity, performance, and minimal
client-side overhead.

### Key Features

- **Zero build step**: No bundling or transpiling upfront; code runs as-is with
  Deno handling TSX/JSX just-in-time
- **Server-rendered by default**: Ships plain HTML to clients with no JavaScript
  payload unless explicitly added
- **Islands architecture**: Small, interactive components (islands) rehydrated
  client-side only where needed
- **Edge-native performance**: Optimized for edge runtimes
- **File-system routing**: Next.js-inspired routing with TypeScript support out
  of the box

### Architecture Concepts

#### Server Components

- Components that render on the server only
- No client-side JavaScript bundle
- Fast initial page loads and SEO-friendly
- Access to server-side resources and databases

#### Routing System

- File-based routing in `routes/` directory
- Dynamic routes using `[param].tsx` syntax
- Nested routing with directory structure
- API routes alongside page routes

#### Route Components

- Export default function components for pages
- Use `define.page()` for type-safe route definitions
- Access route parameters and query strings
- Server-side data fetching in route handlers

#### App Wrapper

- `_app.tsx` provides application-wide layout
- Wraps all pages with common structure
- Handles global state and context providers
- Server and client-side rendering support

#### Layouts

- Nested layouts using `_layout.tsx` files
- Automatic layout composition based on route hierarchy
- Share common UI elements across route groups
- Type-safe layout props and data

#### Forms and Data Handling

- Native HTML forms with progressive enhancement
- Server-side form handling with validation
- Client-side enhancement through islands
- Built-in CSRF protection and security

#### Islands (Client-Side Interactivity)

- Interactive components in `islands/` directory
- Hydrated on the client for dynamic behavior
- Preact-based with signals for state management
- Minimal JavaScript footprint per island

#### Middleware

- Request/response processing pipeline
- Authentication, logging, and CORS handling
- Route-specific and global middleware support
- Type-safe middleware definitions with `define.middleware()`

#### Error Pages

- Custom error pages with `_error.tsx`
- Development vs production error handling
- Graceful error boundaries and fallbacks
- Structured error information for debugging

#### Partials

- Server-rendered HTML fragments
- HTMX and similar library integration
- Progressive enhancement patterns
- Reduced client-side JavaScript requirements

#### Data Fetching

- Server-side data loading in route handlers
- Async data fetching with native Fetch API
- Database integration patterns
- Caching and performance optimization strategies

## Islands Architecture Best Practices

### Critical Rules for Islands

**NEVER** violate these rules or islands will fail to hydrate properly:

1. **Server-Only Dependencies**: Islands cannot import modules with server-only
   dependencies
   - ❌ **Bad**: Importing `lib/stripe.ts` (has NodeCache, server-only APIs)
   - ✅ **Good**: Create `lib/client-utils.ts` with browser-safe utilities

2. **Cross-Island Communication**: Islands cannot directly import functions from
   other islands
   - ❌ **Bad**: `import { addToCart } from "./Cart.tsx"`
   - ✅ **Good**: Use shared signals in `lib/cart-state.ts`

3. **Serializable Props Only**: Islands can only receive JSON-serializable props
   - ❌ **Bad**: Passing complex objects with methods
   - ✅ **Good**: Extract primitive values and pass individually

4. **Self-Contained Components**: Islands should not depend on parent DOM
   structure
   - ❌ **Bad**: Island returning `<li>` that requires parent `<ul>`
   - ✅ **Good**: Island returns complete `<div>`, wrap in `<li>` on server

### Problem: Non-Working Interactive Buttons

**Symptoms**: Buttons in islands don't respond to clicks, no console output, no
hydration

**Root Causes**:

```typescript
// ❌ WRONG - This breaks island hydration
import { formatMoney } from "../lib/stripe.ts"; // Server-only dependencies
import { addToCart } from "./Cart.tsx"; // Cross-island imports

export default function ProductCard({ product }: { product: Product }) {
  return <li>...</li>; // Wrong DOM structure
}
```

**Solution Pattern**:

```typescript
// ✅ CORRECT - This enables proper hydration
import { formatMoney } from "../lib/client-utils.ts"; // Client-safe utilities
import { addToCart } from "../lib/cart-state.ts"; // Shared signals

export default function ProductCard({
  name,
  price,
  currency,
}: {
  name: string;
  price: number;
  currency: string;
}) {
  return <div>...</div>; // Self-contained structure
}
```

### Shared State Architecture

Create a dedicated state file for cross-island communication:

```typescript
// lib/cart-state.ts
import { signal } from "@preact/signals";

export const cartItems = signal<CartItem[]>([]);

export function addToCart(item: CartItem) {
  cartItems.value = [...cartItems.value, item];
}
```

Both islands import from this shared state:

```typescript
// islands/ProductCard.tsx
import { addToCart } from "../lib/cart-state.ts";

// islands/Cart.tsx
import { cartItems } from "../lib/cart-state.ts";
```

### Server-Client Separation

**Server Component** (routes/index.tsx):

- Fetches data from APIs/databases
- Passes serializable props to islands
- Handles DOM structure (`<ul><li>`)

**Island Component** (islands/ProductCard.tsx):

- Receives primitive props only
- Handles client-side interactivity
- Self-contained DOM structure

```typescript
// Server component
{
  products.map((product) => (
    <li key={product.id}>
      <ProductCard
        name={product.name}
        price={product.default_price?.unit_amount}
        currency={product.default_price?.currency}
      />
    </li>
  ));
}
```

### Debugging Islands

1. **Check Browser Console**: Islands should log on mount if working
2. **Verify Props**: Ensure all props are JSON-serializable
3. **Check Imports**: No server-only dependencies in island files
4. **Test Isolation**: Temporarily simplify island to minimal button test

### Migration Checklist

When converting server components to islands:

- [ ] Extract server-only utilities to client-safe versions
- [ ] Replace cross-island imports with shared state
- [ ] Convert complex props to primitive values
- [ ] Make island DOM structure self-contained
- [ ] Wrap island in proper parent structure on server
- [ ] Test interactivity in browser console

Following these patterns ensures islands hydrate correctly and interactive
features work as expected.
