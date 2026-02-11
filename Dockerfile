# CareVerse HQ - Kubernetes Deployment Dockerfile
# Builds frontend assets and prepares app for Kubernetes deployment

FROM frappe/bench:latest

# Set working directory
WORKDIR /home/frappe/frappe-bench

# Copy the careverse_hq app
COPY . apps/careverse_hq/

# Ensure npm is available
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Build frontend assets
RUN cd apps/careverse_hq/frontend && \
    npm ci && \
    npm run build && \
    cd - && \
    echo "✓ Frontend built successfully"

# Build Frappe app and copy assets to sites/
RUN bench build --app careverse_hq && \
    echo "✓ Frappe build completed, assets copied to sites/assets"

# Verify assets are in place
RUN ls -lh sites/assets/careverse_hq/admin-central/assets/ || \
    (echo "✗ Assets missing!" && exit 1) && \
    echo "✓ Assets verified in sites/assets"

# Set permissions
RUN chown -R frappe:frappe /home/frappe/frappe-bench

WORKDIR /home/frappe/frappe-bench
