from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..services.websocket_manager import websocket_manager
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/metrics")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time metrics updates"""
    await websocket_manager.connect(websocket)
    
    try:
        # Send initial connection confirmation
        await websocket_manager.send_personal_message(
            json.dumps({
                "event_type": "connection_established",
                "message": "Connected to metrics stream",
                "timestamp": str(websocket_manager.active_connections.__len__())
            }),
            websocket
        )
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages from client (ping, requests, etc.)
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                if message.get("type") == "ping":
                    await websocket_manager.send_personal_message(
                        json.dumps({
                            "event_type": "pong",
                            "timestamp": str(websocket_manager.active_connections.__len__())
                        }),
                        websocket
                    )
                elif message.get("type") == "request_update":
                    # Client requesting immediate metrics update
                    from ..services.metrics_collector import metrics_collector
                    try:
                        overview = await metrics_collector.collect_all_metrics()
                        await websocket_manager.send_personal_message(
                            json.dumps({
                                "event_type": "metrics_update",
                                "server_type": "overview",
                                "data": overview.dict(),
                                "timestamp": str(overview.last_updated)
                            }, default=str),
                            websocket
                        )
                    except Exception as e:
                        await websocket_manager.send_personal_message(
                            json.dumps({
                                "event_type": "error",
                                "message": f"Failed to collect metrics: {str(e)}"
                            }),
                            websocket
                        )
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                # Invalid JSON received
                await websocket_manager.send_personal_message(
                    json.dumps({
                        "event_type": "error",
                        "message": "Invalid JSON format"
                    }),
                    websocket
                )
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                await websocket_manager.send_personal_message(
                    json.dumps({
                        "event_type": "error",
                        "message": f"Server error: {str(e)}"
                    }),
                    websocket
                )
                
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await websocket_manager.disconnect(websocket)

@router.websocket("/ws/heartbeat")
async def heartbeat_endpoint(websocket: WebSocket):
    """WebSocket endpoint for heartbeat/health monitoring"""
    await websocket.accept()
    
    try:
        while True:
            # Send heartbeat every 30 seconds
            await websocket.send_text(json.dumps({
                "event_type": "heartbeat",
                "timestamp": str(websocket_manager.active_connections.__len__()),
                "active_connections": len(websocket_manager.active_connections),
                "status": "healthy"
            }))
            
            # Wait for 30 seconds
            import asyncio
            await asyncio.sleep(30)
            
    except WebSocketDisconnect:
        logger.info("Heartbeat WebSocket client disconnected")
    except Exception as e:
        logger.error(f"Heartbeat WebSocket error: {e}")