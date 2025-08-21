import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { balanceService } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const groupId = params.id

    // Get optimized balance summary
    const balanceSummary = await balanceService.getGroupBalanceSummary(groupId)

    return NextResponse.json({ 
      data: balanceSummary,
      message: 'Balance optimization calculated successfully'
    })
  } catch (error) {
    console.error('Error calculating optimized balances:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const groupId = params.id
    const body = await request.json()
    const { paymentId } = body

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Get current balance summary
    const balanceSummary = await balanceService.getGroupBalanceSummary(groupId)
    
    // Find the payment to simulate
    const payment = balanceSummary.optimizedPayments.find(p => 
      `${p.fromUserId}-${p.toUserId}` === paymentId
    )

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // In a real app, you would record the payment here
    // For now, we'll just return the simulated result
    const { BalanceCalculator } = await import('@/lib/balance-calculator')
    const simulatedResult = BalanceCalculator.simulatePayment(balanceSummary, payment)

    return NextResponse.json({ 
      data: simulatedResult,
      message: 'Payment simulated successfully'
    })
  } catch (error) {
    console.error('Error simulating payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
