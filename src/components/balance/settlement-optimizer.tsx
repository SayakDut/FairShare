'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calculator, ArrowRight, CheckCircle, Users, DollarSign, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/ui/loading'
import { Modal } from '@/components/ui/modal'
import { formatCurrency } from '@/lib/utils'
import { GroupBalanceSummary, OptimizedPayment } from '@/lib/balance-calculator'

interface SettlementOptimizerProps {
  groupId: string
  isOpen: boolean
  onClose: () => void
}

export function SettlementOptimizer({ groupId, isOpen, onClose }: SettlementOptimizerProps) {
  const [balanceSummary, setBalanceSummary] = useState<GroupBalanceSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)

  useEffect(() => {
    if (isOpen && groupId) {
      fetchOptimizedBalances()
    }
  }, [isOpen, groupId])

  const fetchOptimizedBalances = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/balances/optimize`)
      if (!response.ok) {
        throw new Error('Failed to fetch optimized balances')
      }
      
      const result = await response.json()
      setBalanceSummary(result.data)
    } catch (error) {
      toast.error('Failed to calculate optimized payments')
    } finally {
      setIsLoading(false)
    }
  }

  const simulatePayment = async (payment: OptimizedPayment) => {
    setIsSimulating(true)
    try {
      const paymentId = `${payment.fromUserId}-${payment.toUserId}`
      const response = await fetch(`/api/groups/${groupId}/balances/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId }),
      })

      if (!response.ok) {
        throw new Error('Failed to simulate payment')
      }

      const result = await response.json()
      setBalanceSummary(result.data)
      toast.success('Payment simulated successfully!')
    } catch (error) {
      toast.error('Failed to simulate payment')
    } finally {
      setIsSimulating(false)
    }
  }

  const getTotalTransactions = () => {
    if (!balanceSummary) return 0
    return balanceSummary.optimizedPayments.length
  }

  const getTotalAmount = () => {
    if (!balanceSummary) return 0
    return balanceSummary.optimizedPayments.reduce((sum, payment) => sum + payment.amount, 0)
  }

  const getOriginalTransactions = () => {
    if (!balanceSummary) return 0
    return balanceSummary.debtRelationships.length
  }

  const getSavings = () => {
    const original = getOriginalTransactions()
    const optimized = getTotalTransactions()
    return Math.max(0, original - optimized)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settlement Optimizer"
      description="Minimize the number of transactions needed to settle all debts."
      size="lg"
    >
      {isLoading ? (
        <LoadingState>Calculating optimal payments...</LoadingState>
      ) : !balanceSummary ? (
        <div className="text-center py-8">
          <Calculator className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Failed to load balance data
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Optimization Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {getTotalTransactions()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Optimized Payments
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                  {getSavings()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Transactions Saved
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(getTotalAmount())}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total to Settle
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settlement Status */}
          {balanceSummary.isSettled ? (
            <Card className="border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-950">
              <CardContent className="p-6 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-success-600 dark:text-success-400 mb-4" />
                <h3 className="text-lg font-medium text-success-900 dark:text-success-100">
                  All Settled Up!
                </h3>
                <p className="text-success-700 dark:text-success-300">
                  Everyone in this group is even. No payments needed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Optimization Benefits */}
              <Card className="border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950">
                <CardHeader>
                  <CardTitle className="flex items-center text-primary-900 dark:text-primary-100">
                    <Zap className="mr-2 h-5 w-5" />
                    Optimization Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                          Fewer Transactions
                        </p>
                        <p className="text-xs text-primary-700 dark:text-primary-300">
                          Reduced from {getOriginalTransactions()} to {getTotalTransactions()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                          Simplified Payments
                        </p>
                        <p className="text-xs text-primary-700 dark:text-primary-300">
                          Optimal debt consolidation
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Optimized Payments */}
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Payments</CardTitle>
                  <CardDescription>
                    Complete these payments to settle all debts efficiently
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {balanceSummary.optimizedPayments.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto h-12 w-12 text-success-600 dark:text-success-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No payments needed - everyone is settled up!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {balanceSummary.optimizedPayments.map((payment, index) => (
                        <motion.div
                          key={`${payment.fromUserId}-${payment.toUserId}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 rounded-full bg-warning-100 dark:bg-warning-900 flex items-center justify-center">
                                <span className="text-xs font-medium text-warning-600 dark:text-warning-400">
                                  {payment.fromUserName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                              <div className="h-8 w-8 rounded-full bg-success-100 dark:bg-success-900 flex items-center justify-center">
                                <span className="text-xs font-medium text-success-600 dark:text-success-400">
                                  {payment.toUserName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {payment.fromUserName} pays {payment.toUserName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {payment.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline" className="font-mono">
                              {formatCurrency(payment.amount, payment.currency)}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => simulatePayment(payment)}
                              disabled={isSimulating}
                            >
                              {isSimulating ? 'Simulating...' : 'Mark Paid'}
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {!balanceSummary.isSettled && (
              <Button onClick={fetchOptimizedBalances} disabled={isLoading}>
                <Calculator className="mr-2 h-4 w-4" />
                Recalculate
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
