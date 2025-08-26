# Multi-stage build for optimal layer caching
FROM denoland/deno:latest AS deps

# Create app directory
WORKDIR /app

# Copy dependency manifest first for better caching
COPY deno.json ./

# Cache dependencies - this layer only changes when deps change
RUN deno cache --reload deno.json

# Build stage
FROM denoland/deno:latest AS builder

WORKDIR /app

# Copy cached dependencies from deps stage
COPY --from=deps /deno-dir /deno-dir
COPY --from=deps /app /app

# Copy source code
COPY . .

# Cache main application dependencies
RUN deno cache main.ts dev.ts

# Build the application
RUN deno task build

# Production stage
FROM denoland/deno:latest

# Deno user already exists in base image

WORKDIR /app

# Set environment variables
ENV DENO_DIR=/deno-dir/
ENV DENO_DEPLOYMENT_ID=docker

# Copy built application and cached dependencies
COPY --from=builder --chown=deno:deno /app .
COPY --from=builder --chown=deno:deno /deno-dir /deno-dir

# Switch to non-root user
USER deno

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

# Start the application
CMD ["deno", "task", "start"]