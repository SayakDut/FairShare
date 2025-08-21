'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Scan, Check, X, Edit, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/ui/file-upload'
import { Modal } from '@/components/ui/modal'
import { OCRResult, OCRItem } from '@/lib/ocr'
import { formatCurrency } from '@/lib/utils'

interface ReceiptScannerProps {
  isOpen: boolean
  onClose: () => void
  onExpenseExtracted: (expenseData: {
    title: string
    totalAmount: number
    items: Array<{
      name: string
      amount: number
      category?: string
      dietaryTags?: string[]
    }>
    receiptUrl?: string
  }) => void
}

export function ReceiptScanner({ isOpen, onClose, onExpenseExtracted }: ReceiptScannerProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [editableItems, setEditableItems] = useState<OCRItem[]>([])
  const [expenseTitle, setExpenseTitle] = useState('')
  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload')

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleFileRemove = () => {
    setFile(null)
    setPreview(null)
    setOcrResult(null)
    setEditableItems([])
    setStep('upload')
  }

  const processReceipt = async () => {
    if (!file) return

    setIsProcessing(true)
    setStep('processing')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/ocr/process', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process receipt')
      }

      const result = await response.json()
      const ocrData: OCRResult = result.data

      setOcrResult(ocrData)
      setEditableItems([...ocrData.items])
      setExpenseTitle(ocrData.merchantName || 'Receipt Expense')
      setStep('review')
      
      toast.success('Receipt processed successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process receipt')
      setStep('upload')
    } finally {
      setIsProcessing(false)
    }
  }

  const updateItem = (index: number, field: keyof OCRItem, value: any) => {
    const updatedItems = [...editableItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setEditableItems(updatedItems)
  }

  const removeItem = (index: number) => {
    const updatedItems = editableItems.filter((_, i) => i !== index)
    setEditableItems(updatedItems)
  }

  const addItem = () => {
    setEditableItems([
      ...editableItems,
      {
        name: '',
        amount: 0,
        confidence: 1,
        category: 'other',
        dietaryTags: [],
      },
    ])
  }

  const calculateTotal = () => {
    return editableItems.reduce((sum, item) => sum + item.amount, 0)
  }

  const handleCreateExpense = () => {
    const total = calculateTotal()
    
    if (!expenseTitle.trim()) {
      toast.error('Please enter an expense title')
      return
    }

    if (editableItems.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    if (total <= 0) {
      toast.error('Total amount must be greater than 0')
      return
    }

    // Upload receipt and get URL (simplified - in real app you'd upload to storage)
    const receiptUrl = preview || undefined

    onExpenseExtracted({
      title: expenseTitle,
      totalAmount: total,
      items: editableItems.map(item => ({
        name: item.name,
        amount: item.amount,
        category: item.category,
        dietaryTags: item.dietaryTags,
      })),
      receiptUrl,
    })

    handleClose()
  }

  const handleClose = () => {
    setFile(null)
    setPreview(null)
    setOcrResult(null)
    setEditableItems([])
    setExpenseTitle('')
    setStep('upload')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Scan Receipt"
      description="Upload a receipt image to automatically extract expense items."
      size="xl"
    >
      <div className="space-y-6">
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FileUpload
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              file={file}
              preview={preview}
              accept="image/*"
            />
            
            {file && (
              <div className="mt-6 flex justify-end">
                <Button onClick={processReceipt} disabled={isProcessing}>
                  <Scan className="mr-2 h-4 w-4" />
                  Scan Receipt
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Processing */}
        {step === 'processing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Processing Receipt
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Extracting items and amounts from your receipt...
            </p>
          </motion.div>
        )}

        {/* Step 3: Review and Edit */}
        {step === 'review' && ocrResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Expense Title */}
            <div>
              <Label htmlFor="expenseTitle">Expense Title</Label>
              <Input
                id="expenseTitle"
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                placeholder="Enter expense title"
                className="mt-1"
              />
            </div>

            {/* OCR Confidence */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                OCR Confidence: {Math.round(ocrResult.confidence)}%
              </span>
              {ocrResult.merchantName && (
                <Badge variant="outline">
                  {ocrResult.merchantName}
                </Badge>
              )}
            </div>

            {/* Extracted Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Extracted Items</Label>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Edit className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {editableItems.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                          <Label htmlFor={`item-name-${index}`}>Item Name</Label>
                          <Input
                            id={`item-name-${index}`}
                            value={item.name}
                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                            placeholder="Item name"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`item-amount-${index}`}>Amount</Label>
                          <div className="flex mt-1">
                            <Input
                              id={`item-amount-${index}`}
                              type="number"
                              step="0.01"
                              value={item.amount}
                              onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              className="ml-2"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Dietary Tags */}
                      {item.dietaryTags && item.dietaryTags.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-2">
                            {item.dietaryTags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Confidence indicator */}
                      <div className="mt-2 flex items-center">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${item.confidence * 100}%` }}
                          />
                        </div>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-950 rounded-lg">
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                Total Amount:
              </span>
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {formatCurrency(calculateTotal())}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreateExpense}>
                <Check className="mr-2 h-4 w-4" />
                Create Expense
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Modal>
  )
}
