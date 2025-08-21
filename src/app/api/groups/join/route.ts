import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { groupService } from '@/lib/database'

const joinGroupSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
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
    const validation = joinGroupSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { inviteCode } = validation.data

    // Find group by invite code
    const group = await groupService.findByInviteCode(inviteCode)
    
    if (!group) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = group.members.find(member => member.userId === user.id)
    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      )
    }

    // Add user to group
    const newMember = await groupService.addMember(group.id, user.id)
    
    // Return the group with updated member list
    const updatedGroup = await groupService.findById(group.id)
    
    return NextResponse.json({ 
      data: updatedGroup,
      message: `Successfully joined ${group.name}!`
    }, { status: 201 })
  } catch (error) {
    console.error('Error joining group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
