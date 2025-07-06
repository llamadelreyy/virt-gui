class WebSocketService {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 5000
    this.listeners = new Map()
    this.isConnecting = false
    this.shouldReconnect = true
  }

  connect(url = null) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    this.isConnecting = true
    const wsUrl = url || this.getWebSocketUrl()

    try {
      this.ws = new WebSocket(wsUrl)
      this.setupEventHandlers()
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  getWebSocketUrl() {
    // Use relative WebSocket URL to leverage nginx proxy
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/ws/metrics`
  }

  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.emit('connected', { timestamp: new Date().toISOString() })
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleMessage(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      this.isConnecting = false
      this.emit('disconnected', { 
        code: event.code, 
        reason: event.reason,
        timestamp: new Date().toISOString()
      })

      if (this.shouldReconnect && event.code !== 1000) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.isConnecting = false
      this.emit('error', { 
        error: error.message || 'WebSocket error',
        timestamp: new Date().toISOString()
      })
    }
  }

  handleMessage(data) {
    const { event_type, server_type, data: messageData, timestamp } = data

    switch (event_type) {
      case 'metrics_update':
        this.emit('metrics_update', {
          serverType: server_type,
          data: messageData,
          timestamp
        })
        break
      
      case 'connection_established':
        this.emit('connection_established', data)
        break
      
      case 'heartbeat':
      case 'pong':
        this.emit('heartbeat', data)
        break
      
      case 'error':
        this.emit('websocket_error', data)
        break
      
      default:
        this.emit('message', data)
        break
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message))
        return true
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
        return false
      }
    }
    return false
  }

  ping() {
    return this.send({ type: 'ping', timestamp: new Date().toISOString() })
  }

  requestUpdate() {
    return this.send({ type: 'request_update', timestamp: new Date().toISOString() })
  }

  scheduleReconnect() {
    if (!this.shouldReconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached or reconnection disabled')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect()
      }
    }, delay)
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback)
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error)
        }
      })
    }
  }

  // Connection status
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }

  getConnectionState() {
    if (!this.ws) return 'disconnected'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      case WebSocket.CLOSING:
        return 'closing'
      case WebSocket.CLOSED:
        return 'disconnected'
      default:
        return 'unknown'
    }
  }

  // Cleanup
  destroy() {
    this.shouldReconnect = false
    this.listeners.clear()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// Create and export a singleton instance
export const websocketService = new WebSocketService()
export default websocketService