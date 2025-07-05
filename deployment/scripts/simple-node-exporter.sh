#!/bin/bash

# Simple Node Exporter installation without complex regex patterns
# This version uses basic configuration that should work reliably

set -e

NODE_EXPORTER_USER="node_exporter"
NODE_EXPORTER_GROUP="node_exporter"

echo "Installing simple Node Exporter configuration..."

# Stop the service if it's running
sudo systemctl stop node_exporter || true

# Create simple systemd service without complex regex patterns
sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<'EOF'
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter --web.listen-address=:9100
SyslogIdentifier=node_exporter
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter

# Wait a moment for service to start
sleep 2

# Check status
echo "Node Exporter service configured with simple settings!"
echo "Service status:"
sudo systemctl status node_exporter --no-pager

echo ""
echo "Node Exporter is now running on port 9100"
echo "You can test it by visiting: http://$(hostname -I | awk '{print $1}'):9100/metrics"

# Test if it's responding
echo ""
echo "Testing Node Exporter endpoint..."
if curl -s http://localhost:9100/metrics | head -5; then
    echo "✅ Node Exporter is responding correctly!"
else
    echo "❌ Node Exporter is not responding. Check the logs with: sudo journalctl -u node_exporter -f"
fi