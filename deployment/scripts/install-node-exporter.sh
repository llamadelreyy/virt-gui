#!/bin/bash

# Install Node Exporter on Ubuntu/Debian systems
# Run this script on each server: AI, Storage, App, User VM, Proxmox

set -e

NODE_EXPORTER_VERSION="1.7.0"
NODE_EXPORTER_USER="node_exporter"
NODE_EXPORTER_GROUP="node_exporter"

echo "Installing Node Exporter v${NODE_EXPORTER_VERSION}..."

# Create user and group
sudo groupadd --system ${NODE_EXPORTER_GROUP} || true
sudo useradd -s /sbin/nologin --system -g ${NODE_EXPORTER_GROUP} ${NODE_EXPORTER_USER} || true

# Download and install Node Exporter
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz

tar -xzf node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
sudo cp node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64/node_exporter /usr/local/bin/

# Set permissions
sudo chown ${NODE_EXPORTER_USER}:${NODE_EXPORTER_GROUP} /usr/local/bin/node_exporter
sudo chmod +x /usr/local/bin/node_exporter

# Create systemd service
sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=${NODE_EXPORTER_USER}
Group=${NODE_EXPORTER_GROUP}
Type=simple
ExecStart=/usr/local/bin/node_exporter \\
    --web.listen-address=:9100 \\
    --path.procfs=/proc \\
    --path.sysfs=/sys \\
    --collector.filesystem.mount-points-exclude="^/(sys|proc|dev|host|etc|rootfs/var/lib/docker/containers|rootfs/var/lib/docker/overlay2|rootfs/run/docker/netns|rootfs/var/lib/docker/aufs)($$|/)" \\
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
echo "Node Exporter installation completed!"
echo "Service status:"
sudo systemctl status node_exporter --no-pager

echo ""
echo "Node Exporter is now running on port 9100"
echo "You can test it by visiting: http://$(hostname -I | awk '{print $1}'):9100/metrics"

# Clean up
rm -rf /tmp/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64*

echo "Installation complete!"