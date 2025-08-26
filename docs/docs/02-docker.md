# Docker

[Docker](https://www.docker.com/) helps us package the application.

## Building and Publishing

The frontend application uses a multi-stage Dockerfile optimized for layer caching. To build manually from the repository root:

```bash
docker build -t deno-fresh-app ./frontend
```

The Dockerfile caches Deno dependencies separately from source code, ensuring fast rebuilds when only application code changes.

Our GitHub Actions workflow automatically builds and publishes Docker images to GitHub Container Registry (ghcr.io) on every push to main. The workflow builds multi-platform images (linux/amd64 and linux/arm64) and tags them with the branch name, commit SHA, and "latest" for main branch builds. Pull requests trigger test builds but don't push images to the registry.

The latest images are available at `ghcr.io/wcygan/deno-fresh-on-kubernetes/frontend:latest`. Check [available versions](https://github.com/wcygan/deno-fresh-on-kubernetes/pkgs/container/deno-fresh-on-kubernetes%2Ffrontend) or use these commands to inspect remote images:

```bash
# Pull the latest image
docker pull ghcr.io/wcygan/deno-fresh-on-kubernetes/frontend:latest

# Check remote image tags without pulling
curl -s https://ghcr.io/v2/wcygan/deno-fresh-on-kubernetes/frontend/tags/list | jq .

# Inspect remote image manifest
docker manifest inspect ghcr.io/wcygan/deno-fresh-on-kubernetes/frontend:latest
```

The images include health checks and run as a non-root user for security.