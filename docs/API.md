# API Documentation

The Infrastructure Monitoring Dashboard provides a comprehensive REST API for accessing server metrics and system information.

## Base URL

```
http://192.168.50.73:8000
```

## Authentication

Currently, the API does not require authentication. In production, consider implementing API keys or OAuth.

## Response Format

All API responses follow this structure:

```json
{
  "data": {},
  "timestamp": "2025-01-05T20:15:00Z",
  "status": "success"
}
```

Error responses:

```json
{
  "error": "Error message",
  "detail": "Detailed error information",
  "timestamp": "2025-01-05T20:15:00Z",
  "status": "error"
}
```

## Endpoints

### Health & Overview

#### GET /api/health
Get API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-05T20:15:00Z",
  "services": {
    "api": "healthy",
    "prometheus": "healthy",
    "websocket": "healthy"
  },
  "version": "1.0.0"
}
```

#### GET /api/servers/overview
Get complete overview of all servers.

**Response:**
```json
{
  "ai_server": {
    "server_status": {
      "status": "online",
      "last_updated": "2025-01-05T20:15:00Z",
      "response_time_ms": 45.2
    },
    "cpu": {
      "usage_percent": 45.2,
      "cores": 16,
      "temperature": 65
    },
    "memory": {
      "used_gb": 28.5,
      "total_gb": 64,
      "usage_percent": 44.5,
      "available_gb": 35.5
    },
    "gpu": {
      "name": "NVIDIA RTX 4090",
      "usage_percent": 78.3,
      "memory_used_mb": 18432,
      "memory_total_mb": 24576,
      "memory_usage_percent": 75.0,
      "temperature": 72,
      "power_draw_w": 350
    },
    "disks": [...],
    "network": [...]
  },
  "app_server": {...},
  "storage_server": {...},
  "last_updated": "2025-01-05T20:15:00Z",
  "total_servers": 3,
  "online_servers": 3,
  "alerts_count": 0
}
```

#### GET /api/servers/summary
Get simplified summary of all servers.

**Response:**
```json
{
  "summary": {
    "total_servers": 3,
    "online_servers": 3,
    "alerts_count": 0,
    "last_updated": "2025-01-05T20:15:00Z"
  },
  "servers": {
    "ai_server": {
      "status": "online",
      "cpu_usage": 45.2,
      "memory_usage": 44.5,
      "gpu_usage": 78.3,
      "response_time_ms": 45.2
    },
    "app_server": {...},
    "storage_server": {...}
  }
}
```

### AI Server Endpoints

#### GET /api/ai-server/
Get complete AI server metrics.

#### GET /api/ai-server/gpu
Get GPU-specific metrics.

**Response:**
```json
{
  "gpu": {
    "name": "NVIDIA RTX 4090",
    "usage_percent": 78.3,
    "memory_used_mb": 18432,
    "memory_total_mb": 24576,
    "memory_usage_percent": 75.0,
    "temperature": 72,
    "power_draw_w": 350,
    "fan_speed_percent": 65
  },
  "server_status": {
    "status": "online",
    "last_updated": "2025-01-05T20:15:00Z"
  }
}
```

#### GET /api/ai-server/cpu
Get CPU metrics.

**Response:**
```json
{
  "cpu": {
    "usage_percent": 45.2,
    "cores": 16,
    "temperature": 65,
    "load_average": [1.2, 1.5, 1.8]
  },
  "server_status": {...}
}
```

#### GET /api/ai-server/memory
Get memory metrics.

#### GET /api/ai-server/storage
Get storage/disk metrics.

#### GET /api/ai-server/network
Get network interface metrics.

#### GET /api/ai-server/health
Get AI server health status.

### App Server Endpoints

#### GET /api/app-server/
Get complete app server metrics.

#### GET /api/app-server/proxmox
Get Proxmox host metrics.

**Response:**
```json
{
  "proxmox_host": {
    "cpu_usage": 23.1,
    "memory_usage": 67.8,
    "storage_usage": 45.2,
    "uptime_hours": 168,
    "vm_count": 2
  },
  "server_status": {...}
}
```

#### GET /api/app-server/vms
Get all VM metrics.

**Response:**
```json
{
  "vms": [
    {
      "vmid": 100,
      "name": "user-vm",
      "status": "running",
      "cpu_usage": 15.3,
      "memory_used_gb": 4.2,
      "memory_total_gb": 8,
      "memory_usage_percent": 52.5,
      "disk_usage_gb": 25.6,
      "uptime_seconds": 86400
    }
  ],
  "vm_count": 1,
  "running_vms": 1,
  "server_status": {...}
}
```

#### GET /api/app-server/vms/{vm_id}
Get specific VM metrics by ID.

**Parameters:**
- `vm_id` (int): VM ID

#### GET /api/app-server/cpu
Get CPU metrics.

#### GET /api/app-server/memory
Get memory metrics.

#### GET /api/app-server/storage
Get storage metrics.

#### GET /api/app-server/network
Get network metrics.

#### GET /api/app-server/health
Get app server health status.

### Storage Server Endpoints

#### GET /api/storage-server/
Get complete storage server metrics.

#### GET /api/storage-server/filesystems
Get filesystem metrics.

**Response:**
```json
{
  "filesystems": [
    {
      "mount_point": "/mnt/ingest",
      "used_gb": 1250.5,
      "total_gb": 2000,
      "usage_percent": 62.5,
      "file_count": 15420,
      "avg_file_size_mb": 85.3,
      "largest_file_mb": 1024.0
    }
  ],
  "total_filesystems": 1,
  "total_used_gb": 1250.5,
  "total_capacity_gb": 2000,
  "server_status": {...}
}
```

#### GET /api/storage-server/filesystems/{mount_point}
Get specific filesystem metrics.

**Parameters:**
- `mount_point` (string): URL-encoded mount point (e.g., `/mnt/ingest` becomes `%2Fmnt%2Fingest`)

#### GET /api/storage-server/qdrant
Get Qdrant database metrics.

**Response:**
```json
{
  "qdrant": {
    "status": "running",
    "collections": 3,
    "total_points": 1250000,
    "disk_usage_gb": 45.2,
    "memory_usage_mb": 512,
    "version": "1.7.0"
  },
  "server_status": {...}
}
```

#### GET /api/storage-server/cpu
Get CPU metrics.

#### GET /api/storage-server/memory
Get memory metrics.

#### GET /api/storage-server/storage
Get storage metrics.

#### GET /api/storage-server/network
Get network metrics.

#### GET /api/storage-server/health
Get storage server health status.

### Prometheus Integration

#### GET /api/metrics/prometheus
Get Grafana-compatible Prometheus metrics.

**Response:**
```json
{
  "metrics": [
    "ai_server_cpu_usage_percent 45.2",
    "ai_server_memory_usage_percent 44.5",
    "ai_server_gpu_usage_percent 78.3",
    "storage_server_cpu_usage_percent 23.1",
    "system_total_servers 3",
    "system_online_servers 3"
  ],
  "timestamp": "2025-01-05T20:15:00Z"
}
```

## WebSocket API

### Connection

Connect to real-time metrics stream:

```javascript
const ws = new WebSocket('ws://192.168.50.73:8000/ws/metrics');
```

### Message Types

#### Incoming Messages

**Metrics Update:**
```json
{
  "event_type": "metrics_update",
  "server_type": "ai_server",
  "data": {...},
  "timestamp": "2025-01-05T20:15:00Z"
}
```

**Connection Established:**
```json
{
  "event_type": "connection_established",
  "message": "Connected to metrics stream",
  "timestamp": "2025-01-05T20:15:00Z"
}
```

**Heartbeat:**
```json
{
  "event_type": "heartbeat",
  "timestamp": "2025-01-05T20:15:00Z",
  "connections": 1
}
```

**Error:**
```json
{
  "event_type": "error",
  "message": "Error description",
  "timestamp": "2025-01-05T20:15:00Z"
}
```

#### Outgoing Messages

**Ping:**
```json
{
  "type": "ping",
  "timestamp": "2025-01-05T20:15:00Z"
}
```

**Request Update:**
```json
{
  "type": "request_update",
  "timestamp": "2025-01-05T20:15:00Z"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 404  | Resource not found |
| 500  | Internal server error |
| 503  | Service unavailable |

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting in production.

## Examples

### JavaScript/Fetch

```javascript
// Get server overview
const response = await fetch('http://192.168.50.73:8000/api/servers/overview');
const data = await response.json();

// Get specific GPU metrics
const gpuResponse = await fetch('http://192.168.50.73:8000/api/ai-server/gpu');
const gpuData = await gpuResponse.json();
```

### Python/Requests

```python
import requests

# Get server overview
response = requests.get('http://192.168.50.73:8000/api/servers/overview')
data = response.json()

# Get VM metrics
vm_response = requests.get('http://192.168.50.73:8000/api/app-server/vms')
vm_data = vm_response.json()
```

### cURL

```bash
# Get health status
curl http://192.168.50.73:8000/api/health

# Get AI server metrics
curl http://192.168.50.73:8000/api/ai-server/

# Get Qdrant metrics
curl http://192.168.50.73:8000/api/storage-server/qdrant
```

## WebSocket Example

```javascript
const ws = new WebSocket('ws://192.168.50.73:8000/ws/metrics');

ws.onopen = () => {
  console.log('Connected to metrics stream');
  
  // Send ping
  ws.send(JSON.stringify({
    type: 'ping',
    timestamp: new Date().toISOString()
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.event_type) {
    case 'metrics_update':
      console.log(`Received ${data.server_type} metrics:`, data.data);
      break;
    case 'heartbeat':
      console.log('Heartbeat received');
      break;
    case 'error':
      console.error('WebSocket error:', data.message);
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
};
```

## Data Models

### Server Status
```typescript
interface ServerStatus {
  status: "online" | "offline" | "warning" | "error";
  last_updated: string;
  uptime_seconds?: number;
  response_time_ms?: number;
}
```

### CPU Metrics
```typescript
interface CPUMetrics {
  usage_percent: number;
  cores: number;
  temperature?: number;
  load_average?: number[];
}
```

### Memory Metrics
```typescript
interface MemoryMetrics {
  used_gb: number;
  total_gb: number;
  usage_percent: number;
  available_gb: number;
  cached_gb?: number;
}
```

### GPU Metrics
```typescript
interface GPUMetrics {
  name: string;
  usage_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  memory_usage_percent: number;
  temperature: number;
  power_draw_w: number;
  fan_speed_percent?: number;
}