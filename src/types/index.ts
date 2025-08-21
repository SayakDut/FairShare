import { Database } from './database'

// Database types
export type User = Database['public']['Tables']['users']['Row']
export type Group = Database['public']['Tables']['groups']['Row']
export type GroupMember = Database['public']['Tables']['group_members']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseItem = Database['public']['Tables']['expense_items']['Row']
export type ExpenseSplit = Database['public']['Tables']['expense_splits']['Row']
export type Balance = Database['public']['Tables']['balances']['Row']

// Extended types with relations
export interface GroupWithMembers extends Group {
  group_members: (GroupMember & {
    users: User
  })[]
}

export interface ExpenseWithDetails extends Expense {
  expense_items: ExpenseItem[]
  expense_splits: (ExpenseSplit & {
    users: User
  })[]
  users: User // creator
}

export interface UserBalance {
  user: User
  amount: number
  currency: string
}

export interface GroupBalance {
  group: Group
  balances: {
    owes: UserBalance[]
    owed: UserBalance[]
    netBalance: number
  }
}

// Form types
export interface CreateGroupForm {
  name: string
  description?: string
}

export interface CreateExpenseForm {
  title: string
  description?: string
  totalAmount: number
  currency: string
  splitType: 'equal' | 'percentage' | 'custom'
  items?: ExpenseItemForm[]
  splits?: ExpenseSplitForm[]
}

export interface ExpenseItemForm {
  name: string
  amount: number
  category?: string
  dietaryTags?: string[]
}

export interface ExpenseSplitForm {
  userId: string
  amount?: number
  percentage?: number
}

export interface UserProfileForm {
  fullName: string
  dietaryPreferences: string[]
}

// OCR types
export interface OCRResult {
  text: string
  confidence: number
  items: OCRItem[]
}

export interface OCRItem {
  name: string
  amount: number
  confidence: number
  category?: string
  dietaryTags?: string[]
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Utility types
export type SplitType = 'equal' | 'percentage' | 'custom'
export type GroupRole = 'admin' | 'member'
export type DietaryPreference = 'vegetarian' | 'vegan' | 'halal' | 'kosher' | 'gluten-free' | 'dairy-free'

// Theme types
export type Theme = 'light' | 'dark'

// Navigation types
export interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
}

// Real-time types
export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
  schema: string
  table: string
}

export interface SubscriptionConfig {
  table: string
  filter?: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
}
