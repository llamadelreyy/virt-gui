import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatPercentage(value, decimals = 1) {
  return `${Number(value).toFixed(decimals)}%`
}

export function formatUptime(seconds) {
  if (!seconds) return 'Unknown'
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return 'Never'
  
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) { // Less than 1 minute
    return 'Just now'
  } else if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m ago`
  } else if (diff < 86400000) { // Less than 1 day
    const hours = Math.floor(diff / 3600000)
    return `${hours}h ago`
  } else {
    return date.toLocaleDateString()
  }
}

export function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'online':
    case 'running':
    case 'healthy':
      return 'text-green-600'
    case 'offline':
    case 'stopped':
    case 'error':
      return 'text-red-600'
    case 'warning':
    case 'degraded':
      return 'text-yellow-600'
    default:
      return 'text-gray-600'
  }
}

export function getStatusBadgeColor(status) {
  switch (status?.toLowerCase()) {
    case 'online':
    case 'running':
    case 'healthy':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'offline':
    case 'stopped':
    case 'error':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'warning':
    case 'degraded':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getUsageColor(percentage) {
  if (percentage >= 90) return 'text-red-600'
  if (percentage >= 75) return 'text-yellow-600'
  if (percentage >= 50) return 'text-blue-600'
  return 'text-green-600'
}

export function getProgressColor(percentage) {
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 75) return 'bg-yellow-500'
  if (percentage >= 50) return 'bg-blue-500'
  return 'bg-green-500'
}

export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function throttle(func, limit) {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function generateChartData(metrics, timeRange = 20) {
  // Generate sample time series data for charts
  const now = new Date()
  const data = []
  
  for (let i = timeRange; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60000) // 1 minute intervals
    data.push({
      time: timestamp.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      timestamp: timestamp.toISOString(),
      ...metrics
    })
  }
  
  return data
}

export function calculateTrend(current, previous) {
  if (!previous || previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

export function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    return new Promise((resolve, reject) => {
      document.execCommand('copy') ? resolve() : reject()
      textArea.remove()
    })
  }
}