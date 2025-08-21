import { useEffect, useState } from 'react'
import { useRealtime } from '@/contexts/realtime-context'

interface Group {
  id: string
  name: string
  description: string | null
  inviteCode: string
  createdAt: string
  members: Array<{
    id: string
    role: 'ADMIN' | 'MEMBER'
    user: {
      id: string
      fullName: string | null
      email: string
    }
  }>
  expenses: Array<{
    id: string
    title: string
    totalAmount: number
    currency: string
    createdAt: string
    creator: {
      id: string
      fullName: string | null
      email: string
    }
  }>
}

export function useRealtimeGroup(groupId: string | null) {
  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { subscribeToGroup, unsubscribeFromGroup, events } = useRealtime()

  // Fetch initial group data
  useEffect(() => {
    if (!groupId) {
      setGroup(null)
      setIsLoading(false)
      return
    }

    const fetchGroup = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/groups/${groupId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch group')
        }
        
        const result = await response.json()
        setGroup(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch group')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroup()
  }, [groupId])

  // Subscribe to real-time updates
  useEffect(() => {
    if (groupId) {
      subscribeToGroup(groupId)
      return () => unsubscribeFromGroup(groupId)
    }
  }, [groupId, subscribeToGroup, unsubscribeFromGroup])

  // Handle real-time events
  useEffect(() => {
    if (!group || !groupId) return

    const groupEvents = events.filter(event => {
      // Filter events related to this group
      return (
        (event.type === 'expense_created' || event.type === 'expense_updated' || event.type === 'expense_deleted') &&
        event.payload.group_id === groupId
      ) || (
        (event.type === 'member_added' || event.type === 'member_removed') &&
        event.payload.group_id === groupId
      ) || (
        event.type === 'group_updated' &&
        event.payload.id === groupId
      )
    })

    if (groupEvents.length === 0) return

    // Update group data based on events
    setGroup(currentGroup => {
      if (!currentGroup) return currentGroup

      let updatedGroup = { ...currentGroup }

      groupEvents.forEach(event => {
        switch (event.type) {
          case 'expense_created':
            // Add new expense to the list
            const newExpense = {
              id: event.payload.id,
              title: event.payload.title,
              totalAmount: event.payload.total_amount,
              currency: event.payload.currency,
              createdAt: event.payload.created_at,
              creator: {
                id: event.payload.created_by,
                fullName: null, // Would need to fetch user data
                email: '',
              },
            }
            updatedGroup.expenses = [newExpense, ...updatedGroup.expenses]
            break

          case 'expense_updated':
            // Update existing expense
            updatedGroup.expenses = updatedGroup.expenses.map(expense =>
              expense.id === event.payload.id
                ? {
                    ...expense,
                    title: event.payload.title,
                    totalAmount: event.payload.total_amount,
                    currency: event.payload.currency,
                  }
                : expense
            )
            break

          case 'expense_deleted':
            // Remove expense from list
            updatedGroup.expenses = updatedGroup.expenses.filter(
              expense => expense.id !== event.payload.id
            )
            break

          case 'group_updated':
            // Update group details
            updatedGroup = {
              ...updatedGroup,
              name: event.payload.name,
              description: event.payload.description,
            }
            break

          case 'member_added':
            // Add new member (would need to fetch user data)
            // For now, just trigger a refetch
            break

          case 'member_removed':
            // Remove member
            updatedGroup.members = updatedGroup.members.filter(
              member => member.user.id !== event.payload.user_id
            )
            break
        }
      })

      return updatedGroup
    })
  }, [events, group, groupId])

  const refetch = async () => {
    if (!groupId) return

    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/groups/${groupId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch group')
      }
      
      const result = await response.json()
      setGroup(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch group')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    group,
    isLoading,
    error,
    refetch,
  }
}
