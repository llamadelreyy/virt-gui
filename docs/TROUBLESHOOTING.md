# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the Infrastructure Monitoring Dashboard.

## Quick Diagnostics

### 1. Check Service Status

```bash
# Check all services
docker-compose ps

# Check specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs prometheus
docker-compose logs grafana
```

### 2. Verify Network Connectivity

```bash
# Test server connectivity
ping 192.168.50.118  # AI Server
ping 192.168.50.164  # App Server
ping 192.168.50.223  # Storage Server
ping 192.168.50.210  # User VM
ping 60.51.17.102    # Proxmox Host

# Test Node Exporter endpoints
curl http://192.168.50.118:9100/metrics
curl http://192.168.50.164:9100/metrics
curl http://192.168.50.223:9100/metrics
```

### 3. Check API Health

```bash
# Test API health
curl http://192.168.50.73:8000/api/health

# Test specific endpoints
curl http://192.168.50.73:8000/api/servers/overview
curl http://192.168.50.73:8000/api/ai-server/
```

## Common Issues

### Backend Issues

#### Issue: Backend won't start

**Symptoms:**
- Docker container exits immediately
- Error: "ModuleNotFoundError" or "ImportError"

**Solutions:**

1. **Check Python dependencies:**
```bash
# Rebuild backend container
docker-compose build backend --no-cache
docker-compose up backend
```

2. **Verify environment variables:**
```bash
# Check .env file exists
ls -la backend/.env

# Verify configuration
docker-compose exec backend python -c "from app.config import settings; print(settings.dict())"
```

3. **Check port conflicts:**
```bash
# Check if port 8000 is in use
sudo netstat -tlnp | grep :8000
sudo lsof -i :8000
```

#### Issue: Prometheus connection failed

**Symptoms:**
- Error: "Connection refused" to Prometheus
- No metrics data in API responses

**Solutions:**

1. **Verify Prometheus is running:**
```bash
# Check Prometheus container
docker-compose ps prometheus

# Check Prometheus logs
docker-compose logs prometheus

# Test Prometheus directly
curl http://192.168.50.73:9090/api/v1/query?query=up
```

2. **Check Prometheus configuration:**
```bash
# Verify prometheus.yml
cat monitoring/prometheus/prometheus.yml

# Restart Prometheus
docker-compose restart prometheus
```

3. **Verify Node Exporters:**
```bash
# Check if Node Exporters are running on target servers
curl http://192.168.50.118:9100/metrics
curl http://192.168.50.164:9100/metrics
curl http://192.168.50.223:9100/metrics
```

#### Issue: WebSocket connections failing

**Symptoms:**
- Frontend shows "Disconnected" status
- No real-time updates
- WebSocket errors in browser console

**Solutions:**

1. **Check WebSocket endpoint:**
```bash
# Test WebSocket connection
wscat -c ws://192.168.50.73:8000/ws/metrics
```

2. **Verify CORS settings:**
```bash
# Check backend CORS configuration
docker-compose exec backend python -c "from app.main import app; print(app.middleware)"
```

3. **Check firewall/proxy settings:**
```bash
# Ensure WebSocket ports are open
sudo ufw status
sudo iptables -L
```

### Frontend Issues

#### Issue: Frontend won't load

**Symptoms:**
- Blank page or loading spinner
- 404 errors in browser console
- "Cannot GET /" error

**Solutions:**

1. **Check frontend container:**
```bash
# Verify frontend is running
docker-compose ps frontend

# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend --no-cache
```

2. **Verify API connectivity:**
```bash
# Test from frontend container
docker-compose exec frontend curl http://backend:8000/api/health

# Test from host
curl http://192.168.50.73:8000/api/health
```

3. **Check browser console:**
- Open browser developer tools (F12)
- Look for JavaScript errors
- Check Network tab for failed requests

#### Issue: Charts not displaying

**Symptoms:**
- Empty chart areas
- "No data available" messages
- Chart loading indefinitely

**Solutions:**

