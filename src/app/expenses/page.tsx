'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Receipt, Calendar, DollarSign, Users, Filter, Search } from 'lucide-react'
import toast from 'react-hot-toast'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingState, EmptyState } from '@/components/ui/loading'
import { CreateExpenseForm } from '@/components/forms/create-expense-form'
import { Select } from '@/components/ui/dropdown'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Group {
  id: string
  name: string
  members: Array<{
    id: string
    user: {
      id: string
      fullName: string | null
      email: string
    }
  }>
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
  group: {
    id: string
    name: string
  }
  creator: {
    id: string
    fullName: string | null
    email: string
  }
  items: Array<{
    id: string
    name: string
    amount: number
    category: string | null
    dietaryTags: string[]
  }>
  splits: Array<{
    id: string
    amount: number
    user: {
      id: string
      fullName: string | null
      email: string
    }
  }>
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateExpenseOpen, setIsCreateExpenseOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  useEffect(() => {
    Promise.all([fetchExpenses(), fetchGroups()])
  }, [])

  const fetchExpenses = async () => {
    try {
      // For now, we'll fetch expenses from all groups
      // In a real implementation, you might have a dedicated expenses endpoint
      const groupsResponse = await fetch('/api/groups')
      if (!groupsResponse.ok) {
        throw new Error('Failed to fetch groups')
      }
      const groupsResult = await groupsResponse.json()
      
      // Extract all expenses from all groups
      const allExpenses: Expense[] = []
      for (const group of groupsResult.data) {
        if (group.expenses) {
          allExpenses.push(...group.expenses.map((expense: any) => ({
            ...expense,
            group: {
              id: group.id,
              name: group.name,
            }
          })))
        }
      }
      
      // Sort by creation date (newest first)
      allExpenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setExpenses(allExpenses)
    } catch (error) {
      toast.error('Failed to load expenses')
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

  const handleExpenseCreated = () => {
    fetchExpenses()
  }

  // Filter expenses based on search and filters
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.creator.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.creator.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesGroup = !selectedGroup || expense.group.id === selectedGroup
    
    const matchesCategory = !selectedCategory || 
                           expense.items.some(item => item.category === selectedCategory)
    
    return matchesSearch && matchesGroup && matchesCategory
  })

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + Number(expense.totalAmount), 0)

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <LoadingState>Loading your expenses...</LoadingState>
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
                Expenses
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Track and manage all your shared expenses
              </p>
            </div>
            <Button onClick={() => setIsCreateExpenseOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Receipt className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Expenses
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {filteredExpenses.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-success-600 dark:text-success-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Amount
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(totalExpenses)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-warning-600 dark:text-warning-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Active Groups
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {groups.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="mr-2 h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Input
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
                
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
                
                <Select
                  options={[
                    { value: '', label: 'All Categories' },
                    { value: 'food', label: 'Food & Dining' },
                    { value: 'transportation', label: 'Transportation' },
                    { value: 'accommodation', label: 'Accommodation' },
                    { value: 'entertainment', label: 'Entertainment' },
                    { value: 'shopping', label: 'Shopping' },
                    { value: 'utilities', label: 'Utilities' },
                    { value: 'other', label: 'Other' },
                  ]}
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  placeholder="Filter by category"
                />
              </div>
            </CardContent>
          </Card>

          {/* Expenses List */}
          {filteredExpenses.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-6 w-6 text-gray-400" />}
              title={expenses.length === 0 ? "No expenses yet" : "No expenses match your filters"}
              description={expenses.length === 0 ? "Create your first expense to start tracking shared costs." : "Try adjusting your search or filter criteria."}
              action={
                <Button onClick={() => setIsCreateExpenseOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              <Link 
                                href={`/expenses/${expense.id}`}
                                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                              >
                                {expense.title}
                              </Link>
                            </h3>
                            <Badge variant="outline">
                              {expense.group.name}
                            </Badge>
                            {expense.receiptUrl && (
                              <Badge variant="secondary">
                                <Receipt className="mr-1 h-3 w-3" />
                                Receipt
                              </Badge>
                            )}
                          </div>
                          
                          {expense.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {expense.description}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <Calendar className="mr-1 h-4 w-4" />
                              {formatDate(expense.createdAt)}
                            </span>
                            <span>
                              Added by {expense.creator.fullName || expense.creator.email}
                            </span>
                            <span>
                              Split among {expense.splits.length} members
                            </span>
                          </div>
                          
                          {expense.items.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {expense.items.slice(0, 3).map((item) => (
                                <Badge key={item.id} variant="outline" className="text-xs">
                                  {item.name}: {formatCurrency(Number(item.amount))}
                                </Badge>
                              ))}
                              {expense.items.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{expense.items.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(Number(expense.totalAmount), expense.currency)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {expense.splitType.toLowerCase()} split
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Expense Modal */}
      <CreateExpenseForm
        isOpen={isCreateExpenseOpen}
        onClose={() => setIsCreateExpenseOpen(false)}
        onSuccess={handleExpenseCreated}
        groups={groups}
      />
    </DashboardLayout>
  )
}
