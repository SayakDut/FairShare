import { OCRService } from '@/lib/ocr'

// Mock Tesseract
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn(() => ({
    recognize: jest.fn(),
    terminate: jest.fn(),
  })),
}))

describe('OCRService', () => {
  let ocrService: OCRService
  let mockWorker: any

  beforeEach(() => {
    ocrService = new OCRService()
    mockWorker = {
      recognize: jest.fn(),
      terminate: jest.fn(),
    }
    
    // Mock createWorker to return our mock worker
    const Tesseract = require('tesseract.js')
    Tesseract.createWorker.mockResolvedValue(mockWorker)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('processReceipt', () => {
    it('should extract items from receipt text', async () => {
      const mockReceiptText = `
        RESTAURANT ABC
        123 Main St
        
        Pizza Margherita    $12.99
        Caesar Salad        $8.50
        Coca Cola           $2.99
        
        Subtotal           $24.48
        Tax                $2.45
        Total              $26.93
        
        Thank you!
      `

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: mockReceiptText,
          confidence: 85,
        },
      })

      const result = await ocrService.processReceipt('mock-file')

      expect(result.text).toBe(mockReceiptText)
      expect(result.confidence).toBe(85)
      expect(result.items).toHaveLength(3)
      
      const pizzaItem = result.items.find(item => item.name.includes('Pizza'))
      expect(pizzaItem?.amount).toBe(12.99)
      
      const saladItem = result.items.find(item => item.name.includes('Salad'))
      expect(saladItem?.amount).toBe(8.50)
      
      const colaItem = result.items.find(item => item.name.includes('Cola'))
      expect(colaItem?.amount).toBe(2.99)
    })

    it('should extract total amount', async () => {
      const mockReceiptText = `
        GROCERY STORE
        
        Apples             $3.99
        Bread              $2.50
        Milk               $4.25
        
        Total              $10.74
      `

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: mockReceiptText,
          confidence: 90,
        },
      })

      const result = await ocrService.processReceipt('mock-file')

      expect(result.totalAmount).toBe(10.74)
    })

    it('should extract merchant name', async () => {
      const mockReceiptText = `
        PIZZA PALACE
        456 Oak Avenue
        
        Large Pepperoni    $15.99
        Garlic Bread       $4.99
        
        Total              $20.98
      `

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: mockReceiptText,
          confidence: 88,
        },
      })

      const result = await ocrService.processReceipt('mock-file')

      expect(result.merchantName).toBe('PIZZA PALACE')
    })

    it('should extract date', async () => {
      const mockReceiptText = `
        COFFEE SHOP
        
        Date: 12/25/2023
        Time: 14:30
        
        Latte              $4.50
        Muffin             $3.25
        
        Total              $7.75
      `

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: mockReceiptText,
          confidence: 92,
        },
      })

      const result = await ocrService.processReceipt('mock-file')

      expect(result.date).toBe('12/25/2023')
    })

    it('should categorize food items', async () => {
      const mockReceiptText = `
        RESTAURANT
        
        Chicken Burger     $12.99
        Vegetarian Pizza   $14.50
        Vegan Salad        $9.99
        
        Total              $37.48
      `

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: mockReceiptText,
          confidence: 87,
        },
      })

      const result = await ocrService.processReceipt('mock-file')

      expect(result.items).toHaveLength(3)
      
      result.items.forEach(item => {
        expect(item.category).toBe('food')
      })
    })

    it('should detect dietary preferences', async () => {
      const mockReceiptText = `
        HEALTHY EATS
        
        Vegan Burger       $13.99
        Gluten-Free Bread  $5.50
        Vegetarian Wrap    $8.99
        
        Total              $28.48
      `

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: mockReceiptText,
          confidence: 89,
        },
      })

      const result = await ocrService.processReceipt('mock-file')

      const veganItem = result.items.find(item => item.name.includes('Vegan'))
      expect(veganItem?.dietaryTags).toContain('vegan')
      
      const glutenFreeItem = result.items.find(item => item.name.includes('Gluten-Free'))
      expect(glutenFreeItem?.dietaryTags).toContain('gluten-free')
      
      const vegetarianItem = result.items.find(item => item.name.includes('Vegetarian'))
      expect(vegetarianItem?.dietaryTags).toContain('vegetarian')
    })

    it('should skip non-item lines', async () => {
      const mockReceiptText = `
        STORE NAME
        123 Address St
        Phone: 555-1234
        
        Item 1             $5.99
        Item 2             $3.50
        
        Subtotal           $9.49
        Tax                $0.95
        Total              $10.44
        
        Thank you for shopping!
        Visit us again soon
      `

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: mockReceiptText,
          confidence: 85,
        },
      })

      const result = await ocrService.processReceipt('mock-file')

      // Should only extract actual items, not headers, totals, or footers
      expect(result.items).toHaveLength(2)
      expect(result.items[0].name).toContain('Item 1')
      expect(result.items[1].name).toContain('Item 2')
    })

    it('should handle OCR errors gracefully', async () => {
      mockWorker.recognize.mockRejectedValue(new Error('OCR failed'))

      await expect(ocrService.processReceipt('mock-file')).rejects.toThrow('Failed to process receipt image')
    })

    it('should handle poor quality images', async () => {
      const mockReceiptText = `
        BLURRY TEXT
        ??? ??? ???
        Item ???            $?.??
        ??? ???             $?.??
        Total              $??.??
      `

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: mockReceiptText,
          confidence: 25, // Low confidence
        },
      })

      const result = await ocrService.processReceipt('mock-file')

      expect(result.confidence).toBe(25)
      expect(result.items).toHaveLength(0) // Should not extract items with unclear prices
    })
  })

  describe('initialize and terminate', () => {
    it('should initialize worker only once', async () => {
      await ocrService.initialize()
      await ocrService.initialize() // Second call

      const Tesseract = require('tesseract.js')
      expect(Tesseract.createWorker).toHaveBeenCalledTimes(1)
    })

    it('should terminate worker properly', async () => {
      await ocrService.initialize()
      await ocrService.terminate()

      expect(mockWorker.terminate).toHaveBeenCalledTimes(1)
    })
  })

  describe('price extraction', () => {
    it('should handle different price formats', async () => {
      const mockReceiptText = `
        Item 1             $12.99
        Item 2             15.50 $
        Item 3             €8,75
        Item 4             £5.25
      `

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: mockReceiptText,
          confidence: 85,
        },
      })

      const result = await ocrService.processReceipt('mock-file')

      expect(result.items).toHaveLength(4)
      expect(result.items[0].amount).toBe(12.99)
      expect(result.items[1].amount).toBe(15.50)
      // Note: European formats might need additional handling
    })

    it('should ignore unreasonable prices', async () => {
      const mockReceiptText = `
        Normal Item        $12.99
        Expensive Item     $9999.99
        Free Item          $0.00
        Negative Item      $-5.00
      `

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: mockReceiptText,
          confidence: 85,
        },
      })

      const result = await ocrService.processReceipt('mock-file')

      // Should only extract reasonable prices
      expect(result.items).toHaveLength(1)
      expect(result.items[0].amount).toBe(12.99)
    })
  })
})
