from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Server Configuration
    app_name: str = "Infrastructure Monitoring Dashboard"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    
    # CORS Configuration
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:1000",
        "http://192.168.50.73:3000",
        "http://192.168.50.73:1000",
        "http://192.168.50.73",
        "http://60.51.17.97:1000",
        "http://60.51.17.97:3000",
        "http://60.51.17.97",
        "*"  # Allow all origins for development
    ]
    
    # Server IPs
    ai_server_ip: str = "192.168.50.118"
    storage_server_ip: str = "192.168.50.223"
    app_server_ip: str = "192.168.50.164"
    user_vm_ip: str = "192.168.50.210"
    proxmox_ip: str = "60.51.17.102"
    
    # Prometheus Configuration
    prometheus_url: str = "http://localhost:9090"
    
    # Node Exporter Ports
    node_exporter_port: int = 9100
    gpu_exporter_port: int = 9835
    
    # Qdrant Configuration
    qdrant_url: str = f"http://192.168.50.223:6333"
    
    # WebSocket Configuration
    websocket_heartbeat_interval: int = 30
    metrics_update_interval: int = 5
    
    # Monitoring Configuration
    scrape_timeout: int = 10
    max_retries: int = 3
    
    class Config:
        env_file = ".env"

settings = Settings()