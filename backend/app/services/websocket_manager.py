import asyncio
import json
import logging
from typing import Set, Dict, Any
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from .metrics_collector import metrics_collector
from ..models.server_metrics import MetricsUpdate
from ..config import settings

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.is_broadcasting = False
        self.broadcast_task = None
    
    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
        
        # Start broadcasting if this is the first connection
        if len(self.active_connections) == 1 and not self.is_broadcasting:
            self.broadcast_task = asyncio.create_task(self._start_broadcasting())
    
    async def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
        
        # Stop broadcasting if no connections remain
        if len(self.active_connections) == 0 and self.is_broadcasting:
            self.is_broadcasting = False
            if self.broadcast_task:
                self.broadcast_task.cancel()
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific WebSocket"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            await self.disconnect(websocket)
    
    async def broadcast_message(self, message: str):
        """Send a message to all connected WebSockets"""
        if not self.active_connections:
            return
        
        disconnected = set()
        for connection in self.active_connections.copy():
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")
                disconnected.add(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.active_connections.discard(connection)
    
    async def broadcast_metrics_update(self, server_type: str, data: Dict[str, Any]):
        """Broadcast a metrics update to all connected clients"""
        update = MetricsUpdate(
            timestamp=datetime.now(),
            server_type=server_type,
            data=data,
            event_type="metrics_update"
        )
        
        message = json.dumps(update.dict(), default=str)
        await self.broadcast_message(message)
    
    async def _start_broadcasting(self):
        """Start the periodic metrics broadcasting"""
        self.is_broadcasting = True
        logger.info("Started WebSocket metrics broadcasting")
        
        try:
            while self.is_broadcasting and self.active_connections:
                try:
                    # Collect all metrics
                    overview = await metrics_collector.collect_all_metrics()
                    
                    # Broadcast overview
                    await self.broadcast_metrics_update("overview", overview.dict())
                    
                    # Broadcast individual server metrics
                    await self.broadcast_metrics_update("ai_server", overview.ai_server.dict())
                    await self.broadcast_metrics_update("app_server", overview.app_server.dict())
                    await self.broadcast_metrics_update("storage_server", overview.storage_server.dict())
                    
                    # Wait for next update interval
                    await asyncio.sleep(settings.metrics_update_interval)
                    
                except Exception as e:
                    logger.error(f"Error in metrics broadcasting: {e}")
                    # Send error message to clients
                    error_update = MetricsUpdate(
                        timestamp=datetime.now(),
                        server_type="error",
                        data={"error": str(e), "message": "Failed to collect metrics"},
                        event_type="error"
                    )
                    await self.broadcast_message(json.dumps(error_update.dict(), default=str))
                    
                    # Wait before retrying
                    await asyncio.sleep(10)
                    
        except asyncio.CancelledError:
            logger.info("WebSocket broadcasting cancelled")
        except Exception as e:
            logger.error(f"Unexpected error in broadcasting: {e}")
        finally:
            self.is_broadcasting = False
            logger.info("Stopped WebSocket metrics broadcasting")
    
    async def send_heartbeat(self):
        """Send heartbeat to all connected clients"""
        heartbeat = {
            "event_type": "heartbeat",
            "timestamp": datetime.now().isoformat(),
            "connections": len(self.active_connections)
        }
        await self.broadcast_message(json.dumps(heartbeat))

# Global WebSocket manager instance
websocket_manager = WebSocketManager()