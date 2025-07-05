# Unified Infrastructure Monitoring Dashboard

A comprehensive monitoring solution for AI, App, and Storage servers using React, FastAPI, and Prometheus.

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + TailwindCSS + Shadcn UI
- **Backend**: FastAPI + WebSocket + Prometheus integration
- **Monitoring**: Prometheus + Node Exporter + GPU Exporter
- **Real-time Updates**: WebSocket connections

## 🖥️ Server Infrastructure

- **Monitoring Server**: 192.168.50.73 (Dashboard deployment)
- **AI Server**: 192.168.50.118 (GPU monitoring)
- **Storage Server**: 192.168.50.223 (File system + Qdrant)
- **App Server**: 192.168.50.164 (Proxmox host)
- **User VM**: 192.168.50.210 (Proxmox VM)
- **Proxmox**: 60.51.17.102 (Proxmox system)

## 🚀 Quick Start

### 1. Install Node Exporters on All Servers

```bash
# Run on each server (AI, Storage, App, User VM, Proxmox)
cd deployment/scripts
chmod +x install-node-exporter.sh
sudo ./install-node-exporter.sh
```

### 2. Install GPU Exporter on AI Server

```bash
# Run on AI Server (192.168.50.118)
cd deployment/scripts
chmod +x install-gpu-exporter.sh
sudo ./install-gpu-exporter.sh
```

### 3. Deploy Monitoring Dashboard

```bash
# On monitoring server (192.168.50.73)
docker-compose up -d
```

### 4. Access Dashboard

- **Dashboard**: http://192.168.50.73:3000
- **API**: http://192.168.50.73:8000
- **Prometheus**: http://192.168.50.73:9090

## 📊 Features

- ✅ Real-time metrics via WebSocket
- ✅ GPU monitoring (NVIDIA)
- ✅ Proxmox VM monitoring
- ✅ Storage and file system analytics
- ✅ Qdrant database statistics
- ✅ Grafana-compatible endpoints
- ✅ Responsive design
- ✅ Multi-server unified view

## 📁 Project Structure

```
monitoring-dashboard/
├── backend/           # FastAPI application
├── frontend/          # React dashboard
├── monitoring/        # Prometheus configuration
├── deployment/        # Docker & deployment scripts
└── docs/             # Documentation
```

## 🔧 Configuration

See individual component README files for detailed configuration options.

## 📖 Documentation

- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture Details](docs/ARCHITECTURE.md)