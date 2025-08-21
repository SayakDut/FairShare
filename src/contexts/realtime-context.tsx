'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/providers'
import toast from 'react-hot-toast'

interface RealtimeEvent {
  type: 'expense_created' | 'expense_updated' | 'expense_deleted' | 
        'group_updated' | 'member_added' | 'member_removed' |
        'balance_updated' | 'payment_made'
  payload: any
  timestamp: string
  userId: string
}

interface RealtimeContextType {
  isConnected: boolean
  subscribeToGroup: (groupId: string) => void
  unsubscribeFromGroup: (groupId: string) => void
  subscribeToUserEvents: () => void
  unsubscribeFromUserEvents: () => void
  events: RealtimeEvent[]
  clearEvents: () => void
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [channels, setChannels] = useState<Map<string, RealtimeChannel>>(new Map())
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      // Subscribe to user-specific events
      subscribeToUserEvents()
      
      // Set up connection status monitoring
      const channel = supabase.channel('connection-status')
      
      channel
        .on('presence', { event: 'sync' }, () => {
          setIsConnected(true)
        })
        .on('presence', { event: 'join' }, () => {
          setIsConnected(true)
        })
        .on('presence', { event: 'leave' }, () => {
          setIsConnected(false)
        })
        .subscribe()

      return () => {
        // Clean up all subscriptions
        channels.forEach(channel => {
          supabase.removeChannel(channel)
        })
        supabase.removeChannel(channel)
        setChannels(new Map())
      }
    }
  }, [user])

  const addEvent = (event: RealtimeEvent) => {
    setEvents(prev => [event, ...prev.slice(0, 99)]) // Keep last 100 events
  }

  const subscribeToGroup = (groupId: string) => {
    if (!user || channels.has(`group:${groupId}`)) return

    const channel = supabase
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const event: RealtimeEvent = {
            type: payload.eventType === 'INSERT' ? 'expense_created' :
                  payload.eventType === 'UPDATE' ? 'expense_updated' : 'expense_deleted',
            payload: payload.new || payload.old,
            timestamp: new Date().toISOString(),
            userId: user.id,
          }
          
          addEvent(event)
          
          // Show toast notifications
          switch (event.type) {
            case 'expense_created':
              toast.success(`New expense added: ${payload.new.title}`)
              break
            case 'expense_updated':
              toast.success(`Expense updated: ${payload.new.title}`)
              break
            case 'expense_deleted':
              toast.success('Expense deleted')
              break
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const event: RealtimeEvent = {
            type: payload.eventType === 'INSERT' ? 'member_added' : 'member_removed',
            payload: payload.new || payload.old,
            timestamp: new Date().toISOString(),
            userId: user.id,
          }
          
          addEvent(event)
          
          if (event.type === 'member_added') {
            toast.success('New member joined the group')
          } else {
            toast.success('Member left the group')
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'groups',
          filter: `id=eq.${groupId}`,
        },
        (payload) => {
          const event: RealtimeEvent = {
            type: 'group_updated',
            payload: payload.new,
            timestamp: new Date().toISOString(),
            userId: user.id,
          }
          
          addEvent(event)
          toast.success('Group details updated')
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'balances',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const event: RealtimeEvent = {
            type: 'balance_updated',
            payload: payload.new || payload.old,
            timestamp: new Date().toISOString(),
            userId: user.id,
          }
          
          addEvent(event)
        }
      )
      .subscribe()

    setChannels(prev => new Map(prev).set(`group:${groupId}`, channel))
  }

  const unsubscribeFromGroup = (groupId: string) => {
    const channel = channels.get(`group:${groupId}`)
    if (channel) {
      supabase.removeChannel(channel)
      setChannels(prev => {
        const newChannels = new Map(prev)
        newChannels.delete(`group:${groupId}`)
        return newChannels
      })
    }
  }

  const subscribeToUserEvents = () => {
    if (!user || channels.has('user-events')) return

    const channel = supabase
      .channel('user-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const event: RealtimeEvent = {
            type: payload.eventType === 'INSERT' ? 'member_added' : 'member_removed',
            payload: payload.new || payload.old,
            timestamp: new Date().toISOString(),
            userId: user.id,
          }
          
          addEvent(event)
          
          if (event.type === 'member_added') {
            toast.success('You were added to a new group!')
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'balances',
          filter: `from_user_id=eq.${user.id}`,
        },
        (payload) => {
          const event: RealtimeEvent = {
            type: 'balance_updated',
            payload: payload.new || payload.old,
            timestamp: new Date().toISOString(),
            userId: user.id,
          }
          
          addEvent(event)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'balances',
          filter: `to_user_id=eq.${user.id}`,
        },
        (payload) => {
          const event: RealtimeEvent = {
            type: 'balance_updated',
            payload: payload.new || payload.old,
            timestamp: new Date().toISOString(),
            userId: user.id,
          }
          
          addEvent(event)
        }
      )
      .subscribe()

    setChannels(prev => new Map(prev).set('user-events', channel))
  }

  const unsubscribeFromUserEvents = () => {
    const channel = channels.get('user-events')
    if (channel) {
      supabase.removeChannel(channel)
      setChannels(prev => {
        const newChannels = new Map(prev)
        newChannels.delete('user-events')
        return newChannels
      })
    }
  }

  const clearEvents = () => {
    setEvents([])
  }

  const value: RealtimeContextType = {
    isConnected,
    subscribeToGroup,
    unsubscribeFromGroup,
    subscribeToUserEvents,
    unsubscribeFromUserEvents,
    events,
    clearEvents,
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}
