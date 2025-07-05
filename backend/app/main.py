from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import uvicorn
from datetime import datetime

from .config import settings
from .routers import ai_server, app_server, storage_server, websocket
from .services.metrics_collector import metrics_collector
from .models.server_metrics import SystemOverview

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Unified Infrastructure Monitoring Dashboard API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ai_server.router)
app.include_router(app_server.router)
app.include_router(storage_server.router)
app.include_router(websocket.router)

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Infrastructure Monitoring Dashboard API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "ai_server": "/api/ai-server",
            "app_server": "/api/app-server", 
            "storage_server": "/api/storage-server",
            "overview": "/api/servers/overview",
            "websocket": "/ws/metrics",
            "health": "/api/health",
            "docs": "/docs"
        }
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test Prometheus connectivity
        from .services.prometheus_client import prometheus_client
        test_query = await prometheus_client.query("up")
        prometheus_status = "healthy" if test_query else "unhealthy"
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "api": "healthy",
                "prometheus": prometheus_status,
                "websocket": "healthy"
            },
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }
        )

@app.get("/api/servers/overview", response_model=SystemOverview)
async def get_servers_overview():
    """Get overview of all servers"""
    try:
        overview = await metrics_collector.collect_all_metrics()
        return overview
    except Exception as e:
        logger.error(f"Failed to collect servers overview: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect servers overview: {str(e)}")

@app.get("/api/servers/summary")
async def get_servers_summary():
    """Get a simplified summary of all servers"""
    try:
        overview = await metrics_collector.collect_all_metrics()
        
        return {
            "summary": {
                "total_servers": overview.total_servers,
                "online_servers": overview.online_servers,
                "alerts_count": overview.alerts_count,
                "last_updated": overview.last_updated
            },
            "servers": {
                "ai_server": {
                    "status": overview.ai_server.server_status.status,
                    "cpu_usage": overview.ai_server.cpu.usage_percent,
                    "memory_usage": overview.ai_server.memory.usage_percent,
                    "gpu_usage": overview.ai_server.gpu.usage_percent if overview.ai_server.gpu else None,
                    "response_time_ms": overview.ai_server.server_status.response_time_ms
                },
                "app_server": {
                    "status": overview.app_server.server_status.status,
                    "cpu_usage": overview.app_server.cpu.usage_percent,
                    "memory_usage": overview.app_server.memory.usage_percent,
                    "vm_count": len(overview.app_server.vms),
                    "running_vms": len([vm for vm in overview.app_server.vms if vm.status == "running"]),
                    "response_time_ms": overview.app_server.server_status.response_time_ms
                },
                "storage_server": {
                    "status": overview.storage_server.server_status.status,
                    "cpu_usage": overview.storage_server.cpu.usage_percent,
                    "memory_usage": overview.storage_server.memory.usage_percent,
                    "filesystem_count": len(overview.storage_server.filesystems),
                    "qdrant_status": overview.storage_server.qdrant.status if overview.storage_server.qdrant else "unknown",
                    "response_time_ms": overview.storage_server.server_status.response_time_ms
                }
            }
        }
    except Exception as e:
        logger.error(f"Failed to collect servers summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to collect servers summary: {str(e)}")

@app.get("/api/metrics/prometheus")
async def get_prometheus_metrics():
    """Grafana-compatible Prometheus metrics endpoint"""
    try:
        overview = await metrics_collector.collect_all_metrics()
        
        # Convert to Prometheus-style metrics format
        metrics = []
        
        # AI Server metrics
        if overview.ai_server.server_status.status == "online":
            metrics.extend([
                f'ai_server_cpu_usage_percent {overview.ai_server.cpu.usage_percent}',
                f'ai_server_memory_usage_percent {overview.ai_server.memory.usage_percent}',
                f'ai_server_memory_used_bytes {overview.ai_server.memory.used_gb * 1024**3}',
                f'ai_server_memory_total_bytes {overview.ai_server.memory.total_gb * 1024**3}',
            ])
            
            if overview.ai_server.gpu:
                metrics.extend([
                    f'ai_server_gpu_usage_percent {overview.ai_server.gpu.usage_percent}',
                    f'ai_server_gpu_memory_usage_percent {overview.ai_server.gpu.memory_usage_percent}',
                    f'ai_server_gpu_temperature_celsius {overview.ai_server.gpu.temperature}',
                    f'ai_server_gpu_power_draw_watts {overview.ai_server.gpu.power_draw_w}',
                ])
        
        # App Server metrics
        if overview.app_server.server_status.status == "online":
            metrics.extend([
                f'app_server_cpu_usage_percent {overview.app_server.cpu.usage_percent}',
                f'app_server_memory_usage_percent {overview.app_server.memory.usage_percent}',
                f'app_server_vm_count {len(overview.app_server.vms)}',
                f'app_server_running_vms {len([vm for vm in overview.app_server.vms if vm.status == "running"])}',
            ])
        
        # Storage Server metrics
        if overview.storage_server.server_status.status == "online":
            metrics.extend([
                f'storage_server_cpu_usage_percent {overview.storage_server.cpu.usage_percent}',
                f'storage_server_memory_usage_percent {overview.storage_server.memory.usage_percent}',
                f'storage_server_filesystem_count {len(overview.storage_server.filesystems)}',
            ])
            
            if overview.storage_server.qdrant:
                metrics.extend([
                    f'storage_server_qdrant_collections {overview.storage_server.qdrant.collections}',
                    f'storage_server_qdrant_points {overview.storage_server.qdrant.total_points}',
                    f'storage_server_qdrant_disk_usage_bytes {overview.storage_server.qdrant.disk_usage_gb * 1024**3}',
                ])
        
        # System overview metrics
        metrics.extend([
            f'system_total_servers {overview.total_servers}',
            f'system_online_servers {overview.online_servers}',
            f'system_alerts_count {overview.alerts_count}',
        ])
        
        return JSONResponse(
            content={"metrics": metrics, "timestamp": overview.last_updated.isoformat()},
            headers={"Content-Type": "application/json"}
        )
        
    except Exception as e:
        logger.error(f"Failed to generate Prometheus metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate Prometheus metrics: {str(e)}")

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )