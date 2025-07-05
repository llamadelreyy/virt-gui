import { useState, useEffect, useCallback, useRef } from 'react'
import websocketService from '@/services/websocket'

export const useWebSocket = (autoConnect = true) => {
  const [connectionState, setConnectionState] = useState('disconnected')
  const [lastMessage, setLastMessage] = useState(null)
  const [error, setError] = useState(null)
  const [metrics, setMetrics] = useState({})
  const reconnectTimeoutRef = useRef(null)

  const handleConnectionStateChange = useCallback(() => {
    setConnectionState(websocketService.getConnectionState())
  }, [])

  const handleMessage = useCallback((data) => {
    setLastMessage(data)
    setError(null)
  }, [])

  const handleMetricsUpdate = useCallback((data) => {
    const { serverType, data: serverData } = data
    setMetrics(prev => ({
      ...prev,
      [serverType]: serverData,
      lastUpdated: new Date().toISOString()
    }))
  }, [])

  const handleError = useCallback((errorData) => {
    setError(errorData)
    console.error('WebSocket error:', errorData)
  }, [])

  const handleDisconnected = useCallback(() => {
    setConnectionState('disconnected')
    setError({ message: 'Connection lost', timestamp: new Date().toISOString() })
  }, [])

  const connect = useCallback(() => {
    if (websocketService.isConnected()) {
      return
    }
    
    websocketService.connect()
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    websocketService.disconnect()
    setConnectionState('disconnected')
  }, [])

  const sendMessage = useCallback((message) => {
    return websocketService.send(message)
  }, [])

  const ping = useCallback(() => {
    return websocketService.ping()
  }, [])

  const requestUpdate = useCallback(() => {
    return websocketService.requestUpdate()
  }, [])

  useEffect(() => {
    // Set up event listeners
    websocketService.on('connected', handleConnectionStateChange)
    websocketService.on('disconnected', handleDisconnected)
    websocketService.on('error', handleError)
    websocketService.on('websocket_error', handleError)
    websocketService.on('message', handleMessage)
    websocketService.on('metrics_update', handleMetricsUpdate)

    // Auto-connect if enabled
    if (autoConnect) {
      connect()
    }

    // Cleanup function
    return () => {
      websocketService.off('connected', handleConnectionStateChange)
      websocketService.off('disconnected', handleDisconnected)
      websocketService.off('error', handleError)
      websocketService.off('websocket_error', handleError)
      websocketService.off('message', handleMessage)
      websocketService.off('metrics_update', handleMetricsUpdate)
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [autoConnect, connect, handleConnectionStateChange, handleDisconnected, handleError, handleMessage, handleMetricsUpdate])

  // Periodic ping to keep connection alive
  useEffect(() => {
    if (connectionState === 'connected') {
      const pingInterval = setInterval(() => {
        ping()
      }, 30000) // Ping every 30 seconds

      return () => clearInterval(pingInterval)
    }
  }, [connectionState, ping])

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    lastMessage,
    error,
    metrics,
    connect,
    disconnect,
    sendMessage,
    ping,
    requestUpdate
  }
}

export default useWebSocket