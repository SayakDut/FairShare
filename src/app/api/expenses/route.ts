import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { expenseService, groupService, balanceService } from '@/lib/database'

const expenseItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().optional(),
  dietaryTags: z.array(z.string()).optional(),
})

const expenseSplitSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().positive('Amount must be positive'),
  percentage: z.number().min(0).max(100).optional(),
})

const createExpenseSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  totalAmount: z.number().positive('Total amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  receiptUrl: z.string().url('Invalid receipt URL').optional(),
  splitType: z.enum(['EQUAL', 'PERCENTAGE', 'CUSTOM']).optional(),
  items: z.array(expenseItemSchema).optional(),
  splits: z.array(expenseSplitSchema).optional(),
})

export async function POST(request: NextRequest) {
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
    const validation = createExpenseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { groupId, items = [], splits = [], ...expenseData } = validation.data

    // Verify user is a member of the group
    const group = await groupService.findById(groupId)
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    const isMember = group.members.some(member => member.userId === user.id)
    if (!isMember) {
      return NextResponse.json(
        { error: 'Access denied. You must be a member of this group.' },
        { status: 403 }
      )
    }

    // If no splits provided and split type is EQUAL, create equal splits for all members
    let finalSplits = splits
    if (splits.length === 0 && (!expenseData.splitType || expenseData.splitType === 'EQUAL')) {
      const splitAmount = expenseData.totalAmount / group.members.length
      finalSplits = group.members.map(member => ({
        userId: member.userId,
        amount: splitAmount,
      }))
    }

    // Validate splits total matches expense total
    const splitsTotal = finalSplits.reduce((sum, split) => sum + split.amount, 0)
    if (Math.abs(splitsTotal - expenseData.totalAmount) > 0.01) {
      return NextResponse.json(
        { error: 'Splits total does not match expense total' },
        { status: 400 }
      )
    }

    // Create expense
    const expense = await expenseService.create({
      ...expenseData,
      groupId,
      createdBy: user.id,
      items,
      splits: finalSplits,
    })

    // Recalculate group balances
    await balanceService.recalculateGroupBalances(groupId)

    return NextResponse.json({ data: expense }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
