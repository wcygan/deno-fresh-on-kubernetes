# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Kubernetes Deployment Overview

This directory contains security-hardened Kubernetes manifests for a Deno Fresh application with comprehensive development workflow automation via Skaffold.

## Essential Kubernetes Commands

### Core Deployment Operations
```bash
# From repository root
deno task k8s:apply     # Apply all manifests (kubectl apply -f k8s/)
deno task k8s:delete    # Remove all resources (kubectl delete -f k8s/)

# Direct kubectl operations
kubectl apply -f k8s/   # Deploy all resources
kubectl get pods -n deno-fresh-example     # Check pod status
kubectl logs -f deployment/frontend -n deno-fresh-example  # View logs
```

### Skaffold Development Workflow
```bash
deno task skaffold:run  # One-time deployment
deno task skaffold:dev  # Continuous development with hot reload
skaffold dev            # Direct skaffold command (auto port-forward to :8080)
```

## Kubernetes Architecture

### Resource Structure
- **Namespace**: `deno-fresh-example` - Isolated environment with `name` labels
- **Deployment**: Single-replica frontend application with security hardening
- **Service**: ClusterIP service mapping port 80 → container port 8000

### Security Configuration (Production-Grade)
```yaml
securityContext:
  seccompProfile:
    type: RuntimeDefault       # Default seccomp filtering
containers:
  securityContext:
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: true
    capabilities:
      drop: [ALL]             # Remove all Linux capabilities
```

### Health Monitoring
- **Readiness Probe**: HTTP GET on `/` port 8000 (5-second intervals)
- **Liveness Probe**: HTTP GET on `/` port 8000 (10-second initial delay)
- **Docker Healthcheck**: Container-level health validation

## Container Registry & Images

### Image Configuration
- **Registry**: GitHub Container Registry (`ghcr.io`)
- **Image**: `ghcr.io/wcygan/deno-fresh-on-kubernetes/frontend:latest`
- **Pull Policy**: `IfNotPresent` (development-optimized)
- **Multi-platform**: AMD64/ARM64 support via GitHub Actions

### CI/CD Pipeline
- **Triggers**: Push to `main` branch with frontend changes
- **Automated builds**: Multi-platform Docker images with layer caching
- **Tagging strategy**: Branch names, commit SHAs, semantic versions, latest

## Skaffold Integration

### Port Forwarding
- **Service port 80** → **Local port 8080**
- Automatic forwarding during `skaffold dev`
- Access application at `http://localhost:8080`

### Development Features
- **Manifest-based deployment** using kubectl strategy
- **Default namespace**: `deno-fresh-example`
- **Resource management**: Metadata name `fresh-on-k8s`

## Security Hardening Details

### Pod Security Standards
- **Non-root execution**: Container runs as `deno` user
- **Immutable root filesystem**: Prevents runtime file system modifications
- **Capabilities dropped**: No privileged operations allowed
- **Seccomp profiles**: Runtime security filtering applied

### Missing Production Features
- **Resource limits**: No CPU/memory constraints (add for production)
- **Network policies**: No pod-to-pod communication restrictions
- **Ingress controller**: No external access configuration
- **Horizontal Pod Autoscaler**: Single replica only

## Development Workflow Patterns

### Local Kubernetes Development
1. Start with `deno task skaffold:dev` for continuous deployment
2. Code changes trigger automatic redeployment
3. Health checks ensure application readiness
4. Access via port-forwarded localhost:8080

### Production Deployment Considerations
```yaml
# Add to deployment.yaml for production
resources:
  requests:
    memory: "64Mi"
    cpu: "50m"
  limits:
    memory: "128Mi"
    cpu: "100m"
replicas: 3  # High availability
```

### Debugging and Troubleshooting
```bash
kubectl describe deployment frontend -n deno-fresh-example
kubectl get events -n deno-fresh-example --sort-by='.lastTimestamp'
kubectl port-forward svc/frontend 8080:80 -n deno-fresh-example
```

## Key Architectural Decisions

### Container Strategy
- **Multi-stage Docker builds** with dependency layer caching
- **Deno-optimized** runtime with JSR imports
- **Security-first** container configuration

### Kubernetes Patterns
- **Minimal viable deployment** - essential resources only
- **Development-oriented** - single replica, latest tags
- **Security-hardened** - comprehensive pod security contexts
- **Health-check driven** - readiness/liveness probe integration

The manifests prioritize security and development velocity over operational complexity, making them ideal for development environments and demonstration purposes.