1. **Verify data flow:**
```bash
# Check API responses
curl http://192.168.50.73:8000/api/servers/overview

# Check WebSocket messages
wscat -c ws://192.168.50.73:8000/ws/metrics
```

2. **Check browser console for errors:**
- Look for Recharts errors
- Verify data format matches expected structure

3. **Clear browser cache:**
```bash
# Hard refresh
Ctrl+F5 (Windows/Linux)
Cmd+Shift+R (Mac)
```

### Monitoring Issues

#### Issue: No metrics from servers

**Symptoms:**
- All servers show "offline" status
- No CPU/memory/disk data
- Prometheus shows targets as "down"

**Solutions:**

1. **Install Node Exporter on target servers:**
```bash
# On each server (AI, App, Storage)
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
tar xvfz node_exporter-1.6.1.linux-amd64.tar.gz
sudo cp node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/
sudo useradd --no-create-home --shell /bin/false node_exporter
sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter

# Create systemd service
sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter
```

2. **Check firewall settings:**
```bash
# On each server, allow port 9100
sudo ufw allow 9100
sudo iptables -A INPUT -p tcp --dport 9100 -j ACCEPT
```

3. **Verify Prometheus targets:**
- Open http://192.168.50.73:9090/targets
- Check if all targets are "UP"

#### Issue: GPU metrics missing

**Symptoms:**
- AI server shows no GPU data
- GPU charts are empty
- "GPU not available" messages

**Solutions:**

1. **Install NVIDIA GPU Exporter on AI server:**
```bash
# On AI server (192.168.50.118)
docker run -d --restart=unless-stopped \
  --gpus all \
  -p 9400:9400 \
  --name gpu_exporter \
  mindprince/nvidia_gpu_prometheus_exporter:0.1
```

2. **Verify GPU Exporter:**
```bash
# Test GPU metrics endpoint
curl http://192.168.50.118:9400/metrics
```

3. **Check NVIDIA drivers:**
```bash
# On AI server
nvidia-smi
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
```

### Network Issues

#### Issue: Cannot access dashboard

**Symptoms:**
- Connection timeout to 192.168.50.73:3000
- "This site can't be reached" error

**Solutions:**

1. **Check monitoring server status:**
```bash
# On monitoring server (192.168.50.73)
docker-compose ps
sudo netstat -tlnp | grep :3000
```

2. **Verify firewall settings:**
```bash
# On monitoring server
sudo ufw status
sudo ufw allow 3000
sudo ufw allow 8000
sudo ufw allow 9090
```

3. **Check network routing:**
```bash
# From your machine
traceroute 192.168.50.73
ping 192.168.50.73
```

#### Issue: Servers showing as offline

**Symptoms:**
- All or some servers show "offline" status
- Intermittent connectivity issues

**Solutions:**

1. **Check network connectivity:**
```bash
# From monitoring server
ping -c 4 192.168.50.118
ping -c 4 192.168.50.164
ping -c 4 192.168.50.223
```

2. **Verify DNS resolution:**
```bash
# Check if hostnames resolve
nslookup 192.168.50.118
dig 192.168.50.118
```

3. **Check for network congestion:**
```bash
# Monitor network traffic
sudo iftop
sudo nethogs
```

### Performance Issues

#### Issue: Slow dashboard loading

**Symptoms:**
- Dashboard takes long time to load
- Charts update slowly
- High CPU usage on monitoring server

**Solutions:**

1. **Optimize Prometheus queries:**
```bash
# Check Prometheus query performance
curl "http://192.168.50.73:9090/api/v1/query?query=up"
```

2. **Reduce update frequency:**
```javascript
// In frontend/src/App.jsx, increase interval
const METRICS_UPDATE_INTERVAL = 10000; // 10 seconds instead of 5
```

3. **Monitor resource usage:**
```bash
# Check monitoring server resources
docker stats
htop
```

#### Issue: High memory usage

**Symptoms:**
- Monitoring server running out of memory
- Docker containers being killed (OOMKilled)

