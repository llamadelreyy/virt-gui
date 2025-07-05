# Configuration Guide

This document explains how to configure the Infrastructure Monitoring Dashboard for your specific environment and requirements.

## Environment Configuration

### 1. Backend Configuration

The backend uses environment variables for configuration. Create a [`backend/.env`](../backend/.env.example) file:

```bash
# Copy the example file
cp backend/.env.example backend/.env
```

**Environment Variables:**

```bash
# Server Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false
ENVIRONMENT=production

# Prometheus Configuration
PROMETHEUS_URL=http://prometheus:9090
PROMETHEUS_TIMEOUT=30

# Server IP Addresses
AI_SERVER_IP=192.168.50.118
APP_SERVER_IP=192.168.50.164
STORAGE_SERVER_IP=192.168.50.223
USER_VM_IP=192.168.50.210
PROXMOX_HOST_IP=60.51.17.102
MONITORING_SERVER_IP=192.168.50.73

# WebSocket Configuration
WEBSOCKET_HEARTBEAT_INTERVAL=30
METRICS_UPDATE_INTERVAL=5

# CORS Configuration
CORS_ORIGINS=["http://192.168.50.73:3000", "http://localhost:3000"]

# Logging Configuration
LOG_LEVEL=INFO
LOG_FORMAT=json
```

**Configuration Details:**

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_HOST` | Backend API host | `0.0.0.0` | No |
| `API_PORT` | Backend API port | `8000` | No |
| `DEBUG` | Enable debug mode | `false` | No |
| `PROMETHEUS_URL` | Prometheus server URL | `http://prometheus:9090` | Yes |
| `AI_SERVER_IP` | AI server IP address | - | Yes |
| `APP_SERVER_IP` | App server IP address | - | Yes |
| `STORAGE_SERVER_IP` | Storage server IP address | - | Yes |
| `MONITORING_SERVER_IP` | Monitoring server IP | - | Yes |

### 2. Frontend Configuration

Frontend configuration is handled through environment variables and build-time settings.

**Environment Variables:**

Create [`frontend/.env`](../frontend/.env.example):

```bash
# API Configuration
VITE_API_BASE_URL=http://192.168.50.73:8000
VITE_WS_BASE_URL=ws://192.168.50.73:8000

# Update Intervals (milliseconds)
VITE_METRICS_UPDATE_INTERVAL=5000
VITE_CHART_UPDATE_INTERVAL=1000

# Chart Configuration
VITE_CHART_MAX_DATA_POINTS=50
VITE_CHART_ANIMATION_DURATION=300

# Feature Flags
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_DARK_MODE=true

# Development
VITE_DEV_MODE=false
```

**Build Configuration:**

Modify [`frontend/vite.config.js`](../frontend/vite.config.js):

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://backend:8000',
        ws: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          ui: ['@radix-ui/react-slot', 'class-variance-authority']
        }
      }
    }
  }
})
```

## Prometheus Configuration

### 1. Main Configuration

Edit [`monitoring/prometheus/prometheus.yml`](../monitoring/prometheus/prometheus.yml):

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'infrastructure-monitor'
    environment: 'production'

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          # - alertmanager:9093

scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
    scrape_interval: 30s

  # AI Server monitoring
  - job_name: 'ai-server'
    static_configs:
      - targets: ['192.168.50.118:9100']
    scrape_interval: 15s
    metrics_path: /metrics
    params:
      collect[]:
        - cpu
        - meminfo
        - diskstats
        - netdev
        - loadavg
        - filesystem

  # AI Server GPU monitoring
  - job_name: 'ai-server-gpu'
    static_configs:
      - targets: ['192.168.50.118:9400']
    scrape_interval: 10s
    metrics_path: /metrics

  # App Server monitoring
  - job_name: 'app-server'
    static_configs:
      - targets: ['192.168.50.164:9100']
    scrape_interval: 15s

  # Storage Server monitoring
  - job_name: 'storage-server'
    static_configs:
      - targets: ['192.168.50.223:9100']
    scrape_interval: 15s

  # User VM monitoring
  - job_name: 'user-vm'
    static_configs:
      - targets: ['192.168.50.210:9100']
    scrape_interval: 15s

  # Proxmox Host monitoring
  - job_name: 'proxmox-host'
    static_configs:
      - targets: ['60.51.17.102:9100']
    scrape_interval: 15s

  # Monitoring Server self-monitoring
  - job_name: 'monitoring-server'
    static_configs:
      - targets: ['192.168.50.73:9100']
    scrape_interval: 15s
```

