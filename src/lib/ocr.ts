import Tesseract from 'tesseract.js'

export interface OCRItem {
  name: string
  amount: number
  confidence: number
  category?: string
  dietaryTags?: string[]
}

export interface OCRResult {
  text: string
  confidence: number
  items: OCRItem[]
  totalAmount?: number
  merchantName?: string
  date?: string
}

// Common food keywords for categorization
const FOOD_KEYWORDS = [
  'pizza', 'burger', 'sandwich', 'salad', 'soup', 'pasta', 'rice', 'chicken', 'beef', 'fish',
  'coffee', 'tea', 'juice', 'soda', 'water', 'beer', 'wine', 'cocktail', 'dessert', 'cake',
  'bread', 'cheese', 'milk', 'eggs', 'fruit', 'vegetable', 'snack', 'chips', 'cookie'
]

// Dietary preference keywords
const DIETARY_KEYWORDS = {
  vegetarian: ['vegetarian', 'veggie', 'veg', 'plant-based'],
  vegan: ['vegan', 'plant-based', 'dairy-free'],
  'gluten-free': ['gluten-free', 'gf', 'celiac'],
  'dairy-free': ['dairy-free', 'lactose-free', 'non-dairy'],
  halal: ['halal'],
  kosher: ['kosher'],
  'nut-free': ['nut-free', 'no nuts', 'allergy-friendly']
}

// Price pattern regex
const PRICE_PATTERNS = [
  /\$(\d+\.?\d*)/g,           // $12.99, $12
  /(\d+\.?\d*)\s*\$/g,        // 12.99 $, 12 $
  /(\d+\.\d{2})/g,            // 12.99 (assuming currency)
  /(\d+),(\d{2})/g,           // European format 12,99
]

// Total patterns
const TOTAL_PATTERNS = [
  /total[:\s]*\$?(\d+\.?\d*)/i,
  /subtotal[:\s]*\$?(\d+\.?\d*)/i,
  /amount[:\s]*\$?(\d+\.?\d*)/i,
  /sum[:\s]*\$?(\d+\.?\d*)/i,
]

// Merchant name patterns
const MERCHANT_PATTERNS = [
  /^([A-Z][A-Za-z\s&]+)$/m,   // Capitalized business names
  /restaurant[:\s]*([A-Za-z\s]+)/i,
  /cafe[:\s]*([A-Za-z\s]+)/i,
  /store[:\s]*([A-Za-z\s]+)/i,
]

// Date patterns
const DATE_PATTERNS = [
  /(\d{1,2}\/\d{1,2}\/\d{2,4})/,     // MM/DD/YYYY or MM/DD/YY
  /(\d{1,2}-\d{1,2}-\d{2,4})/,       // MM-DD-YYYY or MM-DD-YY
  /(\d{4}-\d{1,2}-\d{1,2})/,         // YYYY-MM-DD
  /(\w{3}\s+\d{1,2},?\s+\d{4})/,     // Jan 15, 2024
]

export class OCRService {
  private worker: Tesseract.Worker | null = null

