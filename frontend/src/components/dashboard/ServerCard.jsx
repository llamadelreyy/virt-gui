import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Progress } from "@/components/ui/Progress"
import { formatPercentage, formatBytes, getStatusColor, getProgressColor } from "@/lib/utils"
import { 
  Server, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Zap,
  Activity,
  Clock,
  AlertTriangle
} from "lucide-react"

const StatusIndicator = ({ status }) => {
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'online':
      case 'running':
        return 'success'
      case 'offline':
      case 'stopped':
        return 'error'
      case 'warning':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${
        status === 'online' ? 'bg-green-500 animate-pulse' : 
        status === 'offline' ? 'bg-red-500' : 
        'bg-yellow-500'
      }`} />
      <Badge variant={getStatusVariant(status)}>
        {status || 'Unknown'}
      </Badge>
    </div>
  )
}

const MetricItem = ({ icon: Icon, label, value, unit, percentage, color }) => (
  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className="text-right">
      <div className={`text-sm font-bold ${color || 'text-foreground'}`}>
        {value}{unit && ` ${unit}`}
      </div>
      {percentage !== undefined && (
        <div className="w-16 mt-1">
          <Progress 
            value={percentage} 
            className="h-1"
          />
        </div>
      )}
    </div>
  </div>
)

const ServerCard = ({ 
  title, 
  icon: Icon = Server,
  status = 'offline',
  metrics = {},
  specialMetrics = [],
  lastUpdated,
  responseTime,
  className = ""
}) => {
  const { cpu, memory, gpu, disk } = metrics

  return (
    <Card className={`transition-all hover:shadow-lg ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <StatusIndicator status={status} />
        </div>
        {responseTime && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {responseTime}ms
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* CPU Metrics */}
        {cpu && (
          <MetricItem
            icon={Cpu}
            label="CPU"
            value={formatPercentage(cpu.usage_percent)}
            percentage={cpu.usage_percent}
            color={getStatusColor(
              cpu.usage_percent > 90 ? 'error' : 
              cpu.usage_percent > 75 ? 'warning' : 'success'
            )}
          />
        )}

        {/* Memory Metrics */}
        {memory && (
          <MetricItem
            icon={MemoryStick}
            label="Memory"
            value={`${formatBytes(memory.used_gb * 1024**3)} / ${formatBytes(memory.total_gb * 1024**3)}`}
            percentage={memory.usage_percent}
            color={getStatusColor(
              memory.usage_percent > 90 ? 'error' : 
              memory.usage_percent > 75 ? 'warning' : 'success'
            )}
          />
        )}

        {/* GPU Metrics (if available) */}
        {gpu && (
          <MetricItem
            icon={Zap}
            label="GPU"
            value={`${formatPercentage(gpu.usage_percent)} • ${gpu.temperature}°C`}
            percentage={gpu.usage_percent}
            color={getStatusColor(
              gpu.usage_percent > 90 ? 'error' : 
              gpu.usage_percent > 75 ? 'warning' : 'success'
            )}
          />
        )}

        {/* Disk Metrics */}
        {disk && disk.length > 0 && (
          <MetricItem
            icon={HardDrive}
            label="Storage"
            value={`${formatBytes(disk[0].used_gb * 1024**3)} / ${formatBytes(disk[0].total_gb * 1024**3)}`}
            percentage={disk[0].usage_percent}
            color={getStatusColor(
              disk[0].usage_percent > 90 ? 'error' : 
              disk[0].usage_percent > 75 ? 'warning' : 'success'
            )}
          />
        )}

        {/* Special Metrics */}
        {specialMetrics.map((metric, index) => (
          <MetricItem
            key={index}
            icon={metric.icon || Activity}
            label={metric.label}
            value={metric.value}
            unit={metric.unit}
            percentage={metric.percentage}
            color={metric.color}
          />
        ))}

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ServerCard