### 2. Storage Configuration

Configure Prometheus data retention and storage:

```yaml
# In docker-compose.yml
services:
  prometheus:
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--storage.tsdb.retention.size=10GB'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
```

### 3. Alert Rules

Create [`monitoring/prometheus/rules/alerts.yml`](../monitoring/prometheus/rules/):

```yaml
groups:
  - name: infrastructure.rules
    rules:
      # High CPU usage
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is above 80% for more than 5 minutes"

      # High memory usage
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is above 85% for more than 5 minutes"

      # High disk usage
      - alert: HighDiskUsage
        expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High disk usage on {{ $labels.instance }}"
          description: "Disk usage is above 90% for more than 5 minutes"

      # Server down
      - alert: ServerDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Server {{ $labels.instance }} is down"
          description: "Server has been down for more than 1 minute"

      # High GPU temperature
      - alert: HighGPUTemperature
        expr: nvidia_gpu_temperature_celsius > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High GPU temperature on {{ $labels.instance }}"
          description: "GPU temperature is above 85°C for more than 5 minutes"
```

## Docker Configuration

### 1. Docker Compose

Main configuration in [`docker-compose.yml`](../docker-compose.yml):

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - VITE_API_BASE_URL=http://192.168.50.73:8000
      - VITE_WS_BASE_URL=ws://192.168.50.73:8000
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - monitoring

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - PROMETHEUS_URL=http://prometheus:9090
      - AI_SERVER_IP=192.168.50.118
      - APP_SERVER_IP=192.168.50.164
      - STORAGE_SERVER_IP=192.168.50.223
    env_file:
      - ./backend/.env
    depends_on:
      - prometheus
    restart: unless-stopped
    networks:
      - monitoring

  prometheus:
    image: prom/prometheus:v2.45.0
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/prometheus/rules:/etc/prometheus/rules
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--storage.tsdb.retention.size=10GB'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    restart: unless-stopped
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:10.0.0
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus
    restart: unless-stopped
    networks:
      - monitoring

volumes:
  prometheus_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge
```

### 2. Environment-Specific Overrides

Create [`docker-compose.override.yml`](../docker-compose.override.yml) for local development:

```yaml
version: '3.8'

services:
  frontend:
    environment:
      - VITE_API_BASE_URL=http://localhost:8000
      - VITE_WS_BASE_URL=ws://localhost:8000
      - VITE_DEV_MODE=true
    volumes:
      - ./frontend/src:/app/src
    command: npm run dev

  backend:
    environment:
      - DEBUG=true
      - LOG_LEVEL=DEBUG
    volumes:
      - ./backend/app:/app/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  prometheus:
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=7d'
      - '--web.enable-lifecycle'
      - '--log.level=debug'
```

## Network Configuration

### 1. Firewall Settings

Configure firewall rules on each server:

**Monitoring Server (192.168.50.73):**
```bash
# Allow dashboard access
sudo ufw allow 3000/tcp comment "Frontend Dashboard"
sudo ufw allow 8000/tcp comment "Backend API"
sudo ufw allow 9090/tcp comment "Prometheus (optional)"

# Allow from specific networks only
sudo ufw allow from 192.168.50.0/24 to any port 3000
sudo ufw allow from 192.168.50.0/24 to any port 8000
```

**Target Servers (AI, App, Storage):**
```bash
# Allow Node Exporter access from monitoring server
sudo ufw allow from 192.168.50.73 to any port 9100 comment "Node Exporter"

# For AI server, also allow GPU Exporter
sudo ufw allow from 192.168.50.73 to any port 9400 comment "GPU Exporter"
```

### 2. Network Routing

Ensure proper network routing between servers:

```bash
# Test connectivity from monitoring server
ping 192.168.50.118  # AI Server
ping 192.168.50.164  # App Server
ping 192.168.50.223  # Storage Server
ping 192.168.50.210  # User VM
ping 60.51.17.102    # Proxmox Host

