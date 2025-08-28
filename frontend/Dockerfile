# Build stage
FROM denoland/deno:latest AS builder

WORKDIR /app

# Copy all source files
COPY . .

# Cache dependencies and install Node modules for Tailwind with scripts
RUN deno cache main.ts dev.ts && \
    deno install --allow-scripts=npm:@tailwindcss/oxide@4.1.12 --node-modules-dir=auto

# Run the build task which uses the Builder with Tailwind plugin
RUN deno task build && \
    echo "=== Checking build output ===" && \
    ls -la _fresh/static/ && \
    cat _fresh/static/styles.css | wc -c

# Production stage  
FROM denoland/deno:latest

# Set deployment ID
ARG GIT_REVISION=unknown
ENV DENO_DEPLOYMENT_ID=${GIT_REVISION}

WORKDIR /app

# Copy the entire app from builder
COPY --from=builder /app .

# Ensure proper permissions for deno user
RUN chown -R deno:deno /app

# Switch to non-root user
USER deno

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

# Run the production server
CMD ["deno", "task", "start"]