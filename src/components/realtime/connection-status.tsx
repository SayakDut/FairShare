'use client'

import { motion } from 'framer-motion'
import { Wifi, WifiOff, Zap } from 'lucide-react'
import { useRealtime } from '@/contexts/realtime-context'
import { Badge } from '@/components/ui/badge'

interface ConnectionStatusProps {
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ConnectionStatus({ 
  showLabel = true, 
  size = 'md',
  className = '' 
}: ConnectionStatusProps) {
  const { isConnected, events } = useRealtime()

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  }

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const recentEvents = events.slice(0, 5)
  const hasRecentActivity = recentEvents.length > 0

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Connection indicator */}
      <div className="flex items-center space-x-1">
        <motion.div
          animate={{
            scale: isConnected ? [1, 1.2, 1] : 1,
            opacity: isConnected ? [1, 0.7, 1] : 0.5,
          }}
          transition={{
            duration: 2,
            repeat: isConnected ? Infinity : 0,
            ease: "easeInOut",
          }}
          className={`rounded-full ${
            isConnected ? 'bg-success-500' : 'bg-error-500'
          } ${sizeClasses[size]}`}
        />
        
        {showLabel && (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        )}
      </div>

      {/* Activity indicator */}
      {hasRecentActivity && isConnected && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-1"
        >
          <Zap className={`text-warning-500 ${iconSizeClasses[size]}`} />
          {showLabel && (
            <span className="text-xs text-warning-600 dark:text-warning-400">
              Active
            </span>
          )}
        </motion.div>
      )}
    </div>
  )
}

interface DetailedConnectionStatusProps {
  className?: string
}

export function DetailedConnectionStatus({ className = '' }: DetailedConnectionStatusProps) {
  const { isConnected, events } = useRealtime()

  const recentEvents = events.slice(0, 10)
  const eventCounts = recentEvents.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className={`p-4 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Real-time Status
        </h3>
        <ConnectionStatus size="sm" />
      </div>

      <div className="space-y-3">
        {/* Connection status */}
        <div className="flex items-center space-x-3">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-success-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-error-600" />
          )}
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {isConnected ? 'Connected to real-time updates' : 'Disconnected from real-time updates'}
          </span>
        </div>

        {/* Recent activity summary */}
        {recentEvents.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Recent activity ({recentEvents.length} events):
            </p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(eventCounts).map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type.replace('_', ' ')}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Last event timestamp */}
        {recentEvents.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last activity: {new Date(recentEvents[0].timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  )
}
