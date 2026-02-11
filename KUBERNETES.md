# CareVerse HQ: Kubernetes Deployment Guide

This guide ensures CareVerse HQ frontend assets are properly deployed to Kubernetes.

## TL;DR

**Build assets in Docker image, NOT during migrations.**

```bash
# Build Docker image with frontend assets baked in
docker build -f apps/careverse_hq/Dockerfile -t your-registry/careverse-hq:latest .
docker push your-registry/careverse-hq:latest

# Deploy to Kubernetes
kubectl set image deployment/frappe-web frappe=your-registry/careverse-hq:latest
kubectl rollout status deployment/frappe-web
```

## Why Not Build During Migrations?

The `after_migrate` hook in careverse_hq **will cause issues in Kubernetes**:

❌ **Problems:**
- Node.js/npm not available in production containers
- Frontend build takes 30-60 seconds (migrations timeout)
- Multiple pods running migrations = race conditions
- Built assets in one pod don't sync to others
- Wastes resources rebuilding the same thing on every pod

✅ **Solution:** Build assets once during Docker image creation

## Deployment Options

### Option 1: Build in Docker Image (Recommended)

**Advantages:**
- Assets always available
- Fast pod startup
- No runtime dependencies (Node.js/npm)
- Works with multiple replicas
- Consistent across all pods

**Build Process:**

```bash
cd /path/to/frappe-bench

# Build image with assets
docker build \
  -f apps/careverse_hq/Dockerfile \
  -t your-registry/careverse-hq:v1.0.0 \
  .

# Push to registry
docker push your-registry/careverse-hq:v1.0.0
```

**Kubernetes Deployment:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frappe-web
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: frappe
        image: your-registry/careverse-hq:v1.0.0
        volumeMounts:
        - name: sites-volume
          mountPath: /home/frappe/frappe-bench/sites
      volumes:
      - name: sites-volume
        persistentVolumeClaim:
          claimName: frappe-sites-pvc
```

### Option 2: Disable Migration Hook

If you can't rebuild Docker images, disable the migration hook:

**Edit `careverse_hq/hooks.py`:**

```python
# Migration hooks
# ---------------
# NOTE: Build frontend in Docker image, not during migrations
# after_migrate = [
#     "careverse_hq.build.run_frontend_build"
# ]
```

Then build assets manually when needed:

```bash
# SSH into any pod
kubectl exec -it deployment/frappe-web -- bash

# Build assets
cd /home/frappe/frappe-bench
bench build --app careverse_hq

# Verify
ls -lh sites/assets/careverse_hq/admin-central/assets/
```

## Verification

After deployment, verify assets are accessible:

```bash
# Check if assets exist in pod
kubectl exec deployment/frappe-web -- ls -lh sites/assets/careverse_hq/admin-central/assets/

# Expected output:
# -rw-r--r-- 1 frappe frappe 508K index-Dn6mqnLD.js
# -rw-r--r-- 1 frappe frappe  95K index-Ch-UDGbP.css

# Test from browser
curl -I https://your-domain/assets/careverse_hq/admin-central/assets/index-Dn6mqnLD.js
# Expected: HTTP 200 OK
```

## Multi-App Deployment (careverse_hq + healthpro_erp)

If deploying both apps together:

```bash
# Build multi-app image
docker build -f apps/careverse_hq/Dockerfile.multi -t registry/frappe-apps:latest .
```

**Create `Dockerfile.multi`:**

```dockerfile
FROM frappe/bench:latest
WORKDIR /home/frappe/frappe-bench

# Copy both apps
COPY apps/healthpro_erp apps/healthpro_erp/
COPY apps/careverse_hq apps/careverse_hq/

# Install Node.js
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# Build careverse_hq frontend
RUN cd apps/careverse_hq/frontend && npm ci && npm run build

# Build Frappe apps
RUN bench build --app healthpro_erp && bench build --app careverse_hq

# Verify assets
RUN ls sites/assets/careverse_hq/admin-central/assets/ && \
    echo "✓ CareVerse HQ assets ready"

RUN chown -R frappe:frappe /home/frappe/frappe-bench
```

## CI/CD Pipeline Example

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: |
          docker build -f apps/careverse_hq/Dockerfile \
            -t ${{ secrets.REGISTRY }}/careverse-hq:${{ github.sha }} \
            .

      - name: Push to registry
        run: |
          docker push ${{ secrets.REGISTRY }}/careverse-hq:${{ github.sha }}

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/frappe-web \
            frappe=${{ secrets.REGISTRY }}/careverse-hq:${{ github.sha }}
          kubectl rollout status deployment/frappe-web
```

## Troubleshooting

### Assets returning 404

```bash
# Check if assets exist
kubectl exec deployment/frappe-web -- ls sites/assets/careverse_hq/admin-central/

# If missing, rebuild
kubectl exec deployment/frappe-web -- bench build --app careverse_hq

# Restart nginx
kubectl exec deployment/frappe-web -- supervisorctl restart frappe-bench-web
```

### Build fails during Docker build

```bash
# Check npm/node versions
docker run your-registry/careverse-hq:latest node --version
docker run your-registry/careverse-hq:latest npm --version

# Rebuild with verbose output
docker build --progress=plain -f apps/careverse_hq/Dockerfile .
```

### Migration hook still running

```bash
# Check hooks.py
kubectl exec deployment/frappe-web -- cat apps/careverse_hq/careverse_hq/hooks.py | grep after_migrate

# If hook is still active, comment it out and rebuild image
```

## Performance Considerations

### Build Time Comparison

| Method | Time | CPU | Memory |
|--------|------|-----|--------|
| Docker build (once) | 60s | 2 cores | 2GB |
| Migration hook (per pod) | 60s × N pods | 2 cores × N | 2GB × N |

**With 3 replicas:**
- Docker build: 60s total (1×)
- Migration hook: 180s total (3× wasteful)

### Recommended Settings

```yaml
# Kubernetes deployment with proper resources
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "1000m"

# Liveness probe (don't check during migration)
livenessProbe:
  httpGet:
    path: /api/method/ping
    port: 8000
  initialDelaySeconds: 60  # Give migration time to complete
  periodSeconds: 10
```

## Summary

✅ **Best Practice:** Build frontend in Docker image
❌ **Avoid:** Building during `bench migrate` in Kubernetes
🚀 **Result:** Fast, reliable deployments with no runtime surprises