# Test port connectivity
nc -zv 192.168.50.118 9100
nc -zv 192.168.50.118 9400
```

## Monitoring Configuration

### 1. Node Exporter Configuration

Create systemd service for Node Exporter on each target server:

```bash
# /etc/systemd/system/node_exporter.service
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter \
  --collector.systemd \
  --collector.processes \
  --collector.interrupts \
  --collector.tcpstat \
  --collector.meminfo_numa \
  --no-collector.hwmon

[Install]
WantedBy=multi-user.target
```

### 2. GPU Exporter Configuration

For AI server GPU monitoring:

```bash
# Docker command for GPU Exporter
docker run -d \
  --restart=unless-stopped \
  --gpus all \
  -p 9400:9400 \
  --name gpu_exporter \
  mindprince/nvidia_gpu_prometheus_exporter:0.1
```

### 3. Custom Metrics

Add custom application metrics to your services:

**Python Example:**
```python
from prometheus_client import Counter, Histogram, Gauge, start_http_server

# Define metrics
REQUEST_COUNT = Counter('app_requests_total', 'Total requests')
REQUEST_LATENCY = Histogram('app_request_duration_seconds', 'Request latency')
ACTIVE_USERS = Gauge('app_active_users', 'Active users')

# Use in your application
REQUEST_COUNT.inc()
REQUEST_LATENCY.observe(0.1)
ACTIVE_USERS.set(42)

# Start metrics server
start_http_server(8080)
```

## Performance Tuning

### 1. Backend Performance

**FastAPI Configuration:**
```python
# In backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI(
    title="Infrastructure Monitoring API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Configure Uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        workers=4,  # Adjust based on CPU cores
        loop="uvloop",
        http="httptools"
    )
```

### 2. Frontend Performance

**Vite Build Optimization:**
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          utils: ['date-fns', 'lodash']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
```

### 3. Prometheus Performance

**Query Optimization:**
```yaml
# Reduce scrape intervals for less critical metrics
scrape_configs:
  - job_name: 'detailed-metrics'
    scrape_interval: 15s
    
  - job_name: 'basic-metrics'
    scrape_interval: 60s
```

**Storage Optimization:**
```bash
# Prometheus startup flags
--storage.tsdb.retention.time=30d
--storage.tsdb.retention.size=10GB
--storage.tsdb.wal-compression
--storage.tsdb.min-block-duration=2h
--storage.tsdb.max-block-duration=25h
```

## Security Configuration

### 1. API Security

**Rate Limiting:**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/servers/overview")
@limiter.limit("10/minute")
async def get_overview(request: Request):
    # API endpoint logic
    pass
```

### 2. HTTPS Configuration

**Nginx Reverse Proxy:**
```nginx
server {
    listen 443 ssl http2;
    server_name monitoring.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://192.168.50.73:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://192.168.50.73:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /ws/ {
        proxy_pass http://192.168.50.73:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Backup Configuration

### 1. Prometheus Data Backup

```bash
#!/bin/bash
# backup-prometheus.sh

BACKUP_DIR="/backup/prometheus"
PROMETHEUS_DATA="/var/lib/docker/volumes/virt-gui_prometheus_data/_data"

# Create backup
tar -czf "$BACKUP_DIR/prometheus-$(date +%Y%m%d-%H%M%S).tar.gz" \
    -C "$PROMETHEUS_DATA" .

# Keep only last 7 days
find "$BACKUP_DIR" -name "prometheus-*.tar.gz" -mtime +7 -delete
```

### 2. Configuration Backup

```bash
#!/bin/bash
# backup-config.sh

BACKUP_DIR="/backup/config"
PROJECT_DIR="/path/to/virt-gui"

# Backup configuration files
tar -czf "$BACKUP_DIR/config-$(date +%Y%m%d-%H%M%S).tar.gz" \
    -C "$PROJECT_DIR" \
    docker-compose.yml \
    backend/.env \
    frontend/.env \
    monitoring/prometheus/ \
    monitoring/grafana/
```

This configuration guide provides comprehensive settings for customizing the Infrastructure Monitoring Dashboard to your specific environment and requirements.