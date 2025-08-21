import { Decimal } from 'decimal.js'

export interface UserBalance {
  userId: string
  userName: string
  email: string
  totalOwed: number    // Amount this user is owed by others
  totalOwing: number   // Amount this user owes to others
  netBalance: number   // Positive = owed money, Negative = owes money
}

export interface DebtRelationship {
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  amount: number
  currency: string
}

export interface OptimizedPayment {
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  amount: number
  currency: string
  description: string
}

export interface GroupBalanceSummary {
  groupId: string
  groupName: string
  totalExpenses: number
  userBalances: UserBalance[]
  debtRelationships: DebtRelationship[]
  optimizedPayments: OptimizedPayment[]
  isSettled: boolean
}

export class BalanceCalculator {
  /**
   * Calculate balances for a group based on expenses and splits
   */
  static calculateGroupBalances(
    expenses: Array<{
      id: string
      totalAmount: number
      currency: string
      createdBy: string
      splits: Array<{
        userId: string
        amount: number
      }>
    }>,
    users: Array<{
      id: string
      fullName: string | null
      email: string
    }>
  ): GroupBalanceSummary {
    const userMap = new Map(users.map(user => [user.id, user]))
    const balances = new Map<string, { paid: Decimal, owes: Decimal }>()

    // Initialize balances for all users
    users.forEach(user => {
      balances.set(user.id, { paid: new Decimal(0), owes: new Decimal(0) })
    })

    // Calculate what each user paid and owes
    expenses.forEach(expense => {
      const totalAmount = new Decimal(expense.totalAmount)
      const paidBy = expense.createdBy

      // Add to what the payer paid
      const payerBalance = balances.get(paidBy)
      if (payerBalance) {
        payerBalance.paid = payerBalance.paid.plus(totalAmount)
      }

      // Add to what each person owes
      expense.splits.forEach(split => {
        const userBalance = balances.get(split.userId)
        if (userBalance) {
          userBalance.owes = userBalance.owes.plus(new Decimal(split.amount))
        }
      })
    })

    // Calculate net balances
    const userBalances: UserBalance[] = []
    const debtMatrix = new Map<string, Map<string, Decimal>>()

    users.forEach(user => {
      const balance = balances.get(user.id)
      if (!balance) return

      const totalPaid = balance.paid.toNumber()
      const totalOwes = balance.owes.toNumber()
      const netBalance = totalPaid - totalOwes

      userBalances.push({
        userId: user.id,
        userName: user.fullName || user.email,
        email: user.email,
        totalOwed: Math.max(0, netBalance),
        totalOwing: Math.max(0, -netBalance),
        netBalance,
      })

      // Initialize debt matrix row
      debtMatrix.set(user.id, new Map())
    })

    // Calculate direct debt relationships
    expenses.forEach(expense => {
      const paidBy = expense.createdBy
      
      expense.splits.forEach(split => {
        if (split.userId !== paidBy) {
          const debtRow = debtMatrix.get(split.userId)
          if (debtRow) {
            const currentDebt = debtRow.get(paidBy) || new Decimal(0)
            debtRow.set(paidBy, currentDebt.plus(new Decimal(split.amount)))
          }
        }
      })
    })

    // Convert debt matrix to debt relationships
    const debtRelationships: DebtRelationship[] = []
    debtMatrix.forEach((debts, fromUserId) => {
      debts.forEach((amount, toUserId) => {
        if (amount.gt(0)) {
          const fromUser = userMap.get(fromUserId)
          const toUser = userMap.get(toUserId)
          
          if (fromUser && toUser) {
            debtRelationships.push({
              fromUserId,
              fromUserName: fromUser.fullName || fromUser.email,
              toUserId,
              toUserName: toUser.fullName || toUser.email,
              amount: amount.toNumber(),
              currency: 'USD', // Assuming USD for now
            })
          }
        }
      })
    })

    // Optimize payments using debt simplification
    const optimizedPayments = this.optimizePayments(userBalances, userMap)

    // Check if group is settled
    const isSettled = userBalances.every(balance => 
      Math.abs(balance.netBalance) < 0.01
    )

    const totalExpenses = expenses.reduce((sum, expense) => 
      sum + expense.totalAmount, 0
    )

    return {
      groupId: '', // Will be set by caller
      groupName: '', // Will be set by caller
      totalExpenses,
      userBalances,
      debtRelationships,
      optimizedPayments,
      isSettled,
    }
  }

  /**
   * Optimize payments using the debt simplification algorithm
   * This reduces the number of transactions needed to settle all debts
   */
  static optimizePayments(
    userBalances: UserBalance[],
    userMap: Map<string, { id: string; fullName: string | null; email: string }>
  ): OptimizedPayment[] {
    const payments: OptimizedPayment[] = []
    
    // Create arrays of creditors (owed money) and debtors (owe money)
    const creditors = userBalances
      .filter(balance => balance.netBalance > 0.01)
      .map(balance => ({ ...balance, remaining: balance.netBalance }))
      .sort((a, b) => b.remaining - a.remaining)

    const debtors = userBalances
      .filter(balance => balance.netBalance < -0.01)
      .map(balance => ({ ...balance, remaining: Math.abs(balance.netBalance) }))
      .sort((a, b) => b.remaining - a.remaining)

    // Greedy algorithm to minimize transactions
    let creditorIndex = 0
    let debtorIndex = 0

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex]
      const debtor = debtors[debtorIndex]

