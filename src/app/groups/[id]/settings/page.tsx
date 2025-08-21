'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  UserPlus, 
  UserMinus, 
  Crown,
  Trash2,
  Settings
} from 'lucide-react'
import toast from 'react-hot-toast'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { LoadingState, ErrorState } from '@/components/ui/loading'
import { ConfirmModal } from '@/components/ui/modal'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown'

interface GroupMember {
  id: string
  role: 'ADMIN' | 'MEMBER'
  joinedAt: string
  user: {
    id: string
    fullName: string | null
    email: string
  }
}

interface Group {
  id: string
  name: string
  description: string | null
  inviteCode: string
  createdAt: string
  createdBy: string
  members: GroupMember[]
}

export default function GroupSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string
  
  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    if (groupId) {
      fetchGroup()
    }
  }, [groupId])

  const fetchGroup = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/groups/${groupId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Group not found')
        } else if (response.status === 403) {
          throw new Error('Access denied')
        }
        throw new Error('Failed to fetch group')
      }
      
      const result = await response.json()
      setGroup(result.data)
      setFormData({
        name: result.data.name,
        description: result.data.description || '',
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load group')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyInviteCode = async () => {
    if (!group) return
    
    try {
      await navigator.clipboard.writeText(group.inviteCode)
      setCopiedCode(true)
      toast.success('Invite code copied!')
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (error) {
      toast.error('Failed to copy invite code')
    }
  }

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!group) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update group')
      }

      const result = await response.json()
      setGroup(result.data)
      toast.success('Group updated successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update group')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!group) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete group')
      }

      toast.success('Group deleted successfully!')
      router.push('/groups')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete group')
      setIsDeleting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members?userId=${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove member')
      }

      toast.success('Member removed successfully!')
      fetchGroup() // Refresh the group data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member')
    }
  }

  const handleUpdateMemberRole = async (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: memberId,
          role: newRole,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update member role')
      }

      toast.success('Member role updated successfully!')
      fetchGroup() // Refresh the group data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update member role')
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <LoadingState>Loading group settings...</LoadingState>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !group) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
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

  const currentUserMember = group.members.find(m => m.user.id === group.createdBy) // This should be from auth context
  const isAdmin = currentUserMember?.role === 'ADMIN'

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Link href={`/groups/${group.id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Group Settings
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage {group.name} settings and members
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Group Information */}
            <Card>
              <CardHeader>
                <CardTitle>Group Information</CardTitle>
                <CardDescription>
                  Update your group name and description
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateGroup} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Group Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isAdmin}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={!isAdmin}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  {isAdmin && (
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? 'Updating...' : 'Update Group'}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Invite Code */}
            <Card>
              <CardHeader>
                <CardTitle>Invite Code</CardTitle>
                <CardDescription>
                  Share this code with others to invite them to the group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <code className="flex-1 text-lg font-mono bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
                    {group.inviteCode}
                  </code>
                  <Button onClick={handleCopyInviteCode} variant="outline">
                    {copiedCode ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Members */}
            <Card>
              <CardHeader>
                <CardTitle>Members ({group.members.length})</CardTitle>
                <CardDescription>
                  Manage group members and their permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {group.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                            {(member.user.fullName || member.user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.user.fullName || member.user.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {member.user.email}
                          </p>
                        </div>
                        {member.role === 'ADMIN' && (
                          <Badge variant="secondary">
                            <Crown className="mr-1 h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      
                      {isAdmin && member.user.id !== group.createdBy && (
                        <Dropdown
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          }
                        >
                          {member.role === 'MEMBER' ? (
                            <DropdownItem
                              icon={<Crown className="h-4 w-4" />}
                              onClick={() => handleUpdateMemberRole(member.user.id, 'ADMIN')}
                            >
                              Make Admin
                            </DropdownItem>
                          ) : (
                            <DropdownItem
                              icon={<UserMinus className="h-4 w-4" />}
                              onClick={() => handleUpdateMemberRole(member.user.id, 'MEMBER')}
                            >
                              Remove Admin
                            </DropdownItem>
                          )}
                          <DropdownSeparator />
                          <DropdownItem
                            icon={<UserMinus className="h-4 w-4" />}
                            onClick={() => handleRemoveMember(member.user.id)}
                            destructive
                          >
                            Remove Member
                          </DropdownItem>
                        </Dropdown>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            {isAdmin && (
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Group
                  </Button>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    This will permanently delete the group and all associated expenses. This action cannot be undone.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteGroup}
        title="Delete Group"
        description={`Are you sure you want to delete "${group.name}"? This action cannot be undone and will permanently delete all expenses and data associated with this group.`}
        confirmText="Delete Group"
        variant="destructive"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  )
}
