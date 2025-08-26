# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

- **`main.ts`**: Application entry point defining middleware and programmatic routes
- **`dev.ts`**: Development server configuration with Tailwind plugin
- **`utils.ts`**: Defines typed helpers using `createDefine<State>()` for type-safe routes and middleware

### Directory Structure

- **`routes/`**: File-based routing with Fresh conventions
  - `_app.tsx`: Root layout component
  - `api/[name].tsx`: Dynamic API route example
  - `index.tsx`: Homepage route
- **`islands/`**: Interactive client-side components (hydrated)
- **`components/`**: Static server-rendered components
- **`static/`**: Static assets served directly

### State Management

Routes and middleware share state through the `State` interface defined in `utils.ts`. The `define` helper provides type-safe route and middleware definitions:

```typescript
export const define = createDefine<State>();
```

### Testing Conventions

Follow Deno's testing standards from https://docs.deno.com/runtime/fundamentals/testing/:
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

Fresh is an edge-first, zero build-step, full-stack web framework built specifically for Deno. It's designed for simplicity, performance, and minimal client-side overhead.

### Key Features

- **Zero build step**: No bundling or transpiling upfront; code runs as-is with Deno handling TSX/JSX just-in-time
- **Server-rendered by default**: Ships plain HTML to clients with no JavaScript payload unless explicitly added
- **Islands architecture**: Small, interactive components (islands) rehydrated client-side only where needed
- **Edge-native performance**: Optimized for edge runtimes
- **File-system routing**: Next.js-inspired routing with TypeScript support out of the box

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