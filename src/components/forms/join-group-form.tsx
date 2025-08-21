'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'

const joinGroupSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required').length(8, 'Invite code must be 8 characters'),
})

type JoinGroupForm = z.infer<typeof joinGroupSchema>

interface JoinGroupFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (group: any) => void
}

export function JoinGroupForm({ isOpen, onClose, onSuccess }: JoinGroupFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<JoinGroupForm>({
    resolver: zodResolver(joinGroupSchema),
  })

  const inviteCode = watch('inviteCode')

  const onSubmit = async (data: JoinGroupForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to join group')
      }

      const result = await response.json()
      toast.success(result.message || 'Successfully joined group!')
      reset()
      onClose()
      onSuccess?.(result.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join group')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const formatInviteCode = (value: string) => {
    // Convert to uppercase and limit to 8 characters
    return value.toUpperCase().slice(0, 8)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Join Group"
      description="Enter the invite code to join an existing group."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="inviteCode">Invite Code *</Label>
          <Input
            id="inviteCode"
            placeholder="Enter 8-character code"
            {...register('inviteCode', {
              onChange: (e) => {
                e.target.value = formatInviteCode(e.target.value)
              }
            })}
            className="mt-1 font-mono text-center text-lg tracking-widest"
            maxLength={8}
          />
          {errors.inviteCode && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.inviteCode.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Ask a group member for the invite code
          </p>
        </div>

        {inviteCode && inviteCode.length === 8 && (
          <div className="p-4 bg-primary-50 dark:bg-primary-950 rounded-lg">
            <p className="text-sm text-primary-700 dark:text-primary-300">
              Ready to join with code: <span className="font-mono font-bold">{inviteCode}</span>
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !inviteCode || inviteCode.length !== 8}>
            {isLoading ? (
              <div className="flex items-center">
                <div className="spinner mr-2" />
                Joining...
              </div>
            ) : (
              'Join Group'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
