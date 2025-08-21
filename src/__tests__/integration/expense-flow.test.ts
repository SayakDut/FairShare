import { BalanceCalculator } from '@/lib/balance-calculator'

describe('Expense Flow Integration', () => {
  const mockUsers = [
    { id: 'alice', fullName: 'Alice Smith', email: 'alice@example.com' },
    { id: 'bob', fullName: 'Bob Johnson', email: 'bob@example.com' },
    { id: 'charlie', fullName: 'Charlie Brown', email: 'charlie@example.com' },
  ]

  describe('Complete expense and balance flow', () => {
    it('should handle a complete trip expense scenario', () => {
      // Scenario: Alice, Bob, and Charlie go on a trip
      // Alice pays for hotel, Bob pays for dinner, Charlie pays for gas
      
      const expenses = [
        {
          id: 'hotel',
          totalAmount: 300, // Hotel for 3 nights
          currency: 'USD',
          createdBy: 'alice',
          splits: [
            { userId: 'alice', amount: 100 },
            { userId: 'bob', amount: 100 },
            { userId: 'charlie', amount: 100 },
          ],
        },
        {
          id: 'dinner',
          totalAmount: 150, // Fancy dinner
          currency: 'USD',
          createdBy: 'bob',
          splits: [
            { userId: 'alice', amount: 50 },
            { userId: 'bob', amount: 50 },
            { userId: 'charlie', amount: 50 },
          ],
        },
        {
          id: 'gas',
          totalAmount: 90, // Gas for the trip
          currency: 'USD',
          createdBy: 'charlie',
          splits: [
            { userId: 'alice', amount: 30 },
            { userId: 'bob', amount: 30 },
            { userId: 'charlie', amount: 30 },
          ],
        },
      ]

      const result = BalanceCalculator.calculateGroupBalances(expenses, mockUsers)

      // Verify total expenses
      expect(result.totalExpenses).toBe(540)

      // Verify individual balances
      // Alice: paid $300, owes $180, net: +$120
      const aliceBalance = result.userBalances.find(b => b.userId === 'alice')
      expect(aliceBalance?.netBalance).toBe(120)
      expect(aliceBalance?.totalOwed).toBe(120)
      expect(aliceBalance?.totalOwing).toBe(0)

      // Bob: paid $150, owes $180, net: -$30
      const bobBalance = result.userBalances.find(b => b.userId === 'bob')
      expect(bobBalance?.netBalance).toBe(-30)
      expect(bobBalance?.totalOwed).toBe(0)
      expect(bobBalance?.totalOwing).toBe(30)

      // Charlie: paid $90, owes $180, net: -$90
      const charlieBalance = result.userBalances.find(b => b.userId === 'charlie')
      expect(charlieBalance?.netBalance).toBe(-90)
      expect(charlieBalance?.totalOwed).toBe(0)
      expect(charlieBalance?.totalOwing).toBe(90)

      // Verify optimized payments
      expect(result.optimizedPayments).toHaveLength(2)
      
      const totalOptimizedPayments = result.optimizedPayments.reduce(
        (sum, payment) => sum + payment.amount, 0
      )
      expect(totalOptimizedPayments).toBe(120) // Total amount owed to Alice

      // Verify payments are to Alice
      result.optimizedPayments.forEach(payment => {
        expect(payment.toUserId).toBe('alice')
      })
    })

    it('should handle unequal splits correctly', () => {
      // Scenario: Dinner where Alice orders expensive wine
      const expenses = [
        {
          id: 'dinner-with-wine',
          totalAmount: 200,
          currency: 'USD',
          createdBy: 'alice',
          splits: [
            { userId: 'alice', amount: 120 }, // Alice had the wine
            { userId: 'bob', amount: 40 },
            { userId: 'charlie', amount: 40 },
          ],
        },
      ]

      const result = BalanceCalculator.calculateGroupBalances(expenses, mockUsers)

      // Alice: paid $200, owes $120, net: +$80
      const aliceBalance = result.userBalances.find(b => b.userId === 'alice')
      expect(aliceBalance?.netBalance).toBe(80)

      // Bob: paid $0, owes $40, net: -$40
      const bobBalance = result.userBalances.find(b => b.userId === 'bob')
      expect(bobBalance?.netBalance).toBe(-40)

      // Charlie: paid $0, owes $40, net: -$40
      const charlieBalance = result.userBalances.find(b => b.userId === 'charlie')
      expect(charlieBalance?.netBalance).toBe(-40)

      // Verify optimized payments
      expect(result.optimizedPayments).toHaveLength(2)
      expect(result.optimizedPayments[0].amount).toBe(40)
      expect(result.optimizedPayments[1].amount).toBe(40)
    })

    it('should handle payment simulation correctly', () => {
      const expenses = [
        {
          id: 'lunch',
          totalAmount: 60,
          currency: 'USD',
          createdBy: 'alice',
          splits: [
            { userId: 'alice', amount: 20 },
            { userId: 'bob', amount: 20 },
            { userId: 'charlie', amount: 20 },
          ],
        },
      ]

      const initialResult = BalanceCalculator.calculateGroupBalances(expenses, mockUsers)
      
      // Bob pays Alice $20
      const payment = initialResult.optimizedPayments.find(p => p.fromUserId === 'bob')!
      const afterBobPayment = BalanceCalculator.simulatePayment(initialResult, payment)

      // After Bob's payment, only Charlie should owe money
      const aliceBalanceAfter = afterBobPayment.userBalances.find(b => b.userId === 'alice')
      const bobBalanceAfter = afterBobPayment.userBalances.find(b => b.userId === 'bob')
      const charlieBalanceAfter = afterBobPayment.userBalances.find(b => b.userId === 'charlie')

      expect(aliceBalanceAfter?.netBalance).toBe(20) // Still owed $20 by Charlie
      expect(bobBalanceAfter?.netBalance).toBe(0) // Settled up
      expect(charlieBalanceAfter?.netBalance).toBe(-20) // Still owes $20

      // Should have one remaining payment
      expect(afterBobPayment.optimizedPayments).toHaveLength(1)
      expect(afterBobPayment.optimizedPayments[0].fromUserId).toBe('charlie')

      // Charlie pays Alice $20
      const charliePayment = afterBobPayment.optimizedPayments[0]
      const finalResult = BalanceCalculator.simulatePayment(afterBobPayment, charliePayment)

      // Everyone should be settled
      expect(finalResult.isSettled).toBe(true)
      expect(finalResult.optimizedPayments).toHaveLength(0)
      
      finalResult.userBalances.forEach(balance => {
        expect(Math.abs(balance.netBalance)).toBeLessThan(0.01)
      })
    })

    it('should handle complex multi-expense scenario', () => {
      // Scenario: Week-long vacation with multiple expenses
      const expenses = [
        // Day 1: Alice pays for hotel
        {
          id: 'hotel-day1',
          totalAmount: 120,
          currency: 'USD',
          createdBy: 'alice',
          splits: [
            { userId: 'alice', amount: 40 },
            { userId: 'bob', amount: 40 },
            { userId: 'charlie', amount: 40 },
          ],
        },
        // Day 1: Bob pays for dinner
        {
          id: 'dinner-day1',
          totalAmount: 90,
          currency: 'USD',
          createdBy: 'bob',
          splits: [
            { userId: 'alice', amount: 30 },
            { userId: 'bob', amount: 30 },
            { userId: 'charlie', amount: 30 },
          ],
        },
        // Day 2: Charlie pays for activities
        {
          id: 'activities-day2',
          totalAmount: 150,
          currency: 'USD',
          createdBy: 'charlie',
          splits: [
            { userId: 'alice', amount: 50 },
            { userId: 'bob', amount: 50 },
            { userId: 'charlie', amount: 50 },
          ],
        },
        // Day 2: Alice pays for lunch
        {
          id: 'lunch-day2',
          totalAmount: 45,
          currency: 'USD',
          createdBy: 'alice',
          splits: [
            { userId: 'alice', amount: 15 },
            { userId: 'bob', amount: 15 },
            { userId: 'charlie', amount: 15 },
          ],
        },
      ]

      const result = BalanceCalculator.calculateGroupBalances(expenses, mockUsers)

      // Verify total
      expect(result.totalExpenses).toBe(405)

      // Calculate expected balances
      // Alice: paid $165, owes $135, net: +$30
      const aliceBalance = result.userBalances.find(b => b.userId === 'alice')
      expect(aliceBalance?.netBalance).toBe(30)

      // Bob: paid $90, owes $135, net: -$45
      const bobBalance = result.userBalances.find(b => b.userId === 'bob')
      expect(bobBalance?.netBalance).toBe(-45)

      // Charlie: paid $150, owes $135, net: +$15
      const charlieBalance = result.userBalances.find(b => b.userId === 'charlie')
      expect(charlieBalance?.netBalance).toBe(15)

      // Verify optimization reduces transactions
      const directDebts = result.debtRelationships.length
      const optimizedPayments = result.optimizedPayments.length
      
      expect(optimizedPayments).toBeLessThanOrEqual(directDebts)
      expect(optimizedPayments).toBe(1) // Should only need Bob to pay $45 total

      // Verify the payment is from Bob
      expect(result.optimizedPayments[0].fromUserId).toBe('bob')
      expect(result.optimizedPayments[0].amount).toBe(45)
    })

    it('should handle edge case with zero balances', () => {
      const expenses = [
        {
          id: 'self-expense',
          totalAmount: 50,
          currency: 'USD',
          createdBy: 'alice',
          splits: [
            { userId: 'alice', amount: 50 }, // Alice pays for herself only
          ],
        },
      ]

      const result = BalanceCalculator.calculateGroupBalances(expenses, mockUsers)

      expect(result.isSettled).toBe(true)
      expect(result.optimizedPayments).toHaveLength(0)
      
      // Alice should have zero net balance
      const aliceBalance = result.userBalances.find(b => b.userId === 'alice')
      expect(aliceBalance?.netBalance).toBe(0)
    })
  })

  describe('Split calculation integration', () => {
    it('should integrate split calculations with balance calculations', () => {
      const participants = [
        { userId: 'alice' },
        { userId: 'bob' },
        { userId: 'charlie' },
      ]

      const splits = BalanceCalculator.calculateSplitAmounts(100, 'EQUAL', participants)
      
      const expense = {
        id: 'test-expense',
        totalAmount: 100,
        currency: 'USD',
        createdBy: 'alice',
        splits,
      }

      const result = BalanceCalculator.calculateGroupBalances([expense], mockUsers)

      // Verify splits were calculated correctly
      expect(splits).toHaveLength(3)
      splits.forEach(split => {
        expect(split.amount).toBeCloseTo(33.33, 2)
      })

      // Verify balance calculation used the splits correctly
      const aliceBalance = result.userBalances.find(b => b.userId === 'alice')
      expect(aliceBalance?.netBalance).toBeCloseTo(66.67, 2)
    })
  })
})
