#!/bin/bash

# Fix Node Exporter service configuration
# Run this script to fix the regex patterns in the systemd service

set -e

NODE_EXPORTER_USER="node_exporter"
NODE_EXPORTER_GROUP="node_exporter"

echo "Fixing Node Exporter service configuration..."

# Stop the service if it's running
sudo systemctl stop node_exporter || true

# Create corrected systemd service
sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<'EOF'
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter \
    --web.listen-address=:9100 \
    --path.procfs=/proc \
    --path.sysfs=/sys \
    --collector.filesystem.mount-points-exclude="^/(sys|proc|dev|host|etc|rootfs/var/lib/docker/containers|rootfs/var/lib/docker/overlay2|rootfs/run/docker/netns|rootfs/var/lib/docker/aufs)($$|/)" \
    --collector.filesystem.fs-types-exclude="^(autofs|binfmt_misc|bpf|cgroup2?|configfs|debugfs|devpts|devtmpfs|fusectl|hugetlbfs|iso9660|mqueue|nsfs|overlay|proc|procfs|pstore|rpc_pipefs|securityfs|selinuxfs|squashfs|sysfs|tracefs)$$"

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

# Check status
echo "Node Exporter service fixed!"
echo "Service status:"
sudo systemctl status node_exporter --no-pager

echo ""
echo "Node Exporter is now running on port 9100"
echo "You can test it by visiting: http://$(hostname -I | awk '{print $1}'):9100/metrics"