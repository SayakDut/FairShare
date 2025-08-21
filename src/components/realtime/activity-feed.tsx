'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Receipt, 
  Users, 
  Edit, 
  Trash2, 
  UserPlus, 
  UserMinus, 
  Calculator,
  DollarSign,
  Clock
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRealtime } from '@/contexts/realtime-context'
import { formatCurrency, formatDate } from '@/lib/utils'

const getEventIcon = (type: string) => {
  switch (type) {
    case 'expense_created':
      return <Receipt className="h-4 w-4 text-success-600" />
    case 'expense_updated':
      return <Edit className="h-4 w-4 text-warning-600" />
    case 'expense_deleted':
      return <Trash2 className="h-4 w-4 text-error-600" />
    case 'member_added':
      return <UserPlus className="h-4 w-4 text-primary-600" />
    case 'member_removed':
      return <UserMinus className="h-4 w-4 text-gray-600" />
    case 'group_updated':
      return <Users className="h-4 w-4 text-primary-600" />
    case 'balance_updated':
      return <Calculator className="h-4 w-4 text-secondary-600" />
    case 'payment_made':
      return <DollarSign className="h-4 w-4 text-success-600" />
    default:
      return <Clock className="h-4 w-4 text-gray-400" />
  }
}

const getEventColor = (type: string) => {
  switch (type) {
    case 'expense_created':
      return 'bg-success-100 dark:bg-success-900'
    case 'expense_updated':
      return 'bg-warning-100 dark:bg-warning-900'
    case 'expense_deleted':
      return 'bg-error-100 dark:bg-error-900'
    case 'member_added':
    case 'group_updated':
      return 'bg-primary-100 dark:bg-primary-900'
    case 'member_removed':
      return 'bg-gray-100 dark:bg-gray-800'
    case 'balance_updated':
      return 'bg-secondary-100 dark:bg-secondary-900'
    case 'payment_made':
      return 'bg-success-100 dark:bg-success-900'
    default:
      return 'bg-gray-100 dark:bg-gray-800'
  }
}

const getEventDescription = (event: any) => {
  switch (event.type) {
    case 'expense_created':
      return `New expense "${event.payload.title}" was added`
    case 'expense_updated':
      return `Expense "${event.payload.title}" was updated`
    case 'expense_deleted':
      return 'An expense was deleted'
    case 'member_added':
      return 'A new member joined the group'
    case 'member_removed':
      return 'A member left the group'
    case 'group_updated':
      return 'Group details were updated'
    case 'balance_updated':
      return 'Balances were recalculated'
    case 'payment_made':
      return `Payment of ${formatCurrency(event.payload.amount)} was made`
    default:
      return 'Activity occurred'
  }
}

interface ActivityFeedProps {
  groupId?: string
  maxItems?: number
  showHeader?: boolean
  className?: string
}

export function ActivityFeed({ 
  groupId, 
  maxItems = 10, 
  showHeader = true,
  className = '' 
}: ActivityFeedProps) {
  const { events, isConnected } = useRealtime()

  // Filter events by group if specified
  const filteredEvents = groupId 
    ? events.filter(event => {
        // Check if event is related to the specific group
        return event.payload.group_id === groupId || 
               event.payload.groupId === groupId
      })
    : events

  const displayEvents = filteredEvents.slice(0, maxItems)

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Live updates from your groups
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-success-500' : 'bg-error-500'
              }`} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={showHeader ? '' : 'p-6'}>
        {displayEvents.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No recent activity
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Activity will appear here as it happens
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {displayEvents.map((event, index) => (
                <motion.div
                  key={`${event.timestamp}-${index}`}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${getEventColor(event.type)}`}>
                    {getEventIcon(event.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {getEventDescription(event)}
                    </p>
                    
                    {/* Event-specific details */}
                    {event.type.startsWith('expense_') && event.payload.total_amount && (
                      <div className="mt-1 flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {formatCurrency(event.payload.total_amount, event.payload.currency)}
                        </Badge>
                        {event.payload.title && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {event.payload.title}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(event.timestamp)}
                    </p>
                  </div>
                  
                  {/* Event type badge */}
                  <div className="flex-shrink-0">
                    <Badge 
                      variant="secondary" 
                      className="text-xs capitalize"
                    >
                      {event.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredEvents.length > maxItems && (
              <div className="text-center pt-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {maxItems} of {filteredEvents.length} recent events
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
