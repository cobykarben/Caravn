import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CreateEventForm } from '../create-event-form'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: [{ id: 'new-evt-1' }], error: null }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'new-evt-1' }, error: null }),
    })),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('CreateEventForm', () => {
  it('renders all required fields', () => {
    render(<CreateEventForm />)
    expect(screen.getByLabelText(/event name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/venue name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/venue address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
  })

  it('submit button is present', () => {
    render(<CreateEventForm />)
    expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument()
  })
})
