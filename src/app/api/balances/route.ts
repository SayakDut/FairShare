import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { balanceService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')

    let balances
    if (groupId) {
      // Get balances for a specific group
      balances = await balanceService.getGroupBalances(groupId)
    } else {
      // Get all balances for the user
      balances = await balanceService.getUserBalance(user.id)
    }

    // Process balances to create a summary
    const balanceSummary = {
      totalOwed: 0,
      totalOwing: 0,
      netBalance: 0,
      balances: balances.map(balance => ({
        id: balance.id,
        groupId: balance.groupId,
        groupName: balance.group.name,
        fromUser: {
          id: balance.fromUser.id,
          name: balance.fromUser.fullName || balance.fromUser.email,
          email: balance.fromUser.email,
        },
        toUser: {
          id: balance.toUser.id,
          name: balance.toUser.fullName || balance.toUser.email,
          email: balance.toUser.email,
        },
        amount: Number(balance.amount),
        currency: balance.currency,
        updatedAt: balance.updatedAt,
      })),
    }

    // Calculate totals for the current user
    balanceSummary.balances.forEach(balance => {
      if (balance.fromUser.id === user.id) {
        balanceSummary.totalOwing += balance.amount
      } else if (balance.toUser.id === user.id) {
        balanceSummary.totalOwed += balance.amount
      }
    })

    balanceSummary.netBalance = balanceSummary.totalOwed - balanceSummary.totalOwing

    return NextResponse.json({ data: balanceSummary })
  } catch (error) {
    console.error('Error fetching balances:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
