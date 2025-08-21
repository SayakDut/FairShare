'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, Minus, Upload, Scan } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/dropdown'
import { Modal } from '@/components/ui/modal'
import { FileUpload } from '@/components/ui/file-upload'
import { Badge } from '@/components/ui/badge'
import { ReceiptScanner } from '@/components/receipt/receipt-scanner'

const expenseItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().optional(),
  dietaryTags: z.array(z.string()).optional(),
})

const createExpenseSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  totalAmount: z.number().positive('Total amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  splitType: z.enum(['EQUAL', 'PERCENTAGE', 'CUSTOM']).optional(),
  items: z.array(expenseItemSchema).optional(),
})

type CreateExpenseForm = z.infer<typeof createExpenseSchema>

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

interface CreateExpenseFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (expense: any) => void
  groups: Group[]
  selectedGroupId?: string
}

const dietaryOptions = [
  'vegetarian',
  'vegan', 
  'halal',
  'kosher',
  'gluten-free',
  'dairy-free',
  'nut-free',
]

const categoryOptions = [
  { value: 'food', label: 'Food & Dining' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
]

export function CreateExpenseForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  groups, 
  selectedGroupId 
}: CreateExpenseFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)
  const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    control,
  } = useForm<CreateExpenseForm>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      groupId: selectedGroupId || '',
      currency: 'USD',
      splitType: 'EQUAL',
      items: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const watchedGroupId = watch('groupId')
  const watchedItems = watch('items')

  // Calculate total from items
  useEffect(() => {
    if (watchedItems && watchedItems.length > 0) {
      const total = watchedItems.reduce((sum, item) => sum + (item.amount || 0), 0)
      setValue('totalAmount', total)
    }
  }, [watchedItems, setValue])

  const handleFileSelect = async (file: File) => {
    setReceiptFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setReceiptPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploadingReceipt(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/receipt', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload receipt')
      }

      const result = await response.json()
      // You could set the receipt URL here for the expense
      toast.success('Receipt uploaded successfully!')
    } catch (error) {
      toast.error('Failed to upload receipt')
    } finally {
      setIsUploadingReceipt(false)
    }
  }

  const handleFileRemove = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
  }

  const onSubmit = async (data: CreateExpenseForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create expense')
      }

      const result = await response.json()
      toast.success('Expense created successfully!')
      reset()
      setReceiptFile(null)
      setReceiptPreview(null)
      onClose()
      onSuccess?.(result.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create expense')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setReceiptFile(null)
    setReceiptPreview(null)
    onClose()
  }

  const addExpenseItem = () => {
    append({
      name: '',
      amount: 0,
      category: '',
      dietaryTags: [],
    })
  }

  const handleReceiptScanned = (expenseData: {
    title: string
    totalAmount: number
    items: Array<{
      name: string
      amount: number
      category?: string
      dietaryTags?: string[]
    }>
    receiptUrl?: string
  }) => {
    // Pre-fill form with scanned data
    setValue('title', expenseData.title)
    setValue('totalAmount', expenseData.totalAmount)

    // Clear existing items and add scanned items
    while (fields.length > 0) {
      remove(0)
    }

    expenseData.items.forEach(item => {
      append({
        name: item.name,
        amount: item.amount,
        category: item.category || '',
        dietaryTags: item.dietaryTags || [],
      })
    })

    toast.success('Receipt data imported successfully!')
  }

  const selectedGroup = groups.find(g => g.id === watchedGroupId)

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Expense"
      description="Add a new expense to split with your group."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="groupId">Group *</Label>
            <Select
              options={groups.map(group => ({
                value: group.id,
                label: group.name,
              }))}
              value={watchedGroupId}
              onValueChange={(value) => setValue('groupId', value)}
              placeholder="Select a group"
              className="mt-1"
            />
            {errors.groupId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.groupId.message}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="title">Expense Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Dinner at Restaurant, Grocery Shopping"
              {...register('title')}
              className="mt-1"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="totalAmount">Total Amount *</Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('totalAmount', { valueAsNumber: true })}
              className="mt-1"
            />
            {errors.totalAmount && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.totalAmount.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              options={[
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'INR', label: 'INR (₹)' },
              ]}
              value={watch('currency') || 'USD'}
              onValueChange={(value) => setValue('currency', value)}
              className="mt-1"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any additional details..."
              rows={2}
              {...register('description')}
              className="mt-1"
            />
          </div>
        </div>

        {/* Receipt Upload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Receipt (Optional)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReceiptScannerOpen(true)}
            >
              <Scan className="mr-2 h-4 w-4" />
              Scan Receipt
            </Button>
          </div>
          <div className="mt-1">
            <FileUpload
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              file={receiptFile}
              preview={receiptPreview}
              accept="image/*"
              disabled={isUploadingReceipt}
            />
          </div>
        </div>

        {/* Expense Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label>Expense Items (Optional)</Label>
            <Button type="button" variant="outline" size="sm" onClick={addExpenseItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
          
          {fields.length > 0 && (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Item {index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`items.${index}.name`}>Item Name</Label>
                      <Input
                        {...register(`items.${index}.name`)}
                        placeholder="e.g., Pizza, Drinks"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`items.${index}.amount`}>Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.amount`, { valueAsNumber: true })}
                        placeholder="0.00"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`items.${index}.category`}>Category</Label>
                      <Select
                        options={categoryOptions}
                        value={watch(`items.${index}.category`) || ''}
                        onValueChange={(value) => setValue(`items.${index}.category`, value)}
                        placeholder="Select category"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>Dietary Tags</Label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {dietaryOptions.map((tag) => {
                          const currentTags = watch(`items.${index}.dietaryTags`) || []
                          const isSelected = currentTags.includes(tag)
                          
                          return (
                            <Badge
                              key={tag}
                              variant={isSelected ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => {
                                const newTags = isSelected
                                  ? currentTags.filter(t => t !== tag)
                                  : [...currentTags, tag]
                                setValue(`items.${index}.dietaryTags`, newTags)
                              }}
                            >
                              {tag}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Split Information */}
        {selectedGroup && (
          <div>
            <Label>Split Type</Label>
            <Select
              options={[
                { value: 'EQUAL', label: 'Split Equally' },
                { value: 'PERCENTAGE', label: 'Split by Percentage' },
                { value: 'CUSTOM', label: 'Custom Split' },
              ]}
              value={watch('splitType') || 'EQUAL'}
              onValueChange={(value) => setValue('splitType', value as 'EQUAL' | 'PERCENTAGE' | 'CUSTOM')}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This expense will be split among {selectedGroup.members.length} group members
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !watchedGroupId}>
            {isLoading ? (
              <div className="flex items-center">
                <div className="spinner mr-2" />
                Creating...
              </div>
            ) : (
              'Create Expense'
            )}
          </Button>
        </div>
      </form>

      {/* Receipt Scanner Modal */}
      <ReceiptScanner
        isOpen={isReceiptScannerOpen}
        onClose={() => setIsReceiptScannerOpen(false)}
        onExpenseExtracted={handleReceiptScanned}
      />
    </Modal>
  )
}
