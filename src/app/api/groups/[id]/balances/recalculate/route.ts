import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { groupService, balanceService } from '@/lib/database'

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

    const group = await groupService.findById(params.id)
    
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check if user is a member of the group
    const isMember = group.members.some(member => member.userId === user.id)
    if (!isMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Recalculate balances
    await balanceService.recalculateGroupBalances(params.id)

    // Get updated balances
    const updatedBalances = await balanceService.getGroupBalances(params.id)

    return NextResponse.json({ 
      data: updatedBalances,
      message: 'Balances recalculated successfully'
    })
  } catch (error) {
    console.error('Error recalculating balances:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
