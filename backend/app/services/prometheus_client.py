import httpx
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
from ..config import settings

logger = logging.getLogger(__name__)

class PrometheusClient:
    def __init__(self):
        self.base_url = settings.prometheus_url
        self.timeout = settings.scrape_timeout
        
    async def query(self, query: str) -> Optional[Dict[str, Any]]:
        """Execute a PromQL query"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/api/v1/query",
                    params={"query": query}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Prometheus query failed: {e}")
            return None
    
    async def query_range(self, query: str, start: str, end: str, step: str = "15s") -> Optional[Dict[str, Any]]:
        """Execute a PromQL range query"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/api/v1/query_range",
                    params={
                        "query": query,
                        "start": start,
                        "end": end,
                        "step": step
                    }
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Prometheus range query failed: {e}")
            return None
    
    async def get_cpu_usage(self, instance: str) -> Optional[float]:
        """Get CPU usage percentage for an instance"""
        query = f'100 - (avg(rate(node_cpu_seconds_total{{mode="idle",instance="{instance}:9100"}}[5m])) * 100)'
        result = await self.query(query)
        
        if result and result.get("status") == "success":
            data = result.get("data", {}).get("result", [])
            if data:
                return float(data[0]["value"][1])
        return None
    
    async def get_memory_usage(self, instance: str) -> Optional[Dict[str, float]]:
        """Get memory usage metrics for an instance"""
        queries = {
            "total": f'node_memory_MemTotal_bytes{{instance="{instance}:9100"}}',
            "available": f'node_memory_MemAvailable_bytes{{instance="{instance}:9100"}}',
            "cached": f'node_memory_Cached_bytes{{instance="{instance}:9100"}}'
        }
        
        results = {}
        for key, query in queries.items():
            result = await self.query(query)
            if result and result.get("status") == "success":
                data = result.get("data", {}).get("result", [])
                if data:
                    results[key] = float(data[0]["value"][1])
        
        if "total" in results and "available" in results:
            results["used"] = results["total"] - results["available"]
            results["usage_percent"] = (results["used"] / results["total"]) * 100
            
        return results if results else None
    
    async def get_disk_usage(self, instance: str) -> Optional[List[Dict[str, Any]]]:
        """Get disk usage for all filesystems on an instance"""
        queries = {
            "size": f'node_filesystem_size_bytes{{instance="{instance}:9100",fstype!="tmpfs"}}',
            "avail": f'node_filesystem_avail_bytes{{instance="{instance}:9100",fstype!="tmpfs"}}',
            "used": f'node_filesystem_size_bytes{{instance="{instance}:9100",fstype!="tmpfs"}} - node_filesystem_avail_bytes{{instance="{instance}:9100",fstype!="tmpfs"}}'
        }
        
        results = {}
        for key, query in queries.items():
            result = await self.query(query)
            if result and result.get("status") == "success":
                results[key] = result.get("data", {}).get("result", [])
        
        disks = []
        if "size" in results:
            for disk in results["size"]:
                mountpoint = disk["metric"]["mountpoint"]
                device = disk["metric"]["device"]
                
                # Find corresponding avail and used values
                size_bytes = float(disk["value"][1])
                avail_bytes = 0
                used_bytes = 0
                
                for avail in results.get("avail", []):
                    if avail["metric"]["mountpoint"] == mountpoint:
                        avail_bytes = float(avail["value"][1])
                        break
                
                for used in results.get("used", []):
                    if used["metric"]["mountpoint"] == mountpoint:
                        used_bytes = float(used["value"][1])
                        break
                
                if size_bytes > 0:
                    disks.append({
                        "mount_point": mountpoint,
                        "device": device,
                        "total_gb": size_bytes / (1024**3),
                        "used_gb": used_bytes / (1024**3),
                        "available_gb": avail_bytes / (1024**3),
                        "usage_percent": (used_bytes / size_bytes) * 100,
                        "filesystem": disk["metric"].get("fstype", "unknown")
                    })
        
        return disks
    
    async def get_gpu_metrics(self, instance: str) -> Optional[Dict[str, Any]]:
        """Get GPU metrics from GPU exporter"""
        queries = {
            "gpu_utilization": f'nvidia_smi_utilization_gpu_ratio{{instance="{instance}:9835"}}',
            "memory_used": f'nvidia_smi_memory_used_bytes{{instance="{instance}:9835"}}',
            "memory_total": f'nvidia_smi_memory_total_bytes{{instance="{instance}:9835"}}',
            "temperature": f'nvidia_smi_temperature_gpu{{instance="{instance}:9835"}}',
            "power_draw": f'nvidia_smi_power_draw_watts{{instance="{instance}:9835"}}',
            "fan_speed": f'nvidia_smi_fan_speed_ratio{{instance="{instance}:9835"}}'
        }
        
        results = {}
        for key, query in queries.items():
            result = await self.query(query)
            if result and result.get("status") == "success":
                data = result.get("data", {}).get("result", [])
                if data:
                    results[key] = float(data[0]["value"][1])
                    if key in ["gpu_utilization", "fan_speed"]:
                        results[key] *= 100  # Convert to percentage
        
        if results:
            gpu_name_query = f'nvidia_smi_gpu_info{{instance="{instance}:9835"}}'
            name_result = await self.query(gpu_name_query)
            if name_result and name_result.get("status") == "success":
                data = name_result.get("data", {}).get("result", [])
                if data:
                    results["name"] = data[0]["metric"].get("name", "Unknown GPU")
            
            # Calculate memory usage percentage
            if "memory_used" in results and "memory_total" in results:
                results["memory_usage_percent"] = (results["memory_used"] / results["memory_total"]) * 100
                results["memory_used_mb"] = results["memory_used"] / (1024**2)
                results["memory_total_mb"] = results["memory_total"] / (1024**2)
        
        return results if results else None
    
    async def get_network_metrics(self, instance: str) -> Optional[List[Dict[str, Any]]]:
        """Get network interface metrics"""
        queries = {
            "bytes_sent": f'rate(node_network_transmit_bytes_total{{instance="{instance}:9100"}}[5m])',
            "bytes_recv": f'rate(node_network_receive_bytes_total{{instance="{instance}:9100"}}[5m])',
            "packets_sent": f'rate(node_network_transmit_packets_total{{instance="{instance}:9100"}}[5m])',
            "packets_recv": f'rate(node_network_receive_packets_total{{instance="{instance}:9100"}}[5m])',
            "errors_in": f'rate(node_network_receive_errs_total{{instance="{instance}:9100"}}[5m])',
            "errors_out": f'rate(node_network_transmit_errs_total{{instance="{instance}:9100"}}[5m])'
        }
        
        results = {}
        for key, query in queries.items():
            result = await self.query(query)
            if result and result.get("status") == "success":
                results[key] = result.get("data", {}).get("result", [])
        
        interfaces = []
        if "bytes_sent" in results:
            for interface in results["bytes_sent"]:
                device = interface["metric"]["device"]
                if device.startswith(("lo", "docker", "br-")):
                    continue  # Skip loopback and docker interfaces
                
                interface_data = {"interface": device}
                
                for key, data_list in results.items():
                    for item in data_list:
                        if item["metric"]["device"] == device:
                            interface_data[key] = float(item["value"][1])
                            break
                    if key not in interface_data:
                        interface_data[key] = 0.0
                
                interfaces.append(interface_data)
        
        return interfaces
    
    async def check_instance_health(self, instance: str, port: int = 9100) -> Dict[str, Any]:
        """Check if an instance is responding"""
        try:
            start_time = datetime.now()
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"http://{instance}:{port}/metrics")
                response.raise_for_status()
                
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            return {
                "status": "online",
                "response_time_ms": response_time,
                "last_updated": datetime.now()
            }
        except Exception as e:
            logger.warning(f"Health check failed for {instance}:{port} - {e}")
            return {
                "status": "offline",
                "response_time_ms": None,
                "last_updated": datetime.now(),
                "error": str(e)
            }

prometheus_client = PrometheusClient()