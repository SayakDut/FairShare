'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Users, Calendar, DollarSign, Settings, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingState, EmptyState } from '@/components/ui/loading'
import { CreateGroupForm } from '@/components/forms/create-group-form'
import { JoinGroupForm } from '@/components/forms/join-group-form'
import { formatDate } from '@/lib/utils'

interface Group {
  id: string
  name: string
  description: string | null
  inviteCode: string
  createdAt: string
  members: Array<{
    id: string
    role: 'ADMIN' | 'MEMBER'
    user: {
      id: string
      fullName: string | null
      email: string
    }
  }>
  _count: {
    expenses: number
  }
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    fetchGroups()
  }, [])

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
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      toast.success('Invite code copied!')
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      toast.error('Failed to copy invite code')
    }
  }

  const handleGroupCreated = () => {
    fetchGroups()
  }

  const handleGroupJoined = () => {
    fetchGroups()
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <LoadingState>Loading your groups...</LoadingState>
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
                Groups
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage your expense groups and invite friends
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsJoinGroupOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Join Group
              </Button>
              <Button onClick={() => setIsCreateGroupOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </div>
          </div>

          {/* Groups Grid */}
          {groups.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6 text-gray-400" />}
              title="No groups yet"
              description="Create your first group or join an existing one to start splitting expenses."
              action={
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setIsJoinGroupOpen(true)}>
                    <Users className="mr-2 h-4 w-4" />
                    Join Group
                  </Button>
                  <Button onClick={() => setIsCreateGroupOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Group
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            <Link 
                              href={`/groups/${group.id}`}
                              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                              {group.name}
                            </Link>
                          </CardTitle>
                          {group.description && (
                            <CardDescription className="mt-1">
                              {group.description}
                            </CardDescription>
                          )}
                        </div>
                        <Link href={`/groups/${group.id}/settings`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {group.members.length}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Members
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {group._count.expenses}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Expenses
                            </div>
                          </div>
                        </div>

                        {/* Members */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Members
                            </span>
                            {group.members.some(m => m.role === 'ADMIN') && (
                              <Badge variant="secondary" className="text-xs">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="flex -space-x-2">
                            {group.members.slice(0, 4).map((member) => (
                              <div
                                key={member.id}
                                className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 border-2 border-white dark:border-gray-800 flex items-center justify-center"
                                title={member.user.fullName || member.user.email}
                              >
                                <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                  {(member.user.fullName || member.user.email).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            ))}
                            {group.members.length > 4 && (
                              <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  +{group.members.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Invite Code */}
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Invite Code
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyInviteCode(group.inviteCode)}
                              className="h-6 px-2"
                            >
                              {copiedCode === group.inviteCode ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {group.inviteCode}
                          </code>
                        </div>

                        {/* Created Date */}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Created {formatDate(group.createdAt)}
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

      {/* Modals */}
      <CreateGroupForm
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onSuccess={handleGroupCreated}
      />
      
      <JoinGroupForm
        isOpen={isJoinGroupOpen}
        onClose={() => setIsJoinGroupOpen(false)}
        onSuccess={handleGroupJoined}
      />
    </DashboardLayout>
  )
}
