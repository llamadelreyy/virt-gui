import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import ServerCard from "@/components/dashboard/ServerCard"
import MetricsChart from "@/components/charts/MetricsChart"
import useWebSocket from "@/hooks/useWebSocket"
import apiService from "@/services/api"
import { formatTimestamp, generateChartData } from "@/lib/utils"
import { 
  Brain, 
  Server, 
  Database, 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react"

function App() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chartData, setChartData] = useState([])
  const [lastRefresh, setLastRefresh] = useState(null)

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

  if (loading && !overview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gradient">
                  Infrastructure Monitoring Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time monitoring for AI, App, and Storage servers
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-600" />
                    <Badge variant="success">Live</Badge>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-600" />
                    <Badge variant="error">Offline</Badge>
                  </>
                )}
              </div>
              
              {/* Refresh Button */}
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
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

        {/* System Overview */}
        {overview && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* System Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">System Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Servers</span>
                    <span className="font-bold">{overview.total_servers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Online</span>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="font-bold text-green-600">{overview.online_servers}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Alerts</span>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-600" />
                      <span className="font-bold text-yellow-600">{overview.alerts_count}</span>
                    </div>
                  </div>
                  {lastRefresh && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(lastRefresh)}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Server Card */}
              <ServerCard
                title="AI Server"
                icon={Brain}
                status={overview.ai_server?.server_status?.status}
                metrics={{
                  cpu: overview.ai_server?.cpu,
                  memory: overview.ai_server?.memory,
                  gpu: overview.ai_server?.gpu,
                  disk: overview.ai_server?.disks
                }}
                specialMetrics={overview.ai_server?.gpu ? [{
                  label: "GPU Memory",
                  value: `${overview.ai_server.gpu.memory_used_mb?.toFixed(0)}MB`,
                  percentage: overview.ai_server.gpu.memory_usage_percent,
                  icon: Activity
                }] : []}
                lastUpdated={overview.ai_server?.server_status?.last_updated}
                responseTime={overview.ai_server?.server_status?.response_time_ms}
              />

              {/* App Server Card */}
              <ServerCard
                title="App Server"
                icon={Server}
                status={overview.app_server?.server_status?.status}
                metrics={{
                  cpu: overview.app_server?.cpu,
                  memory: overview.app_server?.memory,
                  disk: overview.app_server?.disks
                }}
                specialMetrics={[
                  {
                    label: "VMs Running",
                    value: `${overview.app_server?.vms?.filter(vm => vm.status === 'running').length || 0}/${overview.app_server?.vms?.length || 0}`,
                    icon: Server
                  }
                ]}
                lastUpdated={overview.app_server?.server_status?.last_updated}
                responseTime={overview.app_server?.server_status?.response_time_ms}
              />

              {/* Storage Server Card */}
              <ServerCard
                title="Storage Server"
                icon={Database}
                status={overview.storage_server?.server_status?.status}
                metrics={{
                  cpu: overview.storage_server?.cpu,
                  memory: overview.storage_server?.memory,
                  disk: overview.storage_server?.disks
                }}
                specialMetrics={[
                  ...(overview.storage_server?.qdrant ? [{
                    label: "Qdrant",
                    value: `${overview.storage_server.qdrant.total_points?.toLocaleString()} points`,
                    icon: Database
                  }] : []),
                  {
                    label: "Filesystems",
                    value: `${overview.storage_server?.filesystems?.length || 0}`,
                    icon: Database
                  }
                ]}
                lastUpdated={overview.storage_server?.server_status?.last_updated}
                responseTime={overview.storage_server?.server_status?.response_time_ms}
              />
            </div>

            {/* Real-time Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <MetricsChart
                title="CPU Usage Across Servers"
                data={chartData}
                dataKeys={['ai_cpu', 'app_cpu', 'storage_cpu']}
                colors={['#3b82f6', '#10b981', '#f59e0b']}
                type="line"
              />
              
              <MetricsChart
                title="Memory & GPU Usage"
                data={chartData}
                dataKeys={['ai_memory', 'ai_gpu']}
                colors={['#ef4444', '#8b5cf6']}
                type="area"
              />
            </div>

            {/* Detailed VM Information */}
            {overview.app_server?.vms && overview.app_server.vms.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Virtual Machines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {overview.app_server.vms.map((vm) => (
                      <div key={vm.vmid} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{vm.name}</h4>
                          <Badge variant={vm.status === 'running' ? 'success' : 'secondary'}>
                            {vm.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>CPU: {vm.cpu_usage?.toFixed(1)}%</div>
                          <div>Memory: {vm.memory_used_gb?.toFixed(1)}GB / {vm.memory_total_gb?.toFixed(1)}GB</div>
                          <div>Disk: {vm.disk_usage_gb?.toFixed(1)}GB</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Storage Details */}
            {overview.storage_server?.filesystems && overview.storage_server.filesystems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Storage Filesystems</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {overview.storage_server.filesystems.map((fs, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">{fs.mount_point}</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>Used: {fs.used_gb?.toFixed(1)}GB / {fs.total_gb?.toFixed(1)}GB</div>
                          <div>Usage: {fs.usage_percent?.toFixed(1)}%</div>
                          <div>Files: {fs.file_count?.toLocaleString()}</div>
                          <div>Avg Size: {fs.avg_file_size_mb?.toFixed(1)}MB</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App