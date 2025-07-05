from fastapi import APIRouter, HTTPException
from ..services.metrics_collector import metrics_collector
from ..models.server_metrics import AppServerMetrics
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/app-server", tags=["App Server"])

@router.get("/", response_model=AppServerMetrics)
async def get_app_server_metrics():
    """Get current app server metrics including Proxmox host and VM metrics"""
    try:
        metrics = await metrics_collector.collect_app_server_metrics()
        return metrics
    except Exception as e:
        logger.error(f"Failed to collect app server metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect app server metrics: {str(e)}")

@router.get("/proxmox")
async def get_proxmox_metrics():
    """Get Proxmox host metrics"""
    try:
        metrics = await metrics_collector.collect_app_server_metrics()
        return {
            "proxmox_host": metrics.proxmox_host,
            "server_status": metrics.server_status.dict()
        }
    except Exception as e:
        logger.error(f"Failed to collect Proxmox metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect Proxmox metrics: {str(e)}")

@router.get("/vms")
async def get_vm_metrics():
    """Get all VM metrics from Proxmox"""
    try:
        metrics = await metrics_collector.collect_app_server_metrics()
        return {
            "vms": [vm.dict() for vm in metrics.vms],
            "vm_count": len(metrics.vms),
            "running_vms": len([vm for vm in metrics.vms if vm.status == "running"]),
            "server_status": metrics.server_status.dict()
        }
    except Exception as e:
        logger.error(f"Failed to collect VM metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect VM metrics: {str(e)}")

@router.get("/vms/{vm_id}")
async def get_vm_by_id(vm_id: int):
    """Get specific VM metrics by VM ID"""
    try:
        metrics = await metrics_collector.collect_app_server_metrics()
        vm = next((vm for vm in metrics.vms if vm.vmid == vm_id), None)
        
        if not vm:
            raise HTTPException(status_code=404, detail=f"VM with ID {vm_id} not found")
        
        return {
            "vm": vm.dict(),
            "server_status": metrics.server_status.dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get VM {vm_id} metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get VM metrics: {str(e)}")

@router.get("/cpu")
async def get_cpu_metrics():
    """Get CPU metrics from app server"""
    try:
        metrics = await metrics_collector.collect_app_server_metrics()
        return {
            "cpu": metrics.cpu.dict(),
            "server_status": metrics.server_status.dict()
        }
    except Exception as e:
        logger.error(f"Failed to collect CPU metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect CPU metrics: {str(e)}")

@router.get("/memory")
async def get_memory_metrics():
    """Get memory metrics from app server"""
    try:
        metrics = await metrics_collector.collect_app_server_metrics()
        return {
            "memory": metrics.memory.dict(),
            "server_status": metrics.server_status.dict()
        }
    except Exception as e:
        logger.error(f"Failed to collect memory metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect memory metrics: {str(e)}")

@router.get("/storage")
async def get_storage_metrics():
    """Get storage/disk metrics from app server"""
    try:
        metrics = await metrics_collector.collect_app_server_metrics()
        return {
            "disks": [disk.dict() for disk in metrics.disks],
            "server_status": metrics.server_status.dict()
        }
    except Exception as e:
        logger.error(f"Failed to collect storage metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect storage metrics: {str(e)}")

@router.get("/network")
async def get_network_metrics():
    """Get network interface metrics from app server"""
    try:
        metrics = await metrics_collector.collect_app_server_metrics()
        return {
            "network": [net.dict() for net in metrics.network],
            "server_status": metrics.server_status.dict()
        }
    except Exception as e:
        logger.error(f"Failed to collect network metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect network metrics: {str(e)}")

@router.get("/health")
async def get_app_server_health():
    """Get app server health status"""
    try:
        metrics = await metrics_collector.collect_app_server_metrics()
        return {
            "status": metrics.server_status.status,
            "last_updated": metrics.server_status.last_updated,
            "response_time_ms": metrics.server_status.response_time_ms,
            "uptime_seconds": metrics.server_status.uptime_seconds,
            "proxmox_status": "online" if metrics.proxmox_host else "offline",
            "vm_count": len(metrics.vms),
            "running_vms": len([vm for vm in metrics.vms if vm.status == "running"])
        }
    except Exception as e:
        logger.error(f"Failed to check app server health: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check app server health: {str(e)}")