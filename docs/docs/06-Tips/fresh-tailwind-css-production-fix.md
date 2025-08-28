# Fixing Fresh 2.0 Tailwind CSS in Production

## Problem Description

When deploying a Fresh 2.0 application with Tailwind CSS to production (Kubernetes), the CSS styles were not being applied even though they worked perfectly in the local development environment. The production site served an empty (1 byte) CSS file at `/styles.css`, while the local development server correctly served a ~20KB compiled Tailwind CSS file.

### Symptoms

- **Local Development** (`http://localhost:8000`): Full styling with Tailwind CSS classes working
- **Production** (`https://deno-fresh-example.wcygan.net`): No CSS styles applied, empty CSS file served
- Browser inspection showed `/styles.css` returned 1 byte instead of the expected compiled CSS
- The `_fresh/static/styles.css` file in the Docker container was empty

## Root Cause Analysis

Fresh 2.0's Tailwind plugin requires ahead-of-time (AOT) builds to generate CSS for production. The key issues were:

1. **Missing Tailwind Configuration**: Fresh 2.0 with Tailwind requires a `tailwind.config.ts` file
2. **Build Process**: The Tailwind plugin only generates CSS when explicitly built using `deno task build`
3. **Node Modules**: Tailwind v4 requires Node modules with proper script execution permissions

## Solution

### 1. Create Tailwind Configuration

Added `tailwind.config.ts` in the frontend directory:

```typescript
import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
} satisfies Config;
```

### 2. Update Dockerfile for Proper Build Process

Modified the Dockerfile to ensure proper CSS generation:

```dockerfile
# Build stage
FROM denoland/deno:latest AS builder

WORKDIR /app

# Copy all source files
COPY . .

# Cache dependencies and install Node modules for Tailwind with scripts
RUN deno cache main.ts dev.ts && \
    deno install --allow-scripts=npm:@tailwindcss/oxide@4.1.12 --node-modules-dir=auto

# Run the build task which uses the Builder with Tailwind plugin
RUN deno task build

# Production stage  
FROM denoland/deno:latest

# Set deployment ID
ARG GIT_REVISION=unknown
ENV DENO_DEPLOYMENT_ID=${GIT_REVISION}

WORKDIR /app

# Copy the entire app from builder (includes _fresh directory with generated CSS)
COPY --from=builder /app .

# Ensure proper permissions for deno user
RUN chown -R deno:deno /app

# Switch to non-root user
USER deno

# Expose port
EXPOSE 8000

# Run the production server
CMD ["deno", "task", "start"]
```

### 3. Ensure Proper deno.json Configuration

The `deno.json` must have the correct tasks and node modules configuration:

```json
{
  "nodeModulesDir": "auto",
  "tasks": {
    "dev": "deno run -A --watch=static/,routes/ dev.ts",
    "build": "deno run -A dev.ts build",
    "start": "deno serve -A _fresh/server.js"
  }
}
```

### 4. Build Process with dev.ts

The `dev.ts` file must properly configure the Tailwind plugin:

```typescript
import { tailwind } from "@fresh/plugin-tailwind";
import { Builder } from "fresh/dev";

const builder = new Builder();
tailwind(builder);

if (Deno.args.includes("build")) {
  await builder.build();
} else {
  await builder.listen(() => import("./main.ts"));
}
```

## Key Insights

### Fresh 2.0 Ahead-of-Time Builds

Fresh 2.0 requires AOT builds for production CSS generation. The build process:
1. Creates a `_fresh` directory with optimized assets
2. Generates `_fresh/static/styles.css` with compiled Tailwind CSS
3. Creates a production server file at `_fresh/server.js`

### Docker Multi-Stage Build Importance

Using a multi-stage Docker build is crucial:
- **Build stage**: Installs dependencies, generates CSS, creates production assets
- **Production stage**: Copies built assets, runs with minimal overhead

### Node Modules and Script Permissions

Tailwind v4 with Fresh requires:
- `nodeModulesDir: "auto"` in deno.json
- `--allow-scripts` flag for npm packages that need to execute post-install scripts
- Specifically allowing `npm:@tailwindcss/oxide` which contains native bindings

## Verification Steps

1. **Check CSS Generation Locally**:
   ```bash
   deno task build
   ls -la _fresh/static/styles.css  # Should be ~20KB+
   ```

2. **Verify Docker Image**:
   ```bash
   docker run --rm IMAGE_NAME sh -c "ls -la _fresh/static/styles.css"
   ```

3. **Test Production Deployment**:
   - Navigate to production URL
   - Check browser DevTools Network tab for `/styles.css` response size
   - Verify CSS rules are loaded in DevTools Elements > Styles

## References

- [Fresh GitHub Issue #2223 - Tailwind CSS Production Issues](https://github.com/denoland/fresh/issues/2223)
- [Fresh Documentation - Ahead-of-Time Builds](https://fresh.deno.dev/docs/concepts/ahead-of-time-builds)
- [Fresh Documentation - Migrating to Tailwind](https://fresh.deno.dev/docs/examples/migrating-to-tailwind)
- [Fresh Documentation - Docker Deployment](https://fresh.deno.dev/docs/concepts/deployment#docker)
- [Deno Documentation - Docker](https://docs.deno.com/runtime/reference/docker/)

## Lessons Learned

1. **Always verify the build output**: Check that `_fresh/static/styles.css` is properly generated
2. **Use official documentation**: Fresh 2.0 is in alpha, so documentation is the best source of truth
3. **Test production builds locally**: Use `docker build` and run locally before deploying
4. **Multi-stage Docker builds are essential**: They ensure proper asset generation while keeping the final image lean
5. **Node modules compatibility**: Some Deno projects still require Node modules for certain packages like Tailwind

## Final Working Configuration

The issue was resolved by:
1. Adding `tailwind.config.ts` configuration file
2. Installing Node modules with `--allow-scripts` flag
3. Running `deno task build` in the Docker build stage
4. Using the official Fresh Docker deployment pattern from documentation

This ensures that Tailwind CSS is properly compiled during the build process and served correctly in production environments.