**Solutions:**

1. **Increase server memory or optimize containers:**
```yaml
# In docker-compose.yml, add memory limits
services:
  backend:
    mem_limit: 512m
  frontend:
    mem_limit: 256m
  prometheus:
    mem_limit: 1g
```

2. **Configure Prometheus retention:**
```yaml
# In monitoring/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  
# Add retention settings
command:
  - '--storage.tsdb.retention.time=7d'
  - '--storage.tsdb.retention.size=1GB'
```

## Debugging Commands

### Container Debugging

```bash
# Enter container shell
docker-compose exec backend bash
docker-compose exec frontend sh

# Check container resources
docker stats

# View container configuration
docker inspect virt-gui_backend_1

# Check container logs with timestamps
docker-compose logs -t backend
```

### API Debugging

```bash
# Test all API endpoints
curl -v http://192.168.50.73:8000/api/health
curl -v http://192.168.50.73:8000/api/servers/overview
curl -v http://192.168.50.73:8000/api/ai-server/
curl -v http://192.168.50.73:8000/api/app-server/
curl -v http://192.168.50.73:8000/api/storage-server/

# Test WebSocket
wscat -c ws://192.168.50.73:8000/ws/metrics
```

### Prometheus Debugging

```bash
# Check Prometheus configuration
curl http://192.168.50.73:9090/api/v1/status/config

# Check targets status
curl http://192.168.50.73:9090/api/v1/targets

# Test specific queries
curl "http://192.168.50.73:9090/api/v1/query?query=node_cpu_seconds_total"
curl "http://192.168.50.73:9090/api/v1/query?query=node_memory_MemAvailable_bytes"
```

## Log Analysis

### Backend Logs

```bash
# View recent backend logs
docker-compose logs --tail=100 backend

# Follow backend logs in real-time
docker-compose logs -f backend

# Search for specific errors
docker-compose logs backend | grep -i error
docker-compose logs backend | grep -i "connection"
```

### Frontend Logs

```bash
# View frontend build logs
docker-compose logs frontend

# Check for JavaScript errors in browser console
# Open Developer Tools (F12) → Console tab
```

### Prometheus Logs

```bash
# View Prometheus logs
docker-compose logs prometheus

# Check for scraping errors
docker-compose logs prometheus | grep -i "error"
docker-compose logs prometheus | grep -i "failed"
```

## Recovery Procedures

### Complete System Reset

```bash
# Stop all services
docker-compose down

# Remove all containers and volumes
docker-compose down -v --remove-orphans

# Clean up Docker system
docker system prune -a

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

### Partial Service Restart

```bash
# Restart specific service
docker-compose restart backend
docker-compose restart frontend
docker-compose restart prometheus

# Rebuild specific service
docker-compose build backend --no-cache
docker-compose up -d backend
```

### Database/Volume Reset

```bash
# Remove Prometheus data
docker-compose down
docker volume rm virt-gui_prometheus_data
docker-compose up -d
```

## Getting Help

### Log Collection

When reporting issues, collect these logs:

```bash
# Create log bundle
mkdir -p /tmp/virt-gui-logs
docker-compose logs > /tmp/virt-gui-logs/docker-compose.log
docker-compose ps > /tmp/virt-gui-logs/containers.txt
docker stats --no-stream > /tmp/virt-gui-logs/stats.txt
curl -s http://192.168.50.73:8000/api/health > /tmp/virt-gui-logs/api-health.json
tar -czf virt-gui-logs.tar.gz -C /tmp virt-gui-logs/
```

### System Information

```bash
# Collect system info
uname -a > system-info.txt
docker version >> system-info.txt
docker-compose version >> system-info.txt
free -h >> system-info.txt
df -h >> system-info.txt
```

### Contact Information

For additional support:
1. Check the project documentation in `/docs/`
2. Review the API documentation at `/docs/API.md`
3. Examine the deployment guide at `/docs/DEPLOYMENT.md`
4. Create an issue with collected logs and system information