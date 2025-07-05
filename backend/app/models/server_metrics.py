from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class CPUMetrics(BaseModel):
    usage_percent: float
    cores: int
    temperature: Optional[float] = None
    load_average: Optional[List[float]] = None

class MemoryMetrics(BaseModel):
    used_gb: float
    total_gb: float
    usage_percent: float
    available_gb: float
    cached_gb: Optional[float] = None

class GPUMetrics(BaseModel):
    name: str
    usage_percent: float
    memory_used_mb: float
    memory_total_mb: float
    memory_usage_percent: float
    temperature: float
    power_draw_w: float
    fan_speed_percent: Optional[float] = None

class DiskMetrics(BaseModel):
    mount_point: str
    used_gb: float
    total_gb: float
    usage_percent: float
    available_gb: float
    filesystem: Optional[str] = None

class NetworkMetrics(BaseModel):
    interface: str
    bytes_sent: int
    bytes_recv: int
    packets_sent: int
    packets_recv: int
    errors_in: int
    errors_out: int

class VMMetrics(BaseModel):
    vmid: int
    name: str
    status: str
    cpu_usage: float
    memory_used_gb: float
    memory_total_gb: float
    memory_usage_percent: float
    disk_usage_gb: float
    disk_total_gb: Optional[float] = None
    uptime_seconds: Optional[int] = None

class FileSystemStats(BaseModel):
    mount_point: str
    used_gb: float
    total_gb: float
    usage_percent: float
    file_count: int
    avg_file_size_mb: float
    largest_file_mb: Optional[float] = None

class QdrantMetrics(BaseModel):
    status: str
    collections: int
    total_points: int
    disk_usage_gb: float
    memory_usage_mb: float
    version: Optional[str] = None

class ServerStatus(BaseModel):
    status: str  # online, offline, warning, error
    last_updated: datetime
    uptime_seconds: Optional[int] = None
    response_time_ms: Optional[float] = None

class AIServerMetrics(BaseModel):
    server_status: ServerStatus
    cpu: CPUMetrics
    memory: MemoryMetrics
    gpu: Optional[GPUMetrics] = None
    disks: List[DiskMetrics]
    network: List[NetworkMetrics]

class AppServerMetrics(BaseModel):
    server_status: ServerStatus
    cpu: CPUMetrics
    memory: MemoryMetrics
    disks: List[DiskMetrics]
    network: List[NetworkMetrics]
    proxmox_host: Dict[str, Any]
    vms: List[VMMetrics]

class StorageServerMetrics(BaseModel):
    server_status: ServerStatus
    cpu: CPUMetrics
    memory: MemoryMetrics
    disks: List[DiskMetrics]
    network: List[NetworkMetrics]
    filesystems: List[FileSystemStats]
    qdrant: Optional[QdrantMetrics] = None

class SystemOverview(BaseModel):
    ai_server: AIServerMetrics
    app_server: AppServerMetrics
    storage_server: StorageServerMetrics
    last_updated: datetime
    total_servers: int
    online_servers: int
    alerts_count: int

class MetricsUpdate(BaseModel):
    timestamp: datetime
    server_type: str  # ai, app, storage, overview
    data: Dict[str, Any]
    event_type: str = "metrics_update"