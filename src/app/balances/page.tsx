'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingState, EmptyState } from '@/components/ui/loading'
import { Select } from '@/components/ui/dropdown'
import { SettlementOptimizer } from '@/components/balance/settlement-optimizer'
import { formatCurrency } from '@/lib/utils'

interface UserBalance {
  user: {
    id: string
    name: string
    email: string
  }
  amount: number
  currency: string
  updatedAt: string
}

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

interface Group {
  id: string
  name: string
}

export default function BalancesPage() {
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false)

  useEffect(() => {
    Promise.all([fetchBalances(), fetchGroups()])
  }, [selectedGroup])

  const fetchBalances = async () => {
    try {
      setIsLoading(true)
      const url = selectedGroup 
        ? `/api/balances?groupId=${selectedGroup}`
        : '/api/balances'
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch balances')
      }
      
      const result = await response.json()
      setBalanceSummary(result.data)
    } catch (error) {
      toast.error('Failed to load balances')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      if (!response.ok) {
        throw new Error('Failed to fetch groups')
      }
      const result = await response.json()
      setGroups(result.data)
    } catch (error) {
      toast.error('Failed to load groups')
    }
  }

  const getBalancesByType = () => {
    if (!balanceSummary) return { owedToMe: [], iOwe: [] }

    const owedToMe = balanceSummary.balances.filter(balance => 
      balance.toUser.id === 'current-user-id' // This should come from auth context
    )

    const iOwe = balanceSummary.balances.filter(balance => 
      balance.fromUser.id === 'current-user-id' // This should come from auth context
    )

    return { owedToMe, iOwe }
  }

  const { owedToMe, iOwe } = getBalancesByType()

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <LoadingState>Loading your balances...</LoadingState>
        </div>
      </DashboardLayout>
    )
  }

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
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Balances
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Track who owes what and settle up with friends
              </p>
            </div>
            <div className="w-64">
              <Select
                options={[
                  { value: '', label: 'All Groups' },
                  ...groups.map(group => ({
                    value: group.id,
                    label: group.name,
                  }))
                ]}
                value={selectedGroup}
                onValueChange={setSelectedGroup}
                placeholder="Filter by group"
              />
            </div>
          </div>

          {/* Summary Cards */}
          {balanceSummary && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-8 w-8 text-success-600 dark:text-success-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        You're Owed
                      </p>
                      <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                        {formatCurrency(balanceSummary.totalOwed)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingDown className="h-8 w-8 text-warning-600 dark:text-warning-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        You Owe
                      </p>
                      <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                        {formatCurrency(balanceSummary.totalOwing)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Calculator className={`h-8 w-8 ${
                        balanceSummary.netBalance >= 0 
                          ? 'text-success-600 dark:text-success-400'
                          : 'text-warning-600 dark:text-warning-400'
                      }`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Net Balance
                      </p>
                      <p className={`text-2xl font-bold ${
                        balanceSummary.netBalance >= 0 
                          ? 'text-success-600 dark:text-success-400'
                          : 'text-warning-600 dark:text-warning-400'
                      }`}>
                        {balanceSummary.netBalance >= 0 ? '+' : ''}
                        {formatCurrency(balanceSummary.netBalance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Balance Details */}
          {!balanceSummary || balanceSummary.balances.length === 0 ? (
            <EmptyState
              icon={<Calculator className="h-6 w-6 text-gray-400" />}
              title="No balances to show"
              description="You're all settled up! Create some expenses to see balances here."
              action={
                <Button>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Money Owed to You */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-success-600 dark:text-success-400">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    You're Owed ({owedToMe.length})
                  </CardTitle>
                  <CardDescription>
                    Money that others owe you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {owedToMe.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No one owes you money right now
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {owedToMe.map((balance) => (
                        <div key={balance.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-success-100 dark:bg-success-900 flex items-center justify-center">
                              <span className="text-sm font-medium text-success-600 dark:text-success-400">
                                {balance.fromUser.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {balance.fromUser.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {balance.groupName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-success-600 dark:text-success-400">
                              {formatCurrency(balance.amount, balance.currency)}
                            </p>
                            <Button size="sm" variant="outline" className="mt-2">
                              Remind
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Money You Owe */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-warning-600 dark:text-warning-400">
                    <TrendingDown className="mr-2 h-5 w-5" />
                    You Owe ({iOwe.length})
                  </CardTitle>
                  <CardDescription>
                    Money you need to pay back
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {iOwe.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        You don't owe anyone money right now
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {iOwe.map((balance) => (
                        <div key={balance.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-warning-100 dark:bg-warning-900 flex items-center justify-center">
                              <span className="text-sm font-medium text-warning-600 dark:text-warning-400">
                                {balance.toUser.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {balance.toUser.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {balance.groupName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-warning-600 dark:text-warning-400">
                              {formatCurrency(balance.amount, balance.currency)}
                            </p>
                            <Button size="sm" className="mt-2">
                              Settle Up
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settlement Suggestions */}
          {balanceSummary && balanceSummary.balances.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Settlement Suggestions
                </CardTitle>
                <CardDescription>
                  Optimize your payments to minimize transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calculator className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Minimize transactions with smart debt consolidation
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsOptimizerOpen(true)}
                    disabled={!selectedGroup}
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    Optimize Payments
                  </Button>
                  {!selectedGroup && (
                    <p className="text-xs text-gray-400 mt-2">
                      Select a group to optimize payments
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Settlement Optimizer Modal */}
      {selectedGroup && (
        <SettlementOptimizer
          groupId={selectedGroup}
          isOpen={isOptimizerOpen}
          onClose={() => setIsOptimizerOpen(false)}
        />
      )}
    </DashboardLayout>
  )
}
