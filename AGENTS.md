# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Deno Fresh on Kubernetes** monorepo demonstrating modern web application deployment with three main components:
- `/frontend/` - Deno Fresh 2.0 (alpha) web application with Preact and Tailwind CSS v4
- `/k8s/` - Security-hardened Kubernetes deployment manifests
- `/docs/` - Docusaurus documentation site

## Essential Development Commands

### Root Level Operations
```bash
deno task dev           # Start frontend development server
deno task docs          # Start documentation site (bun-based)
deno task k8s:apply     # Deploy to Kubernetes cluster
deno task k8s:delete    # Remove from Kubernetes cluster
deno task skaffold:dev  # Continuous K8s development workflow
```

### Frontend Development (from `/frontend/`)
```bash
deno task dev           # Hot-reload development server
deno task check         # Combined format, lint, and type check
deno task build         # Production build
deno task test          # Run test suite
deno test path/to/test_file.ts  # Run specific test
```

### Documentation Site (from `/docs/`)
```bash
bun start              # Development server
bun run build          # Production build
```

## Architecture & Key Patterns

### Fresh 2.0 Islands Architecture
- **Server-side rendering** by default with selective client-side hydration
- **File-based routing** in `/frontend/routes/` with API routes in `/frontend/routes/api/`
- **Islands** in `/frontend/islands/` for interactive client components
- **Type-safe state sharing** using `createDefine<State>()` pattern in `/frontend/utils.ts`

### Kubernetes Deployment
- **Security-first configuration**: non-root execution, read-only filesystem, dropped capabilities
- **Health monitoring**: readiness/liveness probes on port 8000
- **Multi-platform Docker images**: AMD64/ARM64 support
- **GitHub Container Registry**: `ghcr.io/wcygan/deno-fresh-on-kubernetes/frontend:latest`

### Testing Strategy
- **Deno's built-in testing** framework with `--allow-env` permissions
- **Component and API testing** patterns established
- **Test files** follow `*_test.ts` naming convention

## Critical Framework Details

### Fresh 2.0 Specifics
- Uses **JSR imports** (`@fresh/core`, `@preact/preact`) not npm
- **Zero build step** architecture - TypeScript runs directly
- **Tailwind CSS v4** integration via Fresh plugin
- **Preact Signals** for reactive client-side state

### Development Workflow
- **Skaffold integration** for local K8s development with auto-rebuild
- **Multi-stage Docker builds** with dependency layer caching
- **GitHub Actions CI/CD** triggers on frontend changes

### Package Managers
- **Deno** for frontend application (no package.json)
- **Bun** for documentation site
- Each component has independent dependency management

## Common Development Patterns

### Adding New Routes
1. Create file in `/frontend/routes/` (e.g., `about.tsx`)
2. Export default handler function with typed `define` helper
3. Follow existing patterns in `/frontend/routes/index.tsx`

### Creating Interactive Components
1. Add to `/frontend/islands/` for client-side interactivity
2. Add to `/frontend/components/` for server-side components
3. Use Preact/TypeScript with Fresh patterns

### Kubernetes Updates
1. Modify manifests in `/k8s/`
2. Test with `deno task k8s:apply` 
3. Use `skaffold dev` for continuous deployment during development

## Pre-commit Requirements
Run before committing:
```bash
deno task check    # Format, lint, type check
deno task test     # All tests must pass
```

The codebase uses Fresh 2.0 alpha features and follows modern Deno patterns with comprehensive Kubernetes deployment automation.