import asyncio
import httpx
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from ..config import settings
from ..models.server_metrics import *
from .prometheus_client import prometheus_client

logger = logging.getLogger(__name__)

class MetricsCollector:
    def __init__(self):
        self.servers = {
            "ai_server": settings.ai_server_ip,
            "storage_server": settings.storage_server_ip,
            "app_server": settings.app_server_ip,
            "user_vm": settings.user_vm_ip,
            "proxmox": settings.proxmox_ip
        }
    
    async def collect_ai_server_metrics(self) -> AIServerMetrics:
        """Collect metrics from AI server"""
        instance = self.servers["ai_server"]
        
        # Check server health
        health = await prometheus_client.check_instance_health(instance)
        server_status = ServerStatus(
            status=health["status"],
            last_updated=health["last_updated"],
            response_time_ms=health.get("response_time_ms")
        )
        
        if health["status"] == "offline":
            return AIServerMetrics(
                server_status=server_status,
                cpu=CPUMetrics(usage_percent=0, cores=0),
                memory=MemoryMetrics(used_gb=0, total_gb=0, usage_percent=0, available_gb=0),
                disks=[],
                network=[]
            )
        
        # Collect CPU metrics
        cpu_usage = await prometheus_client.get_cpu_usage(instance)
        cpu_cores_query = f'count(node_cpu_seconds_total{{mode="idle",instance="{instance}:9100"}}) by (instance)'
        cpu_cores_result = await prometheus_client.query(cpu_cores_query)
        cores = 1
        if cpu_cores_result and cpu_cores_result.get("status") == "success":
            data = cpu_cores_result.get("data", {}).get("result", [])
            if data:
                cores = int(float(data[0]["value"][1]))
        
        cpu = CPUMetrics(
            usage_percent=cpu_usage or 0,
            cores=cores
        )
        
        # Collect memory metrics
        memory_data = await prometheus_client.get_memory_usage(instance)
        memory = MemoryMetrics(
            used_gb=(memory_data.get("used", 0) / (1024**3)) if memory_data else 0,
            total_gb=(memory_data.get("total", 0) / (1024**3)) if memory_data else 0,
            usage_percent=memory_data.get("usage_percent", 0) if memory_data else 0,
            available_gb=(memory_data.get("available", 0) / (1024**3)) if memory_data else 0,
            cached_gb=(memory_data.get("cached", 0) / (1024**3)) if memory_data else 0
        )
        
        # Collect GPU metrics
        gpu_data = await prometheus_client.get_gpu_metrics(instance)
        gpu = None
        if gpu_data:
            gpu = GPUMetrics(
                name=gpu_data.get("name", "Unknown GPU"),
                usage_percent=gpu_data.get("gpu_utilization", 0),
                memory_used_mb=gpu_data.get("memory_used_mb", 0),
                memory_total_mb=gpu_data.get("memory_total_mb", 0),
                memory_usage_percent=gpu_data.get("memory_usage_percent", 0),
                temperature=gpu_data.get("temperature", 0),
                power_draw_w=gpu_data.get("power_draw", 0),
                fan_speed_percent=gpu_data.get("fan_speed", 0)
            )
        
        # Collect disk metrics
        disk_data = await prometheus_client.get_disk_usage(instance)
        disks = []
        if disk_data:
            for disk in disk_data:
                disks.append(DiskMetrics(
                    mount_point=disk["mount_point"],
                    used_gb=disk["used_gb"],
                    total_gb=disk["total_gb"],
                    usage_percent=disk["usage_percent"],
                    available_gb=disk["available_gb"],
                    filesystem=disk.get("filesystem")
                ))
        
        # Collect network metrics
        network_data = await prometheus_client.get_network_metrics(instance)
        network = []
        if network_data:
            for net in network_data:
                network.append(NetworkMetrics(
                    interface=net["interface"],
                    bytes_sent=int(net.get("bytes_sent", 0)),
                    bytes_recv=int(net.get("bytes_recv", 0)),
                    packets_sent=int(net.get("packets_sent", 0)),
                    packets_recv=int(net.get("packets_recv", 0)),
                    errors_in=int(net.get("errors_in", 0)),
                    errors_out=int(net.get("errors_out", 0))
                ))
        
        return AIServerMetrics(
            server_status=server_status,
            cpu=cpu,
            memory=memory,
            gpu=gpu,
            disks=disks,
            network=network
        )
    
    async def collect_storage_server_metrics(self) -> StorageServerMetrics:
        """Collect metrics from storage server"""
        instance = self.servers["storage_server"]
        
        # Check server health
        health = await prometheus_client.check_instance_health(instance)
        server_status = ServerStatus(
            status=health["status"],
            last_updated=health["last_updated"],
            response_time_ms=health.get("response_time_ms")
        )
        
        if health["status"] == "offline":
            return StorageServerMetrics(
                server_status=server_status,
                cpu=CPUMetrics(usage_percent=0, cores=0),
                memory=MemoryMetrics(used_gb=0, total_gb=0, usage_percent=0, available_gb=0),
                disks=[],
                network=[],
                filesystems=[]
            )
        
        # Collect basic metrics (similar to AI server)
        cpu_usage = await prometheus_client.get_cpu_usage(instance)
        cpu_cores_query = f'count(node_cpu_seconds_total{{mode="idle",instance="{instance}:9100"}}) by (instance)'
        cpu_cores_result = await prometheus_client.query(cpu_cores_query)
        cores = 1
        if cpu_cores_result and cpu_cores_result.get("status") == "success":
            data = cpu_cores_result.get("data", {}).get("result", [])
            if data:
                cores = int(float(data[0]["value"][1]))
        
        cpu = CPUMetrics(usage_percent=cpu_usage or 0, cores=cores)
        
        memory_data = await prometheus_client.get_memory_usage(instance)
        memory = MemoryMetrics(
            used_gb=(memory_data.get("used", 0) / (1024**3)) if memory_data else 0,
            total_gb=(memory_data.get("total", 0) / (1024**3)) if memory_data else 0,
            usage_percent=memory_data.get("usage_percent", 0) if memory_data else 0,
            available_gb=(memory_data.get("available", 0) / (1024**3)) if memory_data else 0
        )
        
        disk_data = await prometheus_client.get_disk_usage(instance)
        disks = []
        if disk_data:
            for disk in disk_data:
                disks.append(DiskMetrics(
                    mount_point=disk["mount_point"],
                    used_gb=disk["used_gb"],
                    total_gb=disk["total_gb"],
                    usage_percent=disk["usage_percent"],
                    available_gb=disk["available_gb"],
                    filesystem=disk.get("filesystem")
                ))
        
        network_data = await prometheus_client.get_network_metrics(instance)
        network = []
        if network_data:
            for net in network_data:
                network.append(NetworkMetrics(
                    interface=net["interface"],
                    bytes_sent=int(net.get("bytes_sent", 0)),
                    bytes_recv=int(net.get("bytes_recv", 0)),
                    packets_sent=int(net.get("packets_sent", 0)),
                    packets_recv=int(net.get("packets_recv", 0)),
                    errors_in=int(net.get("errors_in", 0)),
                    errors_out=int(net.get("errors_out", 0))
                ))
        
        # Collect filesystem stats (file counts, etc.)
        filesystems = await self._collect_filesystem_stats(instance)
        
        # Collect Qdrant metrics
        qdrant = await self._collect_qdrant_metrics()
        
        return StorageServerMetrics(
            server_status=server_status,
            cpu=cpu,
            memory=memory,
            disks=disks,
            network=network,
            filesystems=filesystems,
            qdrant=qdrant
        )
    
    async def collect_app_server_metrics(self) -> AppServerMetrics:
        """Collect metrics from app server and Proxmox VMs"""
        instance = self.servers["app_server"]
        
        # Check server health
        health = await prometheus_client.check_instance_health(instance)
        server_status = ServerStatus(
            status=health["status"],
            last_updated=health["last_updated"],
            response_time_ms=health.get("response_time_ms")
        )
        
        if health["status"] == "offline":
            return AppServerMetrics(
                server_status=server_status,
                cpu=CPUMetrics(usage_percent=0, cores=0),
                memory=MemoryMetrics(used_gb=0, total_gb=0, usage_percent=0, available_gb=0),
                disks=[],
                network=[],
                proxmox_host={},
                vms=[]
            )
        
        # Collect basic metrics
        cpu_usage = await prometheus_client.get_cpu_usage(instance)
        cpu_cores_query = f'count(node_cpu_seconds_total{{mode="idle",instance="{instance}:9100"}}) by (instance)'
        cpu_cores_result = await prometheus_client.query(cpu_cores_query)
        cores = 1
        if cpu_cores_result and cpu_cores_result.get("status") == "success":
            data = cpu_cores_result.get("data", {}).get("result", [])
            if data:
                cores = int(float(data[0]["value"][1]))
        
        cpu = CPUMetrics(usage_percent=cpu_usage or 0, cores=cores)
        
        memory_data = await prometheus_client.get_memory_usage(instance)
        memory = MemoryMetrics(
            used_gb=(memory_data.get("used", 0) / (1024**3)) if memory_data else 0,
            total_gb=(memory_data.get("total", 0) / (1024**3)) if memory_data else 0,
            usage_percent=memory_data.get("usage_percent", 0) if memory_data else 0,
            available_gb=(memory_data.get("available", 0) / (1024**3)) if memory_data else 0
        )
        
        disk_data = await prometheus_client.get_disk_usage(instance)
        disks = []
        if disk_data:
            for disk in disk_data:
                disks.append(DiskMetrics(
                    mount_point=disk["mount_point"],
                    used_gb=disk["used_gb"],
                    total_gb=disk["total_gb"],
                    usage_percent=disk["usage_percent"],
                    available_gb=disk["available_gb"],
                    filesystem=disk.get("filesystem")
                ))
        
        network_data = await prometheus_client.get_network_metrics(instance)
        network = []
        if network_data:
            for net in network_data:
                network.append(NetworkMetrics(
                    interface=net["interface"],
                    bytes_sent=int(net.get("bytes_sent", 0)),
                    bytes_recv=int(net.get("bytes_recv", 0)),
                    packets_sent=int(net.get("packets_sent", 0)),
                    packets_recv=int(net.get("packets_recv", 0)),
                    errors_in=int(net.get("errors_in", 0)),
                    errors_out=int(net.get("errors_out", 0))
                ))
        
        # Collect Proxmox host metrics
        proxmox_host = await self._collect_proxmox_host_metrics()
        
        # Collect VM metrics
        vms = await self._collect_vm_metrics()
        
        return AppServerMetrics(
            server_status=server_status,
            cpu=cpu,
            memory=memory,
            disks=disks,
            network=network,
            proxmox_host=proxmox_host,
            vms=vms
        )
    
    async def _collect_filesystem_stats(self, instance: str) -> List[FileSystemStats]:
        """Collect detailed filesystem statistics"""
        # This would typically require custom exporters or scripts
        # For now, we'll use basic disk metrics and simulate file counts
        filesystems = []
        
        disk_data = await prometheus_client.get_disk_usage(instance)
        if disk_data:
            for disk in disk_data:
                if disk["mount_point"] in ["/mnt/ingest", "/mnt/data", "/mnt/storage"]:
                    # Simulate file statistics (in production, use custom exporter)
                    filesystems.append(FileSystemStats(
                        mount_point=disk["mount_point"],
                        used_gb=disk["used_gb"],
                        total_gb=disk["total_gb"],
                        usage_percent=disk["usage_percent"],
                        file_count=int(disk["used_gb"] * 100),  # Simulated
                        avg_file_size_mb=disk["used_gb"] * 1024 / max(1, int(disk["used_gb"] * 100)),  # Simulated
                        largest_file_mb=disk["used_gb"] * 10  # Simulated
                    ))
        
        return filesystems
    
    async def _collect_qdrant_metrics(self) -> Optional[QdrantMetrics]:
        """Collect Qdrant database metrics"""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                # Check Qdrant health
                health_response = await client.get(f"{settings.qdrant_url}/health")
                if health_response.status_code != 200:
                    return None
                
                # Get collections info
                collections_response = await client.get(f"{settings.qdrant_url}/collections")
                collections_data = collections_response.json()
                
                total_points = 0
                collections_count = len(collections_data.get("result", {}).get("collections", []))
                
                # Get detailed collection stats
                for collection in collections_data.get("result", {}).get("collections", []):
                    collection_name = collection["name"]
                    try:
                        info_response = await client.get(f"{settings.qdrant_url}/collections/{collection_name}")
                        info_data = info_response.json()
                        points_count = info_data.get("result", {}).get("points_count", 0)
                        total_points += points_count
                    except:
                        continue
                
                return QdrantMetrics(
                    status="running",
                    collections=collections_count,
                    total_points=total_points,
                    disk_usage_gb=5.2,  # Simulated - would need custom monitoring
                    memory_usage_mb=512,  # Simulated
                    version="1.7.0"  # Simulated
                )
        except Exception as e:
            logger.error(f"Failed to collect Qdrant metrics: {e}")
            return QdrantMetrics(
                status="error",
                collections=0,
                total_points=0,
                disk_usage_gb=0,
                memory_usage_mb=0
            )
    
    async def _collect_proxmox_host_metrics(self) -> Dict[str, Any]:
        """Collect Proxmox host metrics"""
        proxmox_instance = self.servers["proxmox"]
        
        # Collect basic metrics from Proxmox host
        cpu_usage = await prometheus_client.get_cpu_usage(proxmox_instance)
        memory_data = await prometheus_client.get_memory_usage(proxmox_instance)
        disk_data = await prometheus_client.get_disk_usage(proxmox_instance)
        
        storage_usage = 0
        if disk_data:
            for disk in disk_data:
                if "local" in disk["mount_point"] or "rpool" in disk["mount_point"]:
                    storage_usage += disk["usage_percent"]
            storage_usage = storage_usage / len(disk_data) if disk_data else 0
        
        return {
            "cpu_usage": cpu_usage or 0,
            "memory_usage": memory_data.get("usage_percent", 0) if memory_data else 0,
            "storage_usage": storage_usage,
            "uptime_hours": 168,  # Simulated
            "vm_count": 2  # Simulated
        }
    
    async def _collect_vm_metrics(self) -> List[VMMetrics]:
        """Collect metrics from VMs"""
        vms = []
        
        # Collect metrics from User VM
        user_vm_instance = self.servers["user_vm"]
        user_vm_health = await prometheus_client.check_instance_health(user_vm_instance)
        
        if user_vm_health["status"] == "online":
            cpu_usage = await prometheus_client.get_cpu_usage(user_vm_instance)
            memory_data = await prometheus_client.get_memory_usage(user_vm_instance)
            disk_data = await prometheus_client.get_disk_usage(user_vm_instance)
            
            disk_usage = sum(disk["used_gb"] for disk in disk_data) if disk_data else 0
            
            vms.append(VMMetrics(
                vmid=100,
                name="user-vm",
                status="running" if user_vm_health["status"] == "online" else "stopped",
                cpu_usage=cpu_usage or 0,
                memory_used_gb=(memory_data.get("used", 0) / (1024**3)) if memory_data else 0,
                memory_total_gb=(memory_data.get("total", 0) / (1024**3)) if memory_data else 0,
                memory_usage_percent=memory_data.get("usage_percent", 0) if memory_data else 0,
                disk_usage_gb=disk_usage,
                uptime_seconds=86400  # Simulated
            ))
        
        # Add simulated second VM
        vms.append(VMMetrics(
            vmid=101,
            name="app-vm",
            status="running",
            cpu_usage=12.5,
            memory_used_gb=2.1,
            memory_total_gb=4.0,
            memory_usage_percent=52.5,
            disk_usage_gb=15.3,
            uptime_seconds=172800
        ))
        
        return vms
    
    async def collect_all_metrics(self) -> SystemOverview:
        """Collect metrics from all servers"""
        try:
            # Collect metrics from all servers concurrently
            ai_task = asyncio.create_task(self.collect_ai_server_metrics())
            storage_task = asyncio.create_task(self.collect_storage_server_metrics())
            app_task = asyncio.create_task(self.collect_app_server_metrics())
            
            ai_server, storage_server, app_server = await asyncio.gather(
                ai_task, storage_task, app_task, return_exceptions=True
            )
            
            # Handle exceptions
            if isinstance(ai_server, Exception):
                logger.error(f"AI server metrics collection failed: {ai_server}")
                ai_server = AIServerMetrics(
                    server_status=ServerStatus(status="error", last_updated=datetime.now()),
                    cpu=CPUMetrics(usage_percent=0, cores=0),
                    memory=MemoryMetrics(used_gb=0, total_gb=0, usage_percent=0, available_gb=0),
                    disks=[], network=[]
                )
            
            if isinstance(storage_server, Exception):
                logger.error(f"Storage server metrics collection failed: {storage_server}")
                storage_server = StorageServerMetrics(
                    server_status=ServerStatus(status="error", last_updated=datetime.now()),
                    cpu=CPUMetrics(usage_percent=0, cores=0),
                    memory=MemoryMetrics(used_gb=0, total_gb=0, usage_percent=0, available_gb=0),
                    disks=[], network=[], filesystems=[]
                )
            
            if isinstance(app_server, Exception):
                logger.error(f"App server metrics collection failed: {app_server}")
                app_server = AppServerMetrics(
                    server_status=ServerStatus(status="error", last_updated=datetime.now()),
                    cpu=CPUMetrics(usage_percent=0, cores=0),
                    memory=MemoryMetrics(used_gb=0, total_gb=0, usage_percent=0, available_gb=0),
                    disks=[], network=[], proxmox_host={}, vms=[]
                )
            
            # Calculate overview stats
            total_servers = 3
            online_servers = sum(1 for server in [ai_server, storage_server, app_server] 
                               if server.server_status.status == "online")
            alerts_count = sum(1 for server in [ai_server, storage_server, app_server] 
                             if server.server_status.status in ["warning", "error"])
            
            return SystemOverview(
                ai_server=ai_server,
                app_server=app_server,
                storage_server=storage_server,
                last_updated=datetime.now(),
                total_servers=total_servers,
                online_servers=online_servers,
                alerts_count=alerts_count
            )
            
        except Exception as e:
            logger.error(f"Failed to collect system metrics: {e}")
            raise

metrics_collector = MetricsCollector()