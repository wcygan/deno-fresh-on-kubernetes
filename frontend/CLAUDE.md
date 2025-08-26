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