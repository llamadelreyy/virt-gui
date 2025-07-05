# Deployment Guide

This guide will help you deploy the unified monitoring dashboard for your infrastructure.

## Prerequisites

- **Monitoring Server** (192.168.50.73): Ubuntu 20.04+ with Docker and Docker Compose
- **Network Access**: All servers should be accessible from the monitoring server
- **Ports**: Ensure the following ports are open:
  - 9100 (Node Exporter) on all servers
  - 9835 (GPU Exporter) on AI server
  - 6333 (Qdrant) on storage server
  - 3000, 8000, 9090, 3001 on monitoring server

## Quick Start

### 1. Clone and Setup

```bash
# On monitoring server (192.168.50.73)
git clone <repository-url>
cd monitoring-dashboard

# Make scripts executable
chmod +x deployment/scripts/*.sh

# Run the complete setup
./deployment/scripts/setup-monitoring.sh
```

### 2. Install Exporters on Each Server

#### On AI Server (192.168.50.118)
```bash
# Install Node Exporter
curl -fsSL https://raw.githubusercontent.com/your-repo/monitoring-dashboard/main/deployment/scripts/install-node-exporter.sh | bash

# Install GPU Exporter (NVIDIA GPUs only)
curl -fsSL https://raw.githubusercontent.com/your-repo/monitoring-dashboard/main/deployment/scripts/install-gpu-exporter.sh | bash
```

#### On Storage Server (192.168.50.223)
```bash
# Install Node Exporter
curl -fsSL https://raw.githubusercontent.com/your-repo/monitoring-dashboard/main/deployment/scripts/install-node-exporter.sh | bash
```

#### On App Server (192.168.50.164)
```bash
# Install Node Exporter
curl -fsSL https://raw.githubusercontent.com/your-repo/monitoring-dashboard/main/deployment/scripts/install-node-exporter.sh | bash
```

#### On User VM (192.168.50.210)
```bash
# Install Node Exporter
curl -fsSL https://raw.githubusercontent.com/your-repo/monitoring-dashboard/main/deployment/scripts/install-node-exporter.sh | bash
```

#### On Proxmox (60.51.17.102)
```bash
# Install Node Exporter
curl -fsSL https://raw.githubusercontent.com/your-repo/monitoring-dashboard/main/deployment/scripts/install-node-exporter.sh | bash
```

### 3. Verify Installation

1. **Check Dashboard**: http://192.168.50.73:3000
2. **Check API**: http://192.168.50.73:8000/docs
3. **Check Prometheus**: http://192.168.50.73:9090/targets
4. **Check Grafana**: http://192.168.50.73:3001 (admin/admin123)

## Manual Installation

### Step 1: Prepare Monitoring Server

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to use Docker without sudo
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit configuration if needed
nano backend/.env
```

### Step 3: Deploy Services

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 4: Install Node Exporter Manually

On each server, run:

```bash
# Download and install
NODE_EXPORTER_VERSION="1.7.0"
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
tar -xzf node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
sudo cp node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64/node_exporter /usr/local/bin/

# Create service
sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter --web.listen-address=:9100

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter
```

## Configuration

### Environment Variables

Key environment variables in `backend/.env`:

```bash
# Server IPs
AI_SERVER_IP=192.168.50.118
STORAGE_SERVER_IP=192.168.50.223
APP_SERVER_IP=192.168.50.164
USER_VM_IP=192.168.50.210
PROXMOX_IP=60.51.17.102

# Prometheus
PROMETHEUS_URL=http://prometheus:9090

# Qdrant
QDRANT_URL=http://192.168.50.223:6333

# Update intervals
METRICS_UPDATE_INTERVAL=5
WEBSOCKET_HEARTBEAT_INTERVAL=30
```

### Prometheus Configuration

Edit `monitoring/prometheus/prometheus.yml` to adjust:
- Scrape intervals
- Target servers
- Retention policies

### Frontend Configuration

Edit `frontend/vite.config.js` for:
- API proxy settings
- Development server configuration

## Troubleshooting

### Common Issues

1. **Services not starting**
   ```bash
   # Check logs
   docker-compose logs backend
   docker-compose logs frontend
   docker-compose logs prometheus
   ```

2. **Exporters not accessible**
   ```bash
   # Test connectivity
   curl http://192.168.50.118:9100/metrics
   curl http://192.168.50.118:9835/metrics
   ```

3. **WebSocket connection issues**
   ```bash
   # Check backend logs
   docker-compose logs -f backend
   
   # Test WebSocket endpoint
   wscat -c ws://192.168.50.73:8000/ws/metrics
   ```

4. **Prometheus targets down**
   - Check firewall rules
   - Verify exporter services are running
   - Check network connectivity

### Health Checks

```bash
# API Health
curl http://192.168.50.73:8000/api/health

# Frontend Health
curl http://192.168.50.73:3000/health

# Prometheus Health
curl http://192.168.50.73:9090/-/healthy

# Individual server exporters
curl http://192.168.50.118:9100/metrics
curl http://192.168.50.223:9100/metrics
curl http://192.168.50.164:9100/metrics
```

### Log Locations

- **Application logs**: `docker-compose logs [service]`
- **Node Exporter logs**: `sudo journalctl -u node_exporter -f`
- **GPU Exporter logs**: `sudo journalctl -u gpu_exporter -f`

## Maintenance

### Updates

```bash
# Update application
git pull
docker-compose down
docker-compose up -d --build

# Update exporters
# Re-run installation scripts with newer versions
```

### Backup

```bash
# Backup Prometheus data
docker-compose exec prometheus tar czf /tmp/prometheus-backup.tar.gz /prometheus
docker cp prometheus:/tmp/prometheus-backup.tar.gz ./backups/

# Backup Grafana data
docker-compose exec grafana tar czf /tmp/grafana-backup.tar.gz /var/lib/grafana
docker cp grafana:/tmp/grafana-backup.tar.gz ./backups/
```

### Monitoring

- Set up alerts for service downtime
- Monitor disk usage for Prometheus data
- Check exporter service status regularly

## Security

### Firewall Rules

```bash
# On monitoring server
sudo ufw allow 3000  # Dashboard
sudo ufw allow 8000  # API
sudo ufw allow 9090  # Prometheus
sudo ufw allow 3001  # Grafana

# On monitored servers
sudo ufw allow from 192.168.50.73 to any port 9100  # Node Exporter
sudo ufw allow from 192.168.50.73 to any port 9835  # GPU Exporter (AI server only)
```

### Authentication

- Change default Grafana password
- Consider adding authentication to Prometheus
- Use HTTPS in production with reverse proxy

## Performance Tuning

### Prometheus

- Adjust retention time based on storage
- Tune scrape intervals for performance
- Use recording rules for complex queries

### Backend

- Adjust worker processes in production
- Configure connection pooling
- Set appropriate timeout values

### Frontend

- Enable gzip compression
- Configure CDN for static assets
- Optimize bundle size