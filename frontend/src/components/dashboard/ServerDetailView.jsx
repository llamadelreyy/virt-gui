import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import MetricsChart from "@/components/charts/MetricsChart"
import { 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Zap,
  Activity,
  Clock,
  Thermometer,
  Server,
  Database,
  Brain
} from "lucide-react"

const MetricCard = ({ icon: Icon, title, value, unit, percentage, status, description }) => {
  const getStatusColor = () => {
    if (percentage > 90) return 'text-red-600'
    if (percentage > 75) return 'text-yellow-600'
    return 'text-[#46a4a1]'
  }

  return (
    <div className="metric-card-enhanced">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Icon className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h3 className="font-semibold text-black">{title}</h3>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
        </div>
        {status && (
          <Badge variant={status === 'online' ? 'success' : 'error'}>
            {status}
          </Badge>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold text-black">
            {value}
            {unit && <span className="text-lg text-gray-500 ml-1">{unit}</span>}
          </span>
          {percentage !== undefined && (
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
        
        {percentage !== undefined && (
          <div className="progress-bar-cyan h-2">
            <div 
              className="progress-fill-cyan"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

const ServerDetailView = ({ serverId, serverData, chartData }) => {
  if (serverId === 'all') {
    return (
      <div className="detail-panel space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Infrastructure Overview</h1>
          <p className="text-gray-600">Real-time monitoring across all servers</p>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            icon={Server}
            title="Total Servers"
            value={serverData?.total_servers || 0}
            description="Active infrastructure nodes"
          />
          <MetricCard
            icon={Activity}
            title="Online Servers"
            value={serverData?.online_servers || 0}
            description="Currently operational"
            status="online"
          />
          <MetricCard
            icon={Clock}
            title="System Alerts"
            value={serverData?.alerts_count || 0}
            description="Active monitoring alerts"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="chart-container-enhanced">
            <MetricsChart
              title="CPU Usage Across Servers"
              data={chartData}
              dataKeys={['ai_cpu', 'app_cpu', 'storage_cpu']}
              colors={['#46a4a1', '#000000', '#6b7280']}
              type="line"
            />
          </div>
          
          <div className="chart-container-enhanced">
            <MetricsChart
              title="Memory & GPU Usage"
              data={chartData}
              dataKeys={['ai_memory', 'ai_gpu']}
              colors={['#46a4a1', '#000000']}
              type="area"
            />
          </div>
        </div>

        {/* Server Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {serverData?.ai_server && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-[#46a4a1]" />
                  <CardTitle className="text-lg">AI Server</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">CPU</span>
                  <span className="font-medium">{serverData.ai_server.cpu?.usage_percent?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Memory</span>
                  <span className="font-medium">{serverData.ai_server.memory?.usage_percent?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GPU</span>
                  <span className="font-medium">{serverData.ai_server.gpu?.usage_percent?.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          )}

          {serverData?.app_server && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Server className="w-5 h-5 text-[#46a4a1]" />
                  <CardTitle className="text-lg">App Server</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">CPU</span>
                  <span className="font-medium">{serverData.app_server.cpu?.usage_percent?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Memory</span>
                  <span className="font-medium">{serverData.app_server.memory?.usage_percent?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VMs</span>
                  <span className="font-medium">{serverData.app_server.vms?.filter(vm => vm.status === 'running').length || 0}/{serverData.app_server.vms?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {serverData?.storage_server && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-[#46a4a1]" />
                  <CardTitle className="text-lg">Storage Server</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">CPU</span>
                  <span className="font-medium">{serverData.storage_server.cpu?.usage_percent?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Memory</span>
                  <span className="font-medium">{serverData.storage_server.memory?.usage_percent?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Filesystems</span>
                  <span className="font-medium">{serverData.storage_server.filesystems?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // Individual server view
  const getServerData = () => {
    switch (serverId) {
      case 'ai': return serverData?.ai_server
      case 'app': return serverData?.app_server
      case 'storage': return serverData?.storage_server
      default: return null
    }
  }

  const getServerTitle = () => {
    switch (serverId) {
      case 'ai': return 'AI Server'
      case 'app': return 'App Server'
      case 'storage': return 'Storage Server'
      default: return 'Server'
    }
  }

  const getServerIcon = () => {
    switch (serverId) {
      case 'ai': return Brain
      case 'app': return Server
      case 'storage': return Database
      default: return Server
    }
  }

  const data = getServerData()
  const ServerIcon = getServerIcon()

  if (!data) {
    return (
      <div className="detail-panel flex items-center justify-center h-64">
        <div className="text-center">
          <ServerIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No data available for {getServerTitle()}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-panel space-y-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <ServerIcon className="w-8 h-8 text-[#46a4a1]" />
          <h1 className="text-3xl font-bold text-black">{getServerTitle()}</h1>
          <Badge variant={data.server_status?.status === 'online' ? 'success' : 'error'}>
            {data.server_status?.status || 'Unknown'}
          </Badge>
        </div>
        <p className="text-gray-600">Detailed hardware and performance metrics</p>
        {data.server_status?.response_time_ms && (
          <p className="text-sm text-gray-500 mt-1">
            Response time: {data.server_status.response_time_ms}ms
          </p>
        )}
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.cpu && (
          <MetricCard
            icon={Cpu}
            title="CPU Usage"
            value={data.cpu.usage_percent?.toFixed(1)}
            unit="%"
            percentage={data.cpu.usage_percent}
            description={`${data.cpu.cores || 'N/A'} cores available`}
          />
        )}

        {data.memory && (
          <MetricCard
            icon={MemoryStick}
            title="Memory Usage"
            value={`${(data.memory.used_gb || 0).toFixed(1)} / ${(data.memory.total_gb || 0).toFixed(1)}`}
            unit="GB"
            percentage={data.memory.usage_percent}
            description="System RAM utilization"
          />
        )}

        {data.gpu && (
          <MetricCard
            icon={Zap}
            title="GPU Usage"
            value={data.gpu.usage_percent?.toFixed(1)}
            unit="%"
            percentage={data.gpu.usage_percent}
            description={`${data.gpu.temperature || 'N/A'}°C temperature`}
          />
        )}

        {data.gpu && (
          <MetricCard
            icon={MemoryStick}
            title="GPU Memory"
            value={`${(data.gpu.memory_used_mb / 1024 || 0).toFixed(1)} / ${(data.gpu.memory_total_mb / 1024 || 0).toFixed(1)}`}
            unit="GB"
            percentage={data.gpu.memory_usage_percent}
            description="Video memory utilization"
          />
        )}

        {data.disks && data.disks.length > 0 && (
          <MetricCard
            icon={HardDrive}
            title="Primary Storage"
            value={`${(data.disks[0].used_gb || 0).toFixed(1)} / ${(data.disks[0].total_gb || 0).toFixed(1)}`}
            unit="GB"
            percentage={data.disks[0].usage_percent}
            description={data.disks[0].mount_point || 'Primary disk'}
          />
        )}

        {data.gpu && data.gpu.temperature && (
          <MetricCard
            icon={Thermometer}
            title="GPU Temperature"
            value={data.gpu.temperature}
            unit="°C"
            description="Graphics card thermal status"
          />
        )}
      </div>

      {/* Additional Details */}
      {serverId === 'app' && data.vms && data.vms.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl text-black">Virtual Machines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.vms.map((vm) => (
                <div key={vm.vmid} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-black">{vm.name}</h4>
                    <Badge variant={vm.status === 'running' ? 'success' : 'secondary'}>
                      {vm.status}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">CPU</span>
                      <span className="font-medium text-black">{vm.cpu_usage?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Memory</span>
                      <span className="font-medium text-black">
                        {vm.memory_used_gb?.toFixed(1)}GB / {vm.memory_total_gb?.toFixed(1)}GB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Disk</span>
                      <span className="font-medium text-black">{vm.disk_usage_gb?.toFixed(1)}GB</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {serverId === 'storage' && data.filesystems && data.filesystems.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl text-black">Storage Filesystems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.filesystems.map((fs, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-black mb-3">{fs.mount_point}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Used</span>
                      <span className="font-medium text-black">
                        {fs.used_gb?.toFixed(1)}GB / {fs.total_gb?.toFixed(1)}GB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Usage</span>
                      <span className="font-medium text-black">{fs.usage_percent?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Files</span>
                      <span className="font-medium text-black">{fs.file_count?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Size</span>
                      <span className="font-medium text-black">{fs.avg_file_size_mb?.toFixed(1)}MB</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {serverId === 'storage' && data.qdrant && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl text-black">Qdrant Vector Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-[#46a4a1] mb-1">
                  {data.qdrant.total_points?.toLocaleString() || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Total Points</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-[#46a4a1] mb-1">
                  {data.qdrant.collections?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Collections</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  Online
                </div>
                <div className="text-sm text-gray-600">Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ServerDetailView