---
title: Debugging Kubernetes Networking Issues
description: How to diagnose and fix pod connectivity problems in Kubernetes with Cilium CNI
---

# Debugging Kubernetes Networking Issues

## Problem Summary

The Deno Fresh application was deployed successfully but HTTPS access via `deno-fresh-example.wcygan.net` was failing with HTTP 524 (timeout) errors, while a similar application (`bread.wcygan.net`) worked fine.

## Root Cause

The NetworkPolicy was blocking the ingress controller from reaching the application pods. The policy was configured to allow traffic from namespace with label `name=ingress-nginx`, but the actual ingress controller was running in the `network` namespace without that label.

## Debugging Steps

### 1. Check Pod and Service Status
```bash
kubectl get pods -n deno-fresh-example -o wide
kubectl get svc -n deno-fresh-example -o wide
kubectl get endpoints -n deno-fresh-example
```

### 2. Test Network Connectivity
```bash
# Test from host to pod IP (failed due to Cilium CNI isolation)
curl http://10.42.1.120:8000 --connect-timeout 5

# Test via port-forward (worked)
kubectl port-forward -n deno-fresh-example svc/frontend 8000:80
```

### 3. Identify Ingress Controller Location
```bash
kubectl get pods -A | grep nginx
# Output: external-ingress-nginx-controller in 'network' namespace
```

### 4. Check Ingress Logs
```bash
kubectl logs -n network external-ingress-nginx-controller-<pod-id> --tail=20
# Showed: "upstream timed out (110: Operation timed out)"
```

### 5. Examine Network Policy
```bash
kubectl describe networkpolicy allow-ingress-and-dns -n deno-fresh-example
# Revealed: namespaceSelector looking for "name=ingress-nginx"
```

### 6. Verify Namespace Labels
```bash
kubectl get ns network --show-labels
# Showed: kubernetes.io/metadata.name=network (no "name" label)
```

## The Fix

Update the NetworkPolicy to use the correct namespace selector:

```yaml
# k8s/network-policy.yaml
ingress:
  - from:
      - namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: network  # Changed from "name: ingress-nginx"
      - podSelector: {}
    ports:
      - protocol: TCP
        port: 8000
```

Apply the fix:
```bash
kubectl apply -f k8s/network-policy.yaml
```

## Key Insights

### 1. Cloudflare Tunnel Architecture
- All `*.wcygan.net` traffic routes through Cloudflare → cloudflared pod → external-ingress-nginx-controller → services
- The cloudflared configuration in ConfigMap shows this routing:
```yaml
ingress:
  - hostname: "*.wcygan.net"
    service: https://external-ingress-nginx-controller.network.svc.cluster.local:443
```

### 2. Cilium CNI Behavior
- Pods are not directly accessible from the host machine (unlike some other CNIs)
- Network policies strictly enforce traffic flow
- Port-forwarding bypasses network policies for debugging

### 3. Talos Linux Specifics
- Uses Cilium CNI by default
- Pod CIDR: 10.42.0.0/16 (10.42.x.x addresses)
- Service CIDR: 10.43.0.0/16 (10.43.x.x addresses)
- Host network isolation from pod network

## Verification Steps

After applying the fix:
```bash
# Check HTTPS connectivity
curl -I https://deno-fresh-example.wcygan.net

# Expected: HTTP/2 200 status
# The site should load normally in a browser
```

## Lessons Learned

1. **Always verify namespace labels** when using NetworkPolicies with namespace selectors
2. **Check the actual location** of ingress controllers - they might not be in expected namespaces
3. **Use port-forwarding** to isolate network policy issues from application issues
4. **Cloudflare Tunnel** adds another layer - traffic must flow through multiple hops
5. **CNI choice matters** - Cilium's strict network isolation can complicate debugging

## Common NetworkPolicy Pitfalls

- Using non-existent namespace labels
- Forgetting to allow DNS (port 53) in egress rules
- Not including pod-to-pod communication within the same namespace
- Incorrect port specifications (container port vs service port)
- Missing protocol specifications (TCP/UDP)

## Debugging Commands Reference

```bash
# Check CNI in use
kubectl -n kube-system get pods | grep -E 'flannel|cilium|calico|weave'

# Test service connectivity
curl http://<service-cluster-ip>:<port> --connect-timeout 5

# Check ingress status
kubectl get ingress -n <namespace> -o wide
kubectl describe ingress <ingress-name> -n <namespace>

# View network policies
kubectl get networkpolicies -n <namespace>
kubectl describe networkpolicy <policy-name> -n <namespace>

# Check certificate status (if using cert-manager)
kubectl get certificates -A | grep <domain>
```