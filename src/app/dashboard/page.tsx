'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateGroupForm } from '@/components/forms/create-group-form'
import { JoinGroupForm } from '@/components/forms/join-group-form'
import { ReceiptScanner } from '@/components/receipt/receipt-scanner'
import { ActivityFeed } from '@/components/realtime/activity-feed'
import { ConnectionStatus } from '@/components/realtime/connection-status'
import { Plus, Users, Receipt, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

export default function DashboardPage() {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false)
  const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState(false)
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage your expenses and groups
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total Groups
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        0
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Receipt className="h-8 w-8 text-success-600 dark:text-success-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total Expenses
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        0
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-8 w-8 text-warning-600 dark:text-warning-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        You Owe
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        $0.00
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
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
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        $0.00
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4">
                    <Plus className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <CardTitle className="text-lg">Create Group</CardTitle>
                  <CardDescription>
                    Start a new group to split expenses with friends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => setIsCreateGroupOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Group
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <CardTitle className="text-lg">Join Group</CardTitle>
                  <CardDescription>
                    Use an invite code to join an existing group
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => setIsJoinGroupOpen(true)}>
                    <Users className="mr-2 h-4 w-4" />
                    Join Group
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-success-100 dark:bg-success-900 flex items-center justify-center mb-4">
                    <Receipt className="h-6 w-6 text-success-600 dark:text-success-400" />
                  </div>
                  <CardTitle className="text-lg">Scan Receipt</CardTitle>
                  <CardDescription>
                    Upload a receipt and let AI extract the items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => setIsReceiptScannerOpen(true)}>
                    <Receipt className="mr-2 h-4 w-4" />
                    Scan Receipt
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <ActivityFeed maxItems={5} />
          </motion.div>
        </motion.div>
      </div>

      {/* Modals */}
      <CreateGroupForm
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onSuccess={() => {
          // Refresh data or navigate to group
        }}
      />

      <JoinGroupForm
        isOpen={isJoinGroupOpen}
        onClose={() => setIsJoinGroupOpen(false)}
        onSuccess={() => {
          // Refresh data or navigate to group
        }}
      />

      <ReceiptScanner
        isOpen={isReceiptScannerOpen}
        onClose={() => setIsReceiptScannerOpen(false)}
        onExpenseExtracted={(expenseData) => {
          // Handle the extracted expense data
          console.log('Extracted expense data:', expenseData)
          // You could redirect to create expense form with pre-filled data
        }}
      />
    </DashboardLayout>
  )
}
