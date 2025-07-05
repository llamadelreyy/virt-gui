#!/bin/bash

# Complete setup script for the monitoring dashboard
# Run this on the monitoring server (192.168.50.73)

set -e

echo "🚀 Setting up Infrastructure Monitoring Dashboard..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "Docker installed. Please log out and back in to use Docker without sudo."
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create environment file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "Creating environment configuration..."
    cp backend/.env.example backend/.env
    echo "✅ Environment file created. Please review backend/.env for any custom settings."
fi

# Create necessary directories
echo "Creating directories..."
mkdir -p monitoring/prometheus/rules
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p logs

# Set permissions
chmod +x deployment/scripts/*.sh

echo "📊 Building and starting services..."

# Build and start the monitoring stack
docker-compose up -d --build

echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check Prometheus
if curl -f http://localhost:9090/-/healthy &>/dev/null; then
    echo "✅ Prometheus is healthy"
else
    echo "❌ Prometheus health check failed"
fi

# Check Backend API
if curl -f http://localhost:8000/api/health &>/dev/null; then
    echo "✅ Backend API is healthy"
else
    echo "❌ Backend API health check failed"
fi

# Check Frontend
if curl -f http://localhost:3000/health &>/dev/null; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
fi

# Check Grafana
if curl -f http://localhost:3001/api/health &>/dev/null; then
    echo "✅ Grafana is healthy"
else
    echo "❌ Grafana health check failed"
fi

echo ""
echo "🎉 Monitoring Dashboard Setup Complete!"
echo ""
echo "📱 Access URLs:"
echo "   Dashboard:  http://192.168.50.73:3000"
echo "   API:        http://192.168.50.73:8000"
echo "   Prometheus: http://192.168.50.73:9090"
echo "   Grafana:    http://192.168.50.73:3001 (admin/admin123)"
echo ""
echo "📋 Next Steps:"
echo "1. Install Node Exporter on all servers:"
echo "   - AI Server (192.168.50.118): ./deployment/scripts/install-node-exporter.sh"
echo "   - Storage Server (192.168.50.223): ./deployment/scripts/install-node-exporter.sh"
echo "   - App Server (192.168.50.164): ./deployment/scripts/install-node-exporter.sh"
echo "   - User VM (192.168.50.210): ./deployment/scripts/install-node-exporter.sh"
echo "   - Proxmox (60.51.17.102): ./deployment/scripts/install-node-exporter.sh"
echo ""
echo "2. Install GPU Exporter on AI Server:"
echo "   - AI Server (192.168.50.118): ./deployment/scripts/install-gpu-exporter.sh"
echo ""
echo "3. Verify all exporters are accessible:"
echo "   - Check Prometheus targets: http://192.168.50.73:9090/targets"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "📝 View logs with: docker-compose logs -f [service_name]"
echo "🔄 Restart services with: docker-compose restart"
echo "🛑 Stop services with: docker-compose down"