const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Health and overview endpoints
  async getHealth() {
    return this.request('/api/health')
  }

  async getServersOverview() {
    return this.request('/api/servers/overview')
  }

  async getServersSummary() {
    return this.request('/api/servers/summary')
  }

  // AI Server endpoints
  async getAIServerMetrics() {
    return this.request('/api/ai-server/')
  }

  async getAIServerGPU() {
    return this.request('/api/ai-server/gpu')
  }

  async getAIServerCPU() {
    return this.request('/api/ai-server/cpu')
  }

  async getAIServerMemory() {
    return this.request('/api/ai-server/memory')
  }

  async getAIServerStorage() {
    return this.request('/api/ai-server/storage')
  }

  async getAIServerNetwork() {
    return this.request('/api/ai-server/network')
  }

  async getAIServerHealth() {
    return this.request('/api/ai-server/health')
  }

  // App Server endpoints
  async getAppServerMetrics() {
    return this.request('/api/app-server/')
  }

  async getProxmoxMetrics() {
    return this.request('/api/app-server/proxmox')
  }

  async getVMMetrics() {
    return this.request('/api/app-server/vms')
  }

  async getVMById(vmId) {
    return this.request(`/api/app-server/vms/${vmId}`)
  }

  async getAppServerCPU() {
    return this.request('/api/app-server/cpu')
  }

  async getAppServerMemory() {
    return this.request('/api/app-server/memory')
  }

  async getAppServerStorage() {
    return this.request('/api/app-server/storage')
  }

  async getAppServerNetwork() {
    return this.request('/api/app-server/network')
  }

  async getAppServerHealth() {
    return this.request('/api/app-server/health')
  }

  // Storage Server endpoints
  async getStorageServerMetrics() {
    return this.request('/api/storage-server/')
  }

  async getFilesystemMetrics() {
    return this.request('/api/storage-server/filesystems')
  }

  async getFilesystemByMount(mountPoint) {
    // Encode the mount point to handle special characters
    const encodedMount = encodeURIComponent(mountPoint)
    return this.request(`/api/storage-server/filesystems/${encodedMount}`)
  }

  async getQdrantMetrics() {
    return this.request('/api/storage-server/qdrant')
  }

  async getStorageServerCPU() {
    return this.request('/api/storage-server/cpu')
  }

  async getStorageServerMemory() {
    return this.request('/api/storage-server/memory')
  }

  async getStorageServerStorage() {
    return this.request('/api/storage-server/storage')
  }

  async getStorageServerNetwork() {
    return this.request('/api/storage-server/network')
  }

  async getStorageServerHealth() {
    return this.request('/api/storage-server/health')
  }

  // Prometheus metrics for Grafana compatibility
  async getPrometheusMetrics() {
    return this.request('/api/metrics/prometheus')
  }
}

export const apiService = new ApiService()
export default apiService