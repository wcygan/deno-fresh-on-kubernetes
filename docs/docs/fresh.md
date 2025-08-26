# Fresh

## Kubernetes Deployment Architecture

The following diagram shows how a Deno Fresh application is deployed on Kubernetes with 3 replicas and served through an nginx ingress controller:

```mermaid
graph TB
    Internet[Internet] --> Ingress[nginx Ingress Controller]
    
    Ingress --> Service[Fresh App Service<br/>ClusterIP]
    
    Service --> Pod1[Fresh App Pod 1<br/>Deno Fresh Server]
    Service --> Pod2[Fresh App Pod 2<br/>Deno Fresh Server]
    Service --> Pod3[Fresh App Pod 3<br/>Deno Fresh Server]
    
    subgraph "Kubernetes Cluster"
        subgraph "Ingress Layer"
            Ingress
        end
        
        subgraph "Service Layer"
            Service
        end
        
        subgraph "Application Layer"
            Pod1
            Pod2
            Pod3
        end
    end
    
    style Internet fill:#e1f5fe
    style Ingress fill:#fff3e0
    style Service fill:#f3e5f5
    style Pod1 fill:#e8f5e8
    style Pod2 fill:#e8f5e8
    style Pod3 fill:#e8f5e8
```

This architecture provides:

- **High Availability**: 3 replicas ensure the application stays running even if one pod fails
- **Load Distribution**: Traffic is automatically distributed across all healthy pods
- **External Access**: nginx ingress provides HTTPS termination and routing from the internet
- **Service Discovery**: Kubernetes service handles internal load balancing and pod discovery
