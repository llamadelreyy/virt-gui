import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"

const MetricsChart = ({ 
  title, 
  data = [], 
  dataKeys = [], 
  colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
  type = 'line',
  height = 300,
  showGrid = true,
  showTooltip = true,
  className = ""
}) => {
  const ChartComponent = type === 'area' ? AreaChart : LineChart

  const formatTooltipValue = (value, name) => {
    if (typeof value === 'number') {
      if (name.toLowerCase().includes('percent') || name.toLowerCase().includes('usage')) {
        return [`${value.toFixed(1)}%`, name]
      }
      if (name.toLowerCase().includes('temp')) {
        return [`${value.toFixed(1)}°C`, name]
      }
      if (name.toLowerCase().includes('gb') || name.toLowerCase().includes('memory')) {
        return [`${value.toFixed(2)} GB`, name]
      }
      return [value.toFixed(2), name]
    }
    return [value, name]
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {formatTooltipValue(entry.value, entry.name)[1]}: {formatTooltipValue(entry.value, entry.name)[0]}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            
            {dataKeys.map((key, index) => {
              const color = colors[index % colors.length]
              
              if (type === 'area') {
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.1}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: color }}
                  />
                )
              } else {
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: color }}
                  />
                )
              }
            })}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default MetricsChart