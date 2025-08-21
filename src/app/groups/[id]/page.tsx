'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Receipt, 
  DollarSign, 
  Settings,
  Calendar,
  User
} from 'lucide-react'
import toast from 'react-hot-toast'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/loading'
import { ActivityFeed } from '@/components/realtime/activity-feed'
import { useRealtimeGroup } from '@/hooks/use-realtime-group'
import { formatCurrency, formatDate } from '@/lib/utils'

interface GroupMember {
  id: string
  role: 'ADMIN' | 'MEMBER'
  joinedAt: string
  user: {
    id: string
    fullName: string | null
    email: string
    avatarUrl: string | null
  }
}

interface ExpenseItem {
  id: string
  name: string
  amount: number
  category: string | null
  dietaryTags: string[]
}

interface ExpenseSplit {
  id: string
  amount: number
  percentage: number | null
  user: {
    id: string
    fullName: string | null
    email: string
  }
}

interface Expense {
  id: string
  title: string
  description: string | null
  totalAmount: number
  currency: string
  receiptUrl: string | null
  splitType: 'EQUAL' | 'PERCENTAGE' | 'CUSTOM'
  createdAt: string
  creator: {
    id: string
    fullName: string | null
    email: string
  }
  items: ExpenseItem[]
  splits: ExpenseSplit[]
}

interface Group {
  id: string
  name: string
  description: string | null
  inviteCode: string
  createdAt: string
  members: GroupMember[]
  expenses: Expense[]
}

export default function GroupPage() {
  const params = useParams()
  const groupId = params.id as string

  // Use real-time group hook
  const { group, isLoading, error } = useRealtimeGroup(groupId)

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <LoadingState>Loading group details...</LoadingState>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !group) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ErrorState
            title={error || 'Group not found'}
            description="The group you're looking for doesn't exist or you don't have access to it."
            action={
              <Link href="/groups">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Groups
                </Button>
              </Link>
            }
          />
        </div>
      </DashboardLayout>
    )
  }

  const totalExpenses = group.expenses.reduce((sum, expense) => sum + Number(expense.totalAmount), 0)

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link href="/groups">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {group.name}
                </h1>
                {group.description && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {group.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Link href={`/groups/${group.id}/settings`}>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Members
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {group.members.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Receipt className="h-8 w-8 text-success-600 dark:text-success-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Expenses
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {group.expenses.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-warning-600 dark:text-warning-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Spent
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(totalExpenses)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Members */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Members
                  </CardTitle>
                  <CardDescription>
                    Group members and their roles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {group.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {member.user.fullName || member.user.email}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Joined {formatDate(member.joinedAt)}
                            </p>
                          </div>
                        </div>
                        {member.role === 'ADMIN' && (
                          <Badge variant="secondary">Admin</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Expenses */}
            <div>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Receipt className="mr-2 h-5 w-5" />
                        Recent Expenses
                      </CardTitle>
                      <CardDescription>
                        Latest expenses in this group
                      </CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Expense
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {group.expenses.length === 0 ? (
                    <EmptyState
                      icon={<Receipt className="h-6 w-6 text-gray-400" />}
                      title="No expenses yet"
                      description="Add your first expense to start tracking shared costs."
                      action={
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Expense
                        </Button>
                      }
                    />
                  ) : (
                    <div className="space-y-4">
                      {group.expenses.slice(0, 5).map((expense) => (
                        <div key={expense.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {expense.title}
                              </h4>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatCurrency(Number(expense.totalAmount), expense.currency)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <span>
                                Added by {expense.creator.fullName || expense.creator.email}
                              </span>
                              <span className="mx-2">•</span>
                              <span>{formatDate(expense.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {group.expenses.length > 5 && (
                        <div className="text-center">
                          <Button variant="outline" size="sm">
                            View All Expenses
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="mt-8">
            <ActivityFeed groupId={group.id} maxItems={10} />
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
