import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import ServerSidebar from "@/components/dashboard/ServerSidebar"
import ServerDetailView from "@/components/dashboard/ServerDetailView"
import useWebSocket from "@/hooks/useWebSocket"
import apiService from "@/services/api"
import { formatTimestamp, generateChartData } from "@/lib/utils"
import logoImage from "@/assets/logo.png"
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle
} from "lucide-react"

function App() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chartData, setChartData] = useState([])
  const [lastRefresh, setLastRefresh] = useState(null)
  const [selectedServer, setSelectedServer] = useState('all')

  const { 
    isConnected, 
    connectionState, 
    metrics, 
    error: wsError,
    requestUpdate 
  } = useWebSocket(true)

  // Fetch initial data
  const fetchOverview = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiService.getServersOverview()
      setOverview(data)
      setLastRefresh(new Date())
      
      // Generate initial chart data
      const newChartData = generateChartData({
        ai_cpu: data.ai_server?.cpu?.usage_percent || 0,
        ai_memory: data.ai_server?.memory?.usage_percent || 0,
        ai_gpu: data.ai_server?.gpu?.usage_percent || 0,
        storage_cpu: data.storage_server?.cpu?.usage_percent || 0,
        app_cpu: data.app_server?.cpu?.usage_percent || 0,
      })
      setChartData(newChartData)
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch overview:', err)
    } finally {
      setLoading(false)
    }
  }

  // Update overview from WebSocket metrics
  useEffect(() => {
    if (metrics.overview) {
      setOverview(metrics.overview)
      setLastRefresh(new Date())
      
      // Update chart data with new metrics
      const newPoint = {
        time: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        ai_cpu: metrics.overview.ai_server?.cpu?.usage_percent || 0,
        ai_memory: metrics.overview.ai_server?.memory?.usage_percent || 0,
        ai_gpu: metrics.overview.ai_server?.gpu?.usage_percent || 0,
        storage_cpu: metrics.overview.storage_server?.cpu?.usage_percent || 0,
        app_cpu: metrics.overview.app_server?.cpu?.usage_percent || 0,
      }
      
      setChartData(prev => {
        const updated = [...prev, newPoint]
        return updated.slice(-20) // Keep last 20 points
      })
    }
  }, [metrics])

  // Initial data fetch
  useEffect(() => {
    fetchOverview()
  }, [])

  const handleRefresh = () => {
    if (isConnected) {
      requestUpdate()
    } else {
      fetchOverview()
    }
  }

  const handleServerSelect = (serverId) => {
    setSelectedServer(serverId)
  }

  if (loading && !overview) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-500" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={logoImage}
                alt="Company Logo"
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div
                className="h-12 w-12 bg-[#46a4a1] rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ display: 'none' }}
              >
                L
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">
                  Infrastructure Monitoring Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Real-time monitoring for AI, App, and Storage servers
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-cyan-500" />
                    <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200">
                      Live
                    </Badge>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-gray-500" />
                    <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                      Offline
                    </Badge>
                  </>
                )}
              </div>
              
              {/* Last Update */}
              {lastRefresh && (
                <div className="text-xs text-gray-500">
                  Last update: {formatTimestamp(lastRefresh)}
                </div>
              )}
              
              {/* Refresh Button */}
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={loading}
                className="border-gray-300 text-gray-700 hover:border-cyan-400 hover:text-cyan-600"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <ServerSidebar 
          selectedServer={selectedServer}
          onServerSelect={handleServerSelect}
          overview={overview}
        />

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Error Display */}
          {(error || wsError) && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">
                    {error || wsError?.message || 'Connection error'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Server Detail View */}
          {overview && (
            <ServerDetailView 
              serverId={selectedServer}
              serverData={overview}
              chartData={chartData}
            />
          )}

          {/* Loading State */}
          {!overview && !error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-500" />
                <p className="text-gray-600">Loading server data...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App