      const paymentAmount = Math.min(creditor.remaining, debtor.remaining)
      
      if (paymentAmount > 0.01) {
        const creditorUser = userMap.get(creditor.userId)
        const debtorUser = userMap.get(debtor.userId)

        if (creditorUser && debtorUser) {
          payments.push({
            fromUserId: debtor.userId,
            fromUserName: debtor.userName,
            toUserId: creditor.userId,
            toUserName: creditor.userName,
            amount: Math.round(paymentAmount * 100) / 100, // Round to 2 decimal places
            currency: 'USD',
            description: `Settlement payment from ${debtor.userName} to ${creditor.userName}`,
          })
        }

        creditor.remaining -= paymentAmount
        debtor.remaining -= paymentAmount
      }

      // Move to next creditor or debtor
      if (creditor.remaining < 0.01) {
        creditorIndex++
      }
      if (debtor.remaining < 0.01) {
        debtorIndex++
      }
    }

    return payments
  }

  /**
   * Calculate the optimal payment plan for a specific user
   */
  static getUserPaymentPlan(
    userId: string,
    groupBalances: GroupBalanceSummary
  ): {
    paymentsToMake: OptimizedPayment[]
    paymentsToReceive: OptimizedPayment[]
    netAmount: number
  } {
    const paymentsToMake = groupBalances.optimizedPayments.filter(
      payment => payment.fromUserId === userId
    )

    const paymentsToReceive = groupBalances.optimizedPayments.filter(
      payment => payment.toUserId === userId
    )

    const totalToMake = paymentsToMake.reduce((sum, payment) => sum + payment.amount, 0)
    const totalToReceive = paymentsToReceive.reduce((sum, payment) => sum + payment.amount, 0)
    const netAmount = totalToReceive - totalToMake

    return {
      paymentsToMake,
      paymentsToReceive,
      netAmount,
    }
  }

  /**
   * Simulate a payment and return updated balances
   */
  static simulatePayment(
    groupBalances: GroupBalanceSummary,
    payment: OptimizedPayment
  ): GroupBalanceSummary {
    const updatedUserBalances = groupBalances.userBalances.map(balance => {
      if (balance.userId === payment.fromUserId) {
        return {
          ...balance,
          totalOwing: Math.max(0, balance.totalOwing - payment.amount),
          netBalance: balance.netBalance + payment.amount,
        }
      } else if (balance.userId === payment.toUserId) {
        return {
          ...balance,
          totalOwed: Math.max(0, balance.totalOwed - payment.amount),
          netBalance: balance.netBalance - payment.amount,
        }
      }
      return balance
    })

    const updatedOptimizedPayments = groupBalances.optimizedPayments.filter(
      p => !(p.fromUserId === payment.fromUserId && p.toUserId === payment.toUserId)
    )

    const isSettled = updatedUserBalances.every(balance => 
      Math.abs(balance.netBalance) < 0.01
    )

    return {
      ...groupBalances,
      userBalances: updatedUserBalances,
      optimizedPayments: updatedOptimizedPayments,
      isSettled,
    }
  }

  /**
   * Calculate split amounts for different split types
   */
  static calculateSplitAmounts(
    totalAmount: number,
    splitType: 'EQUAL' | 'PERCENTAGE' | 'CUSTOM',
    participants: Array<{
      userId: string
      percentage?: number
      customAmount?: number
    }>
  ): Array<{ userId: string; amount: number }> {
    const total = new Decimal(totalAmount)
    const splits: Array<{ userId: string; amount: number }> = []

    switch (splitType) {
      case 'EQUAL':
        const equalAmount = total.div(participants.length)
        participants.forEach(participant => {
          splits.push({
            userId: participant.userId,
            amount: equalAmount.toNumber(),
          })
        })
        break

      case 'PERCENTAGE':
        participants.forEach(participant => {
          if (participant.percentage !== undefined) {
            const amount = total.mul(participant.percentage).div(100)
            splits.push({
              userId: participant.userId,
              amount: amount.toNumber(),
            })
          }
        })
        break

      case 'CUSTOM':
        participants.forEach(participant => {
          if (participant.customAmount !== undefined) {
            splits.push({
              userId: participant.userId,
              amount: participant.customAmount,
            })
          }
        })
        break
    }

    // Ensure splits add up to total (handle rounding errors)
    const splitTotal = splits.reduce((sum, split) => sum + split.amount, 0)
    const difference = totalAmount - splitTotal

    if (Math.abs(difference) > 0.01 && splits.length > 0) {
      // Add the difference to the first split
      splits[0].amount += difference
    }

    return splits.map(split => ({
      userId: split.userId,
      amount: Math.round(split.amount * 100) / 100, // Round to 2 decimal places
    }))
  }
}
