import { prisma } from './prisma'
import { User, Expense } from '@/types'
import { BalanceCalculator, GroupBalanceSummary } from './balance-calculator'

// User operations
export const userService = {
  async create(userData: {
    id: string
    email: string
    fullName?: string
    avatarUrl?: string
  }) {
    return await prisma.user.create({
      data: userData,
    })
  },

  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        groupMemberships: {
          include: {
            group: true,
          },
        },
      },
    })
  },

  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    })
  },

  async update(id: string, data: Partial<User>) {
    return await prisma.user.update({
      where: { id },
      data,
    })
  },

  async updateDietaryPreferences(id: string, preferences: string[]) {
    return await prisma.user.update({
      where: { id },
      data: { dietaryPreferences: preferences },
    })
  },
}

// Group operations
export const groupService = {
  async create(groupData: {
    name: string
    description?: string
    createdBy: string
    inviteCode: string
  }) {
    return await prisma.group.create({
      data: {
        ...groupData,
        members: {
          create: {
            userId: groupData.createdBy,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    })
  },

  async findById(id: string) {
    return await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        expenses: {
          include: {
            creator: true,
            items: true,
            splits: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })
  },

  async findByInviteCode(inviteCode: string) {
    return await prisma.group.findUnique({
      where: { inviteCode },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    })
  },

  async getUserGroups(userId: string) {
    return await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            expenses: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })
  },

  async addMember(groupId: string, userId: string) {
    return await prisma.groupMember.create({
      data: {
        groupId,
        userId,
        role: 'MEMBER',
      },
      include: {
        user: true,
        group: true,
      },
    })
  },

  async removeMember(groupId: string, userId: string) {
    return await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    })
  },

  async updateMemberRole(groupId: string, userId: string, role: 'ADMIN' | 'MEMBER') {
    return await prisma.groupMember.update({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      data: { role },
    })
  },
}

// Expense operations
export const expenseService = {
  async create(expenseData: {
    groupId: string
    createdBy: string
    title: string
    description?: string
    totalAmount: number
    currency?: string
    receiptUrl?: string
    splitType?: 'EQUAL' | 'PERCENTAGE' | 'CUSTOM'
    items?: Array<{
      name: string
      amount: number
      category?: string
      dietaryTags?: string[]
    }>
    splits?: Array<{
      userId: string
      amount: number
      percentage?: number
    }>
  }) {
    const { items = [], splits = [], ...expense } = expenseData

    return await prisma.expense.create({
      data: {
        ...expense,
        items: {
          create: items,
        },
        splits: {
          create: splits,
        },
      },
      include: {
        items: true,
        splits: {
          include: {
            user: true,
          },
        },
        creator: true,
      },
    })
  },

  async findById(id: string) {
    return await prisma.expense.findUnique({
      where: { id },
      include: {
        items: true,
        splits: {
          include: {
            user: true,
          },
        },
        creator: true,
        group: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })
  },

  async update(id: string, data: Partial<Expense>) {
    return await prisma.expense.update({
      where: { id },
      data,
    })
  },

  async delete(id: string) {
    return await prisma.expense.delete({
      where: { id },
    })
  },
}

// Balance operations
export const balanceService = {
  async getGroupBalances(groupId: string) {
    return await prisma.balance.findMany({
      where: { groupId },
      include: {
        fromUser: true,
        toUser: true,
      },
    })
  },

  async getUserBalance(userId: string, groupId?: string) {
    const where = groupId 
      ? { 
          OR: [
            { fromUserId: userId, groupId },
            { toUserId: userId, groupId }
          ]
        }
      : {
          OR: [
            { fromUserId: userId },
            { toUserId: userId }
          ]
        }

    return await prisma.balance.findMany({
      where,
      include: {
        fromUser: true,
        toUser: true,
        group: true,
      },
    })
  },

  async updateBalance(
    groupId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
    currency: string = 'USD'
  ) {
    return await prisma.balance.upsert({
      where: {
        groupId_fromUserId_toUserId: {
          groupId,
          fromUserId,
          toUserId,
        },
      },
      update: {
        amount,
        currency,
      },
      create: {
        groupId,
        fromUserId,
        toUserId,
        amount,
        currency,
      },
    })
  },

  async recalculateGroupBalances(groupId: string): Promise<GroupBalanceSummary> {
    // Fetch group with expenses and members
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        expenses: {
          include: {
            splits: true,
          },
        },
      },
    })

    if (!group) {
      throw new Error('Group not found')
    }

    // Transform data for balance calculator
    const expenses = group.expenses.map(expense => ({
      id: expense.id,
      totalAmount: Number(expense.totalAmount),
      currency: expense.currency,
      createdBy: expense.createdBy,
      splits: expense.splits.map(split => ({
        userId: split.userId,
        amount: Number(split.amount),
      })),
    }))

    const users = group.members.map(member => ({
      id: member.user.id,
      fullName: member.user.fullName,
      email: member.user.email,
    }))

    // Calculate optimized balances
    const balanceSummary = BalanceCalculator.calculateGroupBalances(expenses, users)
    balanceSummary.groupId = groupId
    balanceSummary.groupName = group.name

    // Clear existing balances
    await prisma.balance.deleteMany({
      where: { groupId },
    })

    // Store optimized debt relationships
    const balancePromises = balanceSummary.debtRelationships.map(debt =>
      this.updateBalance(groupId, debt.fromUserId, debt.toUserId, debt.amount, debt.currency)
    )

    await Promise.all(balancePromises)

    return balanceSummary
  },

  async getGroupBalanceSummary(groupId: string): Promise<GroupBalanceSummary> {
    // First try to get from cache/database, otherwise recalculate
    return await this.recalculateGroupBalances(groupId)
  },
}
