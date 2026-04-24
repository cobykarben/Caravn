import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { VehicleForm } from '../vehicle-form'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
    })),
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

describe('VehicleForm', () => {
  it('renders all required fields', () => {
    render(<VehicleForm />)
    expect(screen.getByLabelText(/make/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/color/i)).toBeInTheDocument()
  })

  it('shows seat preview section', () => {
    render(<VehicleForm />)
    expect(screen.getByText(/seat preview/i)).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<VehicleForm />)
    expect(screen.getByRole('button', { name: /save vehicle/i })).toBeInTheDocument()
  })
})
