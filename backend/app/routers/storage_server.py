from fastapi import APIRouter, HTTPException
from ..services.metrics_collector import metrics_collector
from ..models.server_metrics import StorageServerMetrics
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/storage-server", tags=["Storage Server"])

@router.get("/", response_model=StorageServerMetrics)
async def get_storage_server_metrics():
    """Get current storage server metrics including filesystems and Qdrant"""
    try:
        metrics = await metrics_collector.collect_storage_server_metrics()
        return metrics
    except Exception as e:
        logger.error(f"Failed to collect storage server metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect storage server metrics: {str(e)}")

@router.get("/filesystems")
async def get_filesystem_metrics():
    """Get detailed filesystem metrics including file counts and sizes"""
    try:
        metrics = await metrics_collector.collect_storage_server_metrics()
        return {
            "filesystems": [fs.dict() for fs in metrics.filesystems],
            "total_filesystems": len(metrics.filesystems),
            "total_used_gb": sum(fs.used_gb for fs in metrics.filesystems),
            "total_capacity_gb": sum(fs.total_gb for fs in metrics.filesystems),
            "server_status": metrics.server_status.dict()
        }
    except Exception as e:
        logger.error(f"Failed to collect filesystem metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect filesystem metrics: {str(e)}")

@router.get("/filesystems/{mount_point:path}")
async def get_filesystem_by_mount(mount_point: str):
    """Get specific filesystem metrics by mount point"""
    try:
        metrics = await metrics_collector.collect_storage_server_metrics()
        
        # Normalize mount point (add leading slash if missing)
        if not mount_point.startswith('/'):
            mount_point = '/' + mount_point
        
        filesystem = next((fs for fs in metrics.filesystems if fs.mount_point == mount_point), None)
        
        if not filesystem:
            raise HTTPException(status_code=404, detail=f"Filesystem with mount point {mount_point} not found")
        
        return {
            "filesystem": filesystem.dict(),
            "server_status": metrics.server_status.dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get filesystem {mount_point} metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get filesystem metrics: {str(e)}")

@router.get("/qdrant")
async def get_qdrant_metrics():
    """Get Qdrant database metrics"""
    try:
        metrics = await metrics_collector.collect_storage_server_metrics()
        
        if not metrics.qdrant:
            return {
                "qdrant": None,
                "message": "Qdrant metrics not available",
                "server_status": metrics.server_status.dict()
            }
        
        return {
            "qdrant": metrics.qdrant.dict(),
            "server_status": metrics.server_status.dict()
        }
    except Exception as e:
        logger.error(f"Failed to collect Qdrant metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect Qdrant metrics: {str(e)}")

@router.get("/cpu")
async def get_cpu_metrics():
    """Get CPU metrics from storage server"""
    try:
        metrics = await metrics_collector.collect_storage_server_metrics()
        return {
            "cpu": metrics.cpu.dict(),
            "server_status": metrics.server_status.dict()
        }
    except Exception as e:
        logger.error(f"Failed to collect CPU metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect CPU metrics: {str(e)}")

@router.get("/memory")
async def get_memory_metrics():
    """Get memory metrics from storage server"""
    try:
        metrics = await metrics_collector.collect_storage_server_metrics()
        return {
            "memory": metrics.memory.dict(),
            "server_status": metrics.server_status.dict()
        }
    except Exception as e:
        logger.error(f"Failed to collect memory metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect memory metrics: {str(e)}")

@router.get("/storage")
async def get_storage_metrics():
    """Get storage/disk metrics from storage server"""
    try:
        metrics = await metrics_collector.collect_storage_server_metrics()
        return {
            "disks": [disk.dict() for disk in metrics.disks],
            "server_status": metrics.server_status.dict()
        }
    except Exception as e:
        logger.error(f"Failed to collect storage metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect storage metrics: {str(e)}")

@router.get("/network")
async def get_network_metrics():
    """Get network interface metrics from storage server"""
    try:
        metrics = await metrics_collector.collect_storage_server_metrics()
        return {
            "network": [net.dict() for net in metrics.network],
            "server_status": metrics.server_status.dict()
        }
    except Exception as e:
        logger.error(f"Failed to collect network metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect network metrics: {str(e)}")

@router.get("/health")
async def get_storage_server_health():
    """Get storage server health status"""
    try:
        metrics = await metrics_collector.collect_storage_server_metrics()
        
        # Calculate storage health indicators
        total_capacity = sum(fs.total_gb for fs in metrics.filesystems)
        total_used = sum(fs.used_gb for fs in metrics.filesystems)
        avg_usage = (total_used / total_capacity * 100) if total_capacity > 0 else 0
        
        return {
            "status": metrics.server_status.status,
            "last_updated": metrics.server_status.last_updated,
            "response_time_ms": metrics.server_status.response_time_ms,
            "uptime_seconds": metrics.server_status.uptime_seconds,
            "qdrant_status": metrics.qdrant.status if metrics.qdrant else "unknown",
            "filesystem_count": len(metrics.filesystems),
            "total_capacity_gb": total_capacity,
            "total_used_gb": total_used,
            "average_usage_percent": avg_usage,
            "total_files": sum(fs.file_count for fs in metrics.filesystems)
        }
    except Exception as e:
        logger.error(f"Failed to check storage server health: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check storage server health: {str(e)}")