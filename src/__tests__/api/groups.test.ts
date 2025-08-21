import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/groups/route'

// Mock dependencies
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/database', () => ({
  groupService: {
    getUserGroups: jest.fn(),
    create: jest.fn(),
  },
}))

jest.mock('@/lib/utils', () => ({
  generateInviteCode: jest.fn(() => 'ABCD1234'),
}))

describe('/api/groups', () => {
  let mockSupabase: any
  let mockGroupService: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
    }

    mockGroupService = {
      getUserGroups: jest.fn(),
      create: jest.fn(),
    }

    const { createServerSupabaseClient } = require('@/lib/supabase-server')
    const { groupService } = require('@/lib/database')

    createServerSupabaseClient.mockResolvedValue(mockSupabase)
    Object.assign(groupService, mockGroupService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/groups', () => {
    it('should return user groups when authenticated', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      const mockGroups = [
        {
          id: 'group1',
          name: 'Test Group',
          description: 'A test group',
          members: [],
          expenses: [],
        },
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      mockGroupService.getUserGroups.mockResolvedValue(mockGroups)

      const request = new NextRequest('http://localhost:3000/api/groups')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockGroups)
      expect(mockGroupService.getUserGroups).toHaveBeenCalledWith(mockUser.id)
    })

    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost:3000/api/groups')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle database errors', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      mockGroupService.getUserGroups.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/groups')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('POST /api/groups', () => {
    it('should create a new group with valid data', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      const mockGroupData = {
        name: 'New Group',
        description: 'A new test group',
      }
      const mockCreatedGroup = {
        id: 'group123',
        ...mockGroupData,
        createdBy: mockUser.id,
        inviteCode: 'ABCD1234',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      mockGroupService.create.mockResolvedValue(mockCreatedGroup)

      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'POST',
        body: JSON.stringify(mockGroupData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data).toEqual(mockCreatedGroup)
      expect(mockGroupService.create).toHaveBeenCalledWith({
        ...mockGroupData,
        createdBy: mockUser.id,
        inviteCode: 'ABCD1234',
      })
    })

    it('should validate required fields', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'POST',
        body: JSON.stringify({}), // Missing required name field
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details).toBeDefined()
    })

    it('should validate field lengths', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: 'a'.repeat(101), // Too long
          description: 'Valid description',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })

    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Group',
          description: 'A test group',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle database creation errors', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      mockGroupService.create.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Group',
          description: 'A test group',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
