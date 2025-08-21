import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateGroupForm } from '@/components/forms/create-group-form'

// Mock fetch
global.fetch = jest.fn()

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}))

describe('CreateGroupForm', () => {
  const mockOnClose = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
  })

  const renderForm = (isOpen = true) => {
    return render(
      <CreateGroupForm
        isOpen={isOpen}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
  }

  it('should render form when open', () => {
    renderForm()

    expect(screen.getByText('Create New Group')).toBeInTheDocument()
    expect(screen.getByLabelText(/group name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create group/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('should not render form when closed', () => {
    renderForm(false)

    expect(screen.queryByText('Create New Group')).not.toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    renderForm()

    const submitButton = screen.getByRole('button', { name: /create group/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/group name is required/i)).toBeInTheDocument()
    })
  })

  it('should validate field lengths', async () => {
    const user = userEvent.setup()
    renderForm()

    const nameInput = screen.getByLabelText(/group name/i)
    const descriptionInput = screen.getByLabelText(/description/i)

    // Test name too long
    await user.type(nameInput, 'a'.repeat(101))
    await user.type(descriptionInput, 'a'.repeat(501))

    const submitButton = screen.getByRole('button', { name: /create group/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/group name too long/i)).toBeInTheDocument()
      expect(screen.getByText(/description too long/i)).toBeInTheDocument()
    })
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      data: {
        id: 'group123',
        name: 'Test Group',
        description: 'Test Description',
      },
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    renderForm()

    const nameInput = screen.getByLabelText(/group name/i)
    const descriptionInput = screen.getByLabelText(/description/i)

    await user.type(nameInput, 'Test Group')
    await user.type(descriptionInput, 'Test Description')

    const submitButton = screen.getByRole('button', { name: /create group/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Group',
          description: 'Test Description',
        }),
      })
    })

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse.data)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should handle API errors', async () => {
    const user = userEvent.setup()
    const toast = require('react-hot-toast')

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Group creation failed' }),
    })

    renderForm()

    const nameInput = screen.getByLabelText(/group name/i)
    await user.type(nameInput, 'Test Group')

    const submitButton = screen.getByRole('button', { name: /create group/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Group creation failed')
    })

    // Form should still be open
    expect(screen.getByText('Create New Group')).toBeInTheDocument()
  })

  it('should handle network errors', async () => {
    const user = userEvent.setup()
    const toast = require('react-hot-toast')

    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    renderForm()

    const nameInput = screen.getByLabelText(/group name/i)
    await user.type(nameInput, 'Test Group')

    const submitButton = screen.getByRole('button', { name: /create group/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error')
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()

    // Mock a delayed response
    ;(fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ data: {} }),
      }), 100))
    )

    renderForm()

    const nameInput = screen.getByLabelText(/group name/i)
    await user.type(nameInput, 'Test Group')

    const submitButton = screen.getByRole('button', { name: /create group/i })
    await user.click(submitButton)

    // Should show loading state
    expect(screen.getByText(/creating/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText(/creating/i)).not.toBeInTheDocument()
    }, { timeout: 200 })
  })

  it('should close form when cancel is clicked', async () => {
    const user = userEvent.setup()
    renderForm()

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should reset form when closed', async () => {
    const user = userEvent.setup()
    renderForm()

    const nameInput = screen.getByLabelText(/group name/i)
    await user.type(nameInput, 'Test Group')

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    // Re-render as open
    renderForm()

    // Form should be reset
    expect(screen.getByLabelText(/group name/i)).toHaveValue('')
  })

  it('should disable submit button when loading', async () => {
    const user = userEvent.setup()

    ;(fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves
    )

    renderForm()

    const nameInput = screen.getByLabelText(/group name/i)
    await user.type(nameInput, 'Test Group')

    const submitButton = screen.getByRole('button', { name: /create group/i })
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
  })

  it('should allow optional description', async () => {
    const user = userEvent.setup()

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    })

    renderForm()

    const nameInput = screen.getByLabelText(/group name/i)
    await user.type(nameInput, 'Test Group')

    const submitButton = screen.getByRole('button', { name: /create group/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Group',
          description: '',
        }),
      })
    })
  })
})
