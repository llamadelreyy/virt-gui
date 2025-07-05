#!/bin/bash

# Install GPU Exporter for NVIDIA GPUs - Fixed Version
# Run this script ONLY on the AI Server (192.168.50.118)

set -e

GPU_EXPORTER_USER="gpu_exporter"
GPU_EXPORTER_GROUP="gpu_exporter"

echo "Installing NVIDIA GPU Exporter for NVIDIA GPUs..."

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

# Try different versions and URL formats
cd /tmp

# Clean up any existing files
rm -f nvidia_gpu_exporter* || true

echo "Attempting to download NVIDIA GPU Exporter..."

# Try the latest release approach
DOWNLOAD_SUCCESS=false

# Try version 1.2.1 with different URL formats
for VERSION in "1.2.1" "1.2.0" "1.1.0"; do
    for URL_FORMAT in \
        "https://github.com/utkuozdemir/nvidia_gpu_exporter/releases/download/v${VERSION}/nvidia_gpu_exporter-${VERSION}-linux-amd64.tar.gz" \
        "https://github.com/utkuozdemir/nvidia_gpu_exporter/releases/download/v${VERSION}/nvidia_gpu_exporter_${VERSION}_linux_amd64.tar.gz" \
        "https://github.com/utkuozdemir/nvidia_gpu_exporter/releases/download/${VERSION}/nvidia_gpu_exporter-${VERSION}-linux-amd64.tar.gz"; do
        
        echo "Trying: $URL_FORMAT"
        if wget -q --spider "$URL_FORMAT" 2>/dev/null; then
            echo "Found working URL: $URL_FORMAT"
            wget "$URL_FORMAT"
            DOWNLOAD_SUCCESS=true
            DOWNLOADED_FILE=$(basename "$URL_FORMAT")
            break 2
        fi
    done
done

if [ "$DOWNLOAD_SUCCESS" = false ]; then
    echo "ERROR: Could not download NVIDIA GPU Exporter from any known URL."
    echo "Please check the GitHub releases page: https://github.com/utkuozdemir/nvidia_gpu_exporter/releases"
    exit 1
fi

# Extract the downloaded file
echo "Extracting $DOWNLOADED_FILE..."
tar -xzf "$DOWNLOADED_FILE"

# Find the binary (it might be in a subdirectory)
BINARY_PATH=""
if [ -f "nvidia_gpu_exporter" ]; then
    BINARY_PATH="nvidia_gpu_exporter"
elif [ -f "*/nvidia_gpu_exporter" ]; then
    BINARY_PATH=$(find . -name "nvidia_gpu_exporter" -type f | head -1)
else
    echo "ERROR: Could not find nvidia_gpu_exporter binary in extracted files"
    ls -la
    exit 1
fi

echo "Found binary at: $BINARY_PATH"
sudo cp "$BINARY_PATH" /usr/local/bin/nvidia_gpu_exporter

# Set permissions
sudo chown ${GPU_EXPORTER_USER}:${GPU_EXPORTER_GROUP} /usr/local/bin/nvidia_gpu_exporter
sudo chmod +x /usr/local/bin/nvidia_gpu_exporter

# Create systemd service
sudo tee /etc/systemd/system/gpu_exporter.service > /dev/null <<'EOF'
[Unit]
Description=NVIDIA GPU Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=gpu_exporter
Group=gpu_exporter
Type=simple
ExecStart=/usr/local/bin/nvidia_gpu_exporter \
    --web.listen-address=:9835 \
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

# Wait a moment for service to start
sleep 3

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
if timeout 10 curl -s http://localhost:9835/metrics | grep -E "nvidia_" | head -5; then
    echo "✅ GPU Exporter is working correctly!"
else
    echo "❌ GPU metrics not available yet. Check logs with: sudo journalctl -u gpu_exporter -f"
fi

# Clean up
rm -rf /tmp/nvidia_gpu_exporter*

echo "GPU Exporter installation complete!"