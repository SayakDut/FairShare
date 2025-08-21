import { useEffect, useState } from 'react'
import { useRealtime } from '@/contexts/realtime-context'
import { useAuth } from '@/components/providers'

interface BalanceSummary {
  totalOwed: number
  totalOwing: number
  netBalance: number
  balances: Array<{
    id: string
    groupId: string
    groupName: string
    fromUser: {
      id: string
      name: string
      email: string
    }
    toUser: {
      id: string
      name: string
      email: string
    }
    amount: number
    currency: string
    updatedAt: string
  }>
}

export function useRealtimeBalances(groupId?: string) {
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { events } = useRealtime()
  const { user } = useAuth()

  // Fetch initial balance data
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const url = groupId 
          ? `/api/balances?groupId=${groupId}`
          : '/api/balances'
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch balances')
        }
        
        const result = await response.json()
        setBalanceSummary(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch balances')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalances()
  }, [groupId])

  // Handle real-time balance updates
  useEffect(() => {
    if (!balanceSummary || !user) return

    const balanceEvents = events.filter(event => 
      event.type === 'balance_updated' || 
      event.type === 'expense_created' || 
      event.type === 'expense_updated' || 
      event.type === 'expense_deleted'
    )

    if (balanceEvents.length === 0) return

    // Debounce balance updates to avoid too many recalculations
    const timeoutId = setTimeout(async () => {
      try {
        const url = groupId 
          ? `/api/balances?groupId=${groupId}`
          : '/api/balances'
        
        const response = await fetch(url)
        if (response.ok) {
          const result = await response.json()
          setBalanceSummary(result.data)
        }
      } catch (err) {
        console.error('Failed to update balances:', err)
      }
    }, 1000) // Wait 1 second before updating

    return () => clearTimeout(timeoutId)
  }, [events, balanceSummary, user, groupId])

  const refetch = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const url = groupId 
        ? `/api/balances?groupId=${groupId}`
        : '/api/balances'
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch balances')
      }
      
      const result = await response.json()
      setBalanceSummary(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balances')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    balanceSummary,
    isLoading,
    error,
    refetch,
  }
}
