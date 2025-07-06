import { Brain, Server, Database } from "lucide-react"

const ServerSidebar = ({ selectedServer, onServerSelect, overview }) => {
  const servers = [
    {
      id: 'all',
      name: 'All Servers',
      icon: Server,
      description: 'Overview of all infrastructure',
      data: overview
    },
    {
      id: 'ai',
      name: 'AI Server',
      icon: Brain,
      description: 'Machine Learning & GPU Processing',
      data: overview?.ai_server,
      status: overview?.ai_server?.server_status?.status
    },
    {
      id: 'app',
      name: 'App Server',
      icon: Server,
      description: 'Application & VM Management',
      data: overview?.app_server,
      status: overview?.app_server?.server_status?.status
    },
    {
      id: 'storage',
      name: 'Storage Server',
      icon: Database,
      description: 'Data Storage & Vector Database',
      data: overview?.storage_server,
      status: overview?.storage_server?.server_status?.status
    }
  ]

  const getStatusDot = (status) => {
    if (status === 'online') return 'status-dot-online'
    if (status === 'offline') return 'status-dot-offline'
    return 'status-dot-warning'
  }

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 p-6 space-y-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-black mb-2">Infrastructure</h2>
        <p className="text-sm text-gray-600">Select a server to view detailed metrics</p>
      </div>
      
      {servers.map((server) => (
        <div
          key={server.id}
          className={`sidebar-server-card group ${selectedServer === server.id ? 'active' : ''}`}
          onClick={() => onServerSelect(server.id)}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <server.icon className="w-8 h-8 text-gray-700 server-icon" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold text-black truncate">
                  {server.name}
                </h3>
                {server.status && (
                  <div className={getStatusDot(server.status)} />
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                {server.description}
              </p>
              
              {/* Quick metrics preview */}
              {server.data && server.id !== 'all' && (
                <div className="space-y-2">
                  {server.data.cpu && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">CPU</span>
                      <span className="font-medium text-black">
                        {server.data.cpu.usage_percent?.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {server.data.memory && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Memory</span>
                      <span className="font-medium text-black">
                        {server.data.memory.usage_percent?.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {server.data.gpu && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">GPU</span>
                      <span className="font-medium text-black">
                        {server.data.gpu.usage_percent?.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {server.id === 'all' && overview && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Total Servers</span>
                    <span className="font-medium text-black">{overview.total_servers}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Online</span>
                    <span className="font-medium text-cyan-600">{overview.online_servers}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Alerts</span>
                    <span className="font-medium text-yellow-600">{overview.alerts_count}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      ))}
    </div>
  )
}

export default ServerSidebar