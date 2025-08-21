import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { expenseService, balanceService } from '@/lib/database'

const updateExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  totalAmount: z.number().positive('Total amount must be positive').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  receiptUrl: z.string().url('Invalid receipt URL').optional(),
})

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

    const expense = await expenseService.findById(params.id)
    
    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Check if user is a member of the group
    const isMember = expense.group.members.some(member => member.userId === user.id)
    if (!isMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({ data: expense })
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const body = await request.json()
    const validation = updateExpenseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const expense = await expenseService.findById(params.id)
    
    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Check if user is the creator of the expense
    if (expense.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'Access denied. Only the expense creator can edit this expense.' },
        { status: 403 }
      )
    }

    const updatedExpense = await expenseService.update(params.id, validation.data)

    // If total amount changed, recalculate balances
    if (validation.data.totalAmount && validation.data.totalAmount !== Number(expense.totalAmount)) {
      await balanceService.recalculateGroupBalances(expense.groupId)
    }

    return NextResponse.json({ data: updatedExpense })
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const expense = await expenseService.findById(params.id)
    
    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Check if user is the creator of the expense or an admin of the group
    const isCreator = expense.createdBy === user.id
    const isGroupAdmin = expense.group.members.some(
      member => member.userId === user.id && member.role === 'ADMIN'
    )

    if (!isCreator && !isGroupAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Only the expense creator or group admin can delete this expense.' },
        { status: 403 }
      )
    }

    await expenseService.delete(params.id)

    // Recalculate group balances after deletion
    await balanceService.recalculateGroupBalances(expense.groupId)

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
