#!/bin/bash

# Install GPU Exporter for NVIDIA GPUs
# Run this script ONLY on the AI Server (192.168.50.118)

set -e

GPU_EXPORTER_VERSION="1.2.1"
GPU_EXPORTER_USER="gpu_exporter"
GPU_EXPORTER_GROUP="gpu_exporter"

echo "Installing GPU Exporter v${GPU_EXPORTER_VERSION} for NVIDIA GPUs..."

# Check if nvidia-smi is available
if ! command -v nvidia-smi &> /dev/null; then
    echo "ERROR: nvidia-smi not found. Please install NVIDIA drivers first."
    exit 1
fi

echo "NVIDIA GPU detected:"
nvidia-smi --query-gpu=name,driver_version --format=csv,noheader

# Create user and group
sudo groupadd --system ${GPU_EXPORTER_GROUP} || true
sudo useradd -s /sbin/nologin --system -g ${GPU_EXPORTER_GROUP} ${GPU_EXPORTER_USER} || true

# Download and install GPU Exporter
cd /tmp
wget https://github.com/utkuozdemir/nvidia_gpu_exporter/releases/download/v${GPU_EXPORTER_VERSION}/nvidia_gpu_exporter-${GPU_EXPORTER_VERSION}-linux-amd64.tar.gz

tar -xzf nvidia_gpu_exporter-${GPU_EXPORTER_VERSION}-linux-amd64.tar.gz
sudo cp nvidia_gpu_exporter /usr/local/bin/

# Set permissions
sudo chown ${GPU_EXPORTER_USER}:${GPU_EXPORTER_GROUP} /usr/local/bin/nvidia_gpu_exporter
sudo chmod +x /usr/local/bin/nvidia_gpu_exporter

# Create systemd service
sudo tee /etc/systemd/system/gpu_exporter.service > /dev/null <<EOF
[Unit]
Description=NVIDIA GPU Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=${GPU_EXPORTER_USER}
Group=${GPU_EXPORTER_GROUP}
Type=simple
ExecStart=/usr/local/bin/nvidia_gpu_exporter \\
    --web.listen-address=:9835 \\
    --nvidia-smi-command=nvidia-smi

SyslogIdentifier=gpu_exporter
Restart=always
RestartSec=5

# Allow access to nvidia-smi
SupplementaryGroups=video

[Install]
WantedBy=multi-user.target
EOF

# Add user to video group for GPU access
sudo usermod -a -G video ${GPU_EXPORTER_USER}

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable gpu_exporter
sudo systemctl start gpu_exporter

# Check status
echo "GPU Exporter installation completed!"
echo "Service status:"
sudo systemctl status gpu_exporter --no-pager

echo ""
echo "GPU Exporter is now running on port 9835"
echo "You can test it by visiting: http://$(hostname -I | awk '{print $1}'):9835/metrics"

# Test GPU metrics
echo ""
echo "Testing GPU metrics:"
timeout 5 curl -s http://localhost:9835/metrics | grep -E "nvidia_smi_" | head -5 || echo "Metrics endpoint not ready yet, please wait a moment and try: curl http://localhost:9835/metrics"

# Clean up
rm -rf /tmp/nvidia_gpu_exporter*

echo "GPU Exporter installation complete!"