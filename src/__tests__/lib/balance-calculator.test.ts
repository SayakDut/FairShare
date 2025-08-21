import { BalanceCalculator } from '@/lib/balance-calculator'

describe('BalanceCalculator', () => {
  const mockUsers = [
    { id: 'user1', fullName: 'Alice', email: 'alice@example.com' },
    { id: 'user2', fullName: 'Bob', email: 'bob@example.com' },
    { id: 'user3', fullName: 'Charlie', email: 'charlie@example.com' },
  ]

  describe('calculateGroupBalances', () => {
    it('should calculate balances correctly for simple expense', () => {
      const expenses = [
        {
          id: 'exp1',
          totalAmount: 30,
          currency: 'USD',
          createdBy: 'user1',
          splits: [
            { userId: 'user1', amount: 10 },
            { userId: 'user2', amount: 10 },
            { userId: 'user3', amount: 10 },
          ],
        },
      ]

      const result = BalanceCalculator.calculateGroupBalances(expenses, mockUsers)

      expect(result.userBalances).toHaveLength(3)
      
      // Alice paid $30, owes $10, net: +$20
      const aliceBalance = result.userBalances.find(b => b.userId === 'user1')
      expect(aliceBalance?.netBalance).toBe(20)
      expect(aliceBalance?.totalOwed).toBe(20)
      expect(aliceBalance?.totalOwing).toBe(0)

      // Bob paid $0, owes $10, net: -$10
      const bobBalance = result.userBalances.find(b => b.userId === 'user2')
      expect(bobBalance?.netBalance).toBe(-10)
      expect(bobBalance?.totalOwed).toBe(0)
      expect(bobBalance?.totalOwing).toBe(10)

      // Charlie paid $0, owes $10, net: -$10
      const charlieBalance = result.userBalances.find(b => b.userId === 'user3')
      expect(charlieBalance?.netBalance).toBe(-10)
      expect(charlieBalance?.totalOwed).toBe(0)
      expect(charlieBalance?.totalOwing).toBe(10)
    })

    it('should handle multiple expenses correctly', () => {
      const expenses = [
        {
          id: 'exp1',
          totalAmount: 30,
          currency: 'USD',
          createdBy: 'user1', // Alice pays
          splits: [
            { userId: 'user1', amount: 10 },
            { userId: 'user2', amount: 10 },
            { userId: 'user3', amount: 10 },
          ],
        },
        {
          id: 'exp2',
          totalAmount: 60,
          currency: 'USD',
          createdBy: 'user2', // Bob pays
          splits: [
            { userId: 'user1', amount: 20 },
            { userId: 'user2', amount: 20 },
            { userId: 'user3', amount: 20 },
          ],
        },
      ]

      const result = BalanceCalculator.calculateGroupBalances(expenses, mockUsers)

      // Alice: paid $30, owes $30, net: $0
      const aliceBalance = result.userBalances.find(b => b.userId === 'user1')
      expect(aliceBalance?.netBalance).toBe(0)

      // Bob: paid $60, owes $30, net: +$30
      const bobBalance = result.userBalances.find(b => b.userId === 'user2')
      expect(bobBalance?.netBalance).toBe(30)

      // Charlie: paid $0, owes $30, net: -$30
      const charlieBalance = result.userBalances.find(b => b.userId === 'user3')
      expect(charlieBalance?.netBalance).toBe(-30)
    })

    it('should optimize payments correctly', () => {
      const expenses = [
        {
          id: 'exp1',
          totalAmount: 60,
          currency: 'USD',
          createdBy: 'user1',
          splits: [
            { userId: 'user1', amount: 20 },
            { userId: 'user2', amount: 20 },
            { userId: 'user3', amount: 20 },
          ],
        },
      ]

      const result = BalanceCalculator.calculateGroupBalances(expenses, mockUsers)

      expect(result.optimizedPayments).toHaveLength(2)
      
      // Should have payments from user2 and user3 to user1
      const paymentsToAlice = result.optimizedPayments.filter(p => p.toUserId === 'user1')
      expect(paymentsToAlice).toHaveLength(2)
      
      const totalPayments = result.optimizedPayments.reduce((sum, p) => sum + p.amount, 0)
      expect(totalPayments).toBe(40) // $20 from Bob + $20 from Charlie
    })

    it('should detect when group is settled', () => {
      const expenses = [
        {
          id: 'exp1',
          totalAmount: 30,
          currency: 'USD',
          createdBy: 'user1',
          splits: [
            { userId: 'user1', amount: 30 },
          ],
        },
      ]

      const result = BalanceCalculator.calculateGroupBalances(expenses, mockUsers)

      expect(result.isSettled).toBe(true)
      expect(result.optimizedPayments).toHaveLength(0)
    })
  })

  describe('calculateSplitAmounts', () => {
    it('should calculate equal splits correctly', () => {
      const participants = [
        { userId: 'user1' },
        { userId: 'user2' },
        { userId: 'user3' },
      ]

      const splits = BalanceCalculator.calculateSplitAmounts(30, 'EQUAL', participants)

      expect(splits).toHaveLength(3)
      splits.forEach(split => {
        expect(split.amount).toBe(10)
      })
    })

    it('should calculate percentage splits correctly', () => {
      const participants = [
        { userId: 'user1', percentage: 50 },
        { userId: 'user2', percentage: 30 },
        { userId: 'user3', percentage: 20 },
      ]

      const splits = BalanceCalculator.calculateSplitAmounts(100, 'PERCENTAGE', participants)

      expect(splits).toHaveLength(3)
      expect(splits.find(s => s.userId === 'user1')?.amount).toBe(50)
      expect(splits.find(s => s.userId === 'user2')?.amount).toBe(30)
      expect(splits.find(s => s.userId === 'user3')?.amount).toBe(20)
    })

    it('should calculate custom splits correctly', () => {
      const participants = [
        { userId: 'user1', customAmount: 15 },
        { userId: 'user2', customAmount: 25 },
        { userId: 'user3', customAmount: 10 },
      ]

      const splits = BalanceCalculator.calculateSplitAmounts(50, 'CUSTOM', participants)

      expect(splits).toHaveLength(3)
      expect(splits.find(s => s.userId === 'user1')?.amount).toBe(15)
      expect(splits.find(s => s.userId === 'user2')?.amount).toBe(25)
      expect(splits.find(s => s.userId === 'user3')?.amount).toBe(10)
    })

    it('should handle rounding errors in equal splits', () => {
      const participants = [
        { userId: 'user1' },
        { userId: 'user2' },
        { userId: 'user3' },
      ]

      const splits = BalanceCalculator.calculateSplitAmounts(10, 'EQUAL', participants)

      expect(splits).toHaveLength(3)
      
      const total = splits.reduce((sum, split) => sum + split.amount, 0)
      expect(total).toBe(10) // Should still add up to original amount
    })
  })

  describe('optimizePayments', () => {
    it('should minimize number of transactions', () => {
      const userBalances = [
        { userId: 'user1', userName: 'Alice', email: 'alice@example.com', totalOwed: 40, totalOwing: 0, netBalance: 40 },
        { userId: 'user2', userName: 'Bob', email: 'bob@example.com', totalOwed: 0, totalOwing: 20, netBalance: -20 },
        { userId: 'user3', userName: 'Charlie', email: 'charlie@example.com', totalOwed: 0, totalOwing: 20, netBalance: -20 },
      ]

      const userMap = new Map(mockUsers.map(user => [user.id, user]))
      const payments = BalanceCalculator.optimizePayments(userBalances, userMap)

      expect(payments).toHaveLength(2) // Should be 2 payments instead of potentially more
      
      const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0)
      expect(totalPayments).toBe(40)
    })

    it('should handle complex debt relationships', () => {
      const userBalances = [
        { userId: 'user1', userName: 'Alice', email: 'alice@example.com', totalOwed: 10, totalOwing: 0, netBalance: 10 },
        { userId: 'user2', userName: 'Bob', email: 'bob@example.com', totalOwed: 20, totalOwing: 0, netBalance: 20 },
        { userId: 'user3', userName: 'Charlie', email: 'charlie@example.com', totalOwed: 0, totalOwing: 30, netBalance: -30 },
      ]

      const userMap = new Map(mockUsers.map(user => [user.id, user]))
      const payments = BalanceCalculator.optimizePayments(userBalances, userMap)

      // Charlie should pay Bob $20 and Alice $10
      expect(payments).toHaveLength(2)
      
      const paymentToBob = payments.find(p => p.toUserId === 'user2')
      const paymentToAlice = payments.find(p => p.toUserId === 'user1')
      
      expect(paymentToBob?.amount).toBe(20)
      expect(paymentToAlice?.amount).toBe(10)
    })
  })

  describe('simulatePayment', () => {
    it('should update balances after payment simulation', () => {
      const groupBalances = {
        groupId: 'group1',
        groupName: 'Test Group',
        totalExpenses: 100,
        userBalances: [
          { userId: 'user1', userName: 'Alice', email: 'alice@example.com', totalOwed: 20, totalOwing: 0, netBalance: 20 },
          { userId: 'user2', userName: 'Bob', email: 'bob@example.com', totalOwed: 0, totalOwing: 20, netBalance: -20 },
        ],
        debtRelationships: [],
        optimizedPayments: [
          {
            fromUserId: 'user2',
            fromUserName: 'Bob',
            toUserId: 'user1',
            toUserName: 'Alice',
            amount: 20,
            currency: 'USD',
            description: 'Settlement payment',
          },
        ],
        isSettled: false,
      }

      const payment = groupBalances.optimizedPayments[0]
      const result = BalanceCalculator.simulatePayment(groupBalances, payment)

      expect(result.isSettled).toBe(true)
      expect(result.optimizedPayments).toHaveLength(0)
      
      const aliceBalance = result.userBalances.find(b => b.userId === 'user1')
      const bobBalance = result.userBalances.find(b => b.userId === 'user2')
      
      expect(aliceBalance?.netBalance).toBe(0)
      expect(bobBalance?.netBalance).toBe(0)
    })
  })
})
