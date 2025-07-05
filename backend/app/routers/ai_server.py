from fastapi import APIRouter, HTTPException
from ..services.metrics_collector import metrics_collector
from ..models.server_metrics import AIServerMetrics
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai-server", tags=["AI Server"])

@router.get("/", response_model=AIServerMetrics)
async def get_ai_server_metrics():
    """Get current AI server metrics including GPU, CPU, memory, and disk usage"""
    try:
        metrics = await metrics_collector.collect_ai_server_metrics()
        return metrics
    except Exception as e:
        logger.error(f"Failed to collect AI server metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect AI server metrics: {str(e)}")

@router.get("/gpu")
async def get_gpu_metrics():
    """Get detailed GPU metrics from AI server"""
    try:
        metrics = await metrics_collector.collect_ai_server_metrics()
        if metrics.gpu:
            return {
                "gpu": metrics.gpu.dict(),
                "server_status": metrics.server_status.dict()
            }
        else:
            return {
                "gpu": None,
                "message": "No GPU metrics available",
                "server_status": metrics.server_status.dict()
            }
    except Exception as e:
        logger.error(f"Failed to collect GPU metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect GPU metrics: {str(e)}")

@router.get("/cpu")
async def get_cpu_metrics():
    """Get detailed CPU metrics from AI server"""
    try:
        metrics = await metrics_collector.collect_ai_server_metrics()
        return {
            "cpu": metrics.cpu.dict(),
            "server_status": metrics.server_status.dict()
        }
    except Exception as e:
        logger.error(f"Failed to collect CPU metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect CPU metrics: {str(e)}")

@router.get("/memory")
async def get_memory_metrics():
    """Get detailed memory metrics from AI server"""
    try:
        metrics = await metrics_collector.collect_ai_server_metrics()
        return {
            "memory": metrics.memory.dict(),
            "server_status": metrics.server_status.dict()
        }
    except Exception as e:
        logger.error(f"Failed to collect memory metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect memory metrics: {str(e)}")

@router.get("/storage")
async def get_storage_metrics():
    """Get storage/disk metrics from AI server"""
    try:
        metrics = await metrics_collector.collect_ai_server_metrics()
        return {
            "disks": [disk.dict() for disk in metrics.disks],
            "server_status": metrics.server_status.dict()
        }
    except Exception as e:
        logger.error(f"Failed to collect storage metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect storage metrics: {str(e)}")

@router.get("/network")
async def get_network_metrics():
    """Get network interface metrics from AI server"""
    try:
        metrics = await metrics_collector.collect_ai_server_metrics()
        return {
            "network": [net.dict() for net in metrics.network],
            "server_status": metrics.server_status.dict()
        }
    except Exception as e:
        logger.error(f"Failed to collect network metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect network metrics: {str(e)}")

@router.get("/health")
async def get_ai_server_health():
    """Get AI server health status"""
    try:
        metrics = await metrics_collector.collect_ai_server_metrics()
        return {
            "status": metrics.server_status.status,
            "last_updated": metrics.server_status.last_updated,
            "response_time_ms": metrics.server_status.response_time_ms,
            "uptime_seconds": metrics.server_status.uptime_seconds
        }
    except Exception as e:
        logger.error(f"Failed to check AI server health: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check AI server health: {str(e)}")