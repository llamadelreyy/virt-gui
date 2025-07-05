#!/bin/bash

# Install GPU Exporter for NVIDIA GPUs - Version 1.3.1
# Based on official documentation from GitHub
# Run this script ONLY on the AI Server (192.168.50.118)

set -e

VERSION="1.3.1"
GPU_EXPORTER_USER="nvidia_gpu_exporter"
GPU_EXPORTER_GROUP="nvidia_gpu_exporter"

echo "Installing NVIDIA GPU Exporter v${VERSION} for NVIDIA GPUs..."

# Check if nvidia-smi is available
if ! command -v nvidia-smi &> /dev/null; then
    echo "ERROR: nvidia-smi not found. Please install NVIDIA drivers first."
    exit 1
fi

echo "NVIDIA GPU detected:"
nvidia-smi --query-gpu=name,driver_version --format=csv,noheader

# Create system user and group (as per official documentation)
sudo useradd --system --no-create-home --shell /usr/sbin/nologin ${GPU_EXPORTER_USER} || true

# Download and install GPU Exporter using the correct URL format from documentation
cd /tmp

# Clean up any existing files
rm -f nvidia_gpu_exporter* || true

echo "Downloading NVIDIA GPU Exporter v${VERSION}..."
wget https://github.com/utkuozdemir/nvidia_gpu_exporter/releases/download/v${VERSION}/nvidia_gpu_exporter_${VERSION}_linux_x86_64.tar.gz

echo "Extracting archive..."
tar -xvzf nvidia_gpu_exporter_${VERSION}_linux_x86_64.tar.gz

echo "Installing binary..."
sudo mv nvidia_gpu_exporter /usr/bin/nvidia_gpu_exporter
sudo chown root:root /usr/bin/nvidia_gpu_exporter
sudo chmod +x /usr/bin/nvidia_gpu_exporter

# Download the official systemd service file
echo "Installing systemd service..."
sudo wget -O /etc/systemd/system/nvidia_gpu_exporter.service https://raw.githubusercontent.com/utkuozdemir/nvidia_gpu_exporter/main/nvidia_gpu_exporter.service

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable nvidia_gpu_exporter
sudo systemctl start nvidia_gpu_exporter

# Wait a moment for service to start
sleep 3

# Check status
echo "GPU Exporter installation completed!"
echo "Service status:"
sudo systemctl status nvidia_gpu_exporter --no-pager

echo ""
echo "GPU Exporter is now running on port 9835"
echo "You can test it by visiting: http://$(hostname -I | awk '{print $1}'):9835/metrics"

# Test GPU metrics
echo ""
echo "Testing GPU metrics:"
if timeout 10 curl -s http://localhost:9835/metrics | grep -E "nvidia_" | head -5; then
    echo "✅ GPU Exporter is working correctly!"
else
    echo "❌ GPU metrics not available yet. Check logs with: sudo journalctl -u nvidia_gpu_exporter -f"
fi

# Clean up
rm -rf /tmp/nvidia_gpu_exporter*

echo ""
echo "GPU Exporter installation complete!"
echo "The exporter is monitoring $(nvidia-smi --query-gpu=count --format=csv,noheader,nounits) NVIDIA GPU(s)"