  async initialize(): Promise<void> {
    if (this.worker) return

    this.worker = await Tesseract.createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
        }
      }
    })
  }

  async processReceipt(imageFile: File | string): Promise<OCRResult> {
    await this.initialize()
    
    if (!this.worker) {
      throw new Error('OCR worker not initialized')
    }

    try {
      const { data } = await this.worker.recognize(imageFile)
      const text = data.text
      const confidence = data.confidence

      // Extract structured data from the text
      const items = this.extractItems(text)
      const totalAmount = this.extractTotal(text)
      const merchantName = this.extractMerchantName(text)
      const date = this.extractDate(text)

      return {
        text,
        confidence,
        items,
        totalAmount,
        merchantName,
        date,
      }
    } catch (error) {
      console.error('OCR processing error:', error)
      throw new Error('Failed to process receipt image')
    }
  }

  private extractItems(text: string): OCRItem[] {
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    const items: OCRItem[] = []

    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Skip lines that are likely headers, totals, or metadata
      if (this.isSkippableLine(trimmedLine)) {
        continue
      }

      // Try to extract price from the line
      const price = this.extractPriceFromLine(trimmedLine)
      if (price > 0) {
        const itemName = this.extractItemName(trimmedLine, price)
        if (itemName && itemName.length > 1) {
          const category = this.categorizeItem(itemName)
          const dietaryTags = this.extractDietaryTags(itemName)
          
          items.push({
            name: itemName,
            amount: price,
            confidence: 0.8, // Base confidence, could be improved with ML
            category,
            dietaryTags,
          })
        }
      }
    }

    return items
  }

  private isSkippableLine(line: string): boolean {
    const skipPatterns = [
      /^(total|subtotal|tax|tip|discount|change)/i,
      /^(thank you|receipt|invoice|bill)/i,
      /^(date|time|server|table)/i,
      /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // Date lines
      /^\d{1,2}:\d{2}/, // Time lines
      /^[*\-=]{3,}/, // Separator lines
      /^(cash|card|credit|debit)/i,
      /^(address|phone|website)/i,
    ]

    return skipPatterns.some(pattern => pattern.test(line))
  }

  private extractPriceFromLine(line: string): number {
    for (const pattern of PRICE_PATTERNS) {
      const matches = Array.from(line.matchAll(pattern))
      if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1] // Take the last price on the line
        const priceStr = lastMatch[1] || lastMatch[0].replace(/[$,]/g, '')
        const price = parseFloat(priceStr)
        if (!isNaN(price) && price > 0 && price < 1000) { // Reasonable price range
          return price
        }
      }
    }
    return 0
  }

  private extractItemName(line: string, price: number): string {
    // Remove the price and common suffixes/prefixes
    let itemName = line
      .replace(/\$?\d+\.?\d*/g, '') // Remove all numbers/prices
      .replace(/[*\-=]+/g, '') // Remove separators
      .replace(/^\d+\s*/, '') // Remove leading numbers (quantity)
      .replace(/\s*x\s*\d+/i, '') // Remove quantity indicators like "x 2"
      .trim()

    // Clean up common receipt artifacts
    itemName = itemName
      .replace(/^[^\w]+/, '') // Remove leading non-word characters
      .replace(/[^\w\s]+$/, '') // Remove trailing non-word characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    return itemName
  }

  private categorizeItem(itemName: string): string {
    const lowerName = itemName.toLowerCase()
    
    if (FOOD_KEYWORDS.some(keyword => lowerName.includes(keyword))) {
      return 'food'
    }
    
    // Add more categorization logic here
    return 'other'
  }

  private extractDietaryTags(itemName: string): string[] {
    const lowerName = itemName.toLowerCase()
    const tags: string[] = []

    for (const [tag, keywords] of Object.entries(DIETARY_KEYWORDS)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        tags.push(tag)
      }
    }

    return tags
  }

  private extractTotal(text: string): number | undefined {
    for (const pattern of TOTAL_PATTERNS) {
      const match = text.match(pattern)
      if (match) {
        const amount = parseFloat(match[1])
        if (!isNaN(amount)) {
          return amount
        }
      }
    }
    return undefined
  }

  private extractMerchantName(text: string): string | undefined {
    const lines = text.split('\n').slice(0, 5) // Check first 5 lines
    
    for (const pattern of MERCHANT_PATTERNS) {
      for (const line of lines) {
        const match = line.match(pattern)
        if (match) {
          return match[1]?.trim()
        }
      }
    }
    
    // Fallback: return the first non-empty line that looks like a business name
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.length > 3 && trimmed.length < 50 && /^[A-Za-z\s&]+$/.test(trimmed)) {
        return trimmed
      }
    }
    
    return undefined
  }

  private extractDate(text: string): string | undefined {
    for (const pattern of DATE_PATTERNS) {
      const match = text.match(pattern)
      if (match) {
        return match[1]
      }
    }
    return undefined
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
    }
  }
}

// Singleton instance
let ocrService: OCRService | null = null

export const getOCRService = (): OCRService => {
  if (!ocrService) {
    ocrService = new OCRService()
  }
  return ocrService
}
