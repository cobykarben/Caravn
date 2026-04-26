import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { RideApplicationForm } from '../ride-application-form'
import type { Seat } from '@/lib/seat-templates'

const seats: Seat[] = [
  { id: 'r0s0', row: 0, position: 0, label: 'Driver',          isDriver: true,  x: 25, y: 22, status: 'driver'    },
  { id: 'r0s1', row: 0, position: 1, label: 'Front Passenger', isDriver: false, x: 75, y: 22, status: 'available' },
  { id: 'r1s0', row: 1, position: 0, label: 'Rear Left',       isDriver: false, x: 15, y: 72, status: 'available' },
  { id: 'r1s1', row: 1, position: 1, label: 'Rear Center',     isDriver: false, x: 50, y: 72, status: 'available' },
  { id: 'r1s2', row: 1, position: 2, label: 'Rear Right',      isDriver: false, x: 85, y: 72, status: 'available' },
]

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const freeRide = { id: 'r1', cost_per_person: 0, is_paid: false, pickup_radius_miles: null, seats, accepted_count: 0 }
const paidRide = { id: 'r2', cost_per_person: 60, is_paid: true, pickup_radius_miles: null, seats, accepted_count: 1 }
const flexRide  = { id: 'r3', cost_per_person: 0, is_paid: false, pickup_radius_miles: 2, seats, accepted_count: 0 }

describe('RideApplicationForm', () => {
  it('renders the seat map', () => {
    render(<RideApplicationForm ride={freeRide} />)
    expect(screen.getByRole('button', { name: /driver/i })).toBeInTheDocument()
  })

  it('Submit is disabled when no seats are selected', () => {
    render(<RideApplicationForm ride={freeRide} />)
    expect(screen.getByRole('button', { name: /request seat/i })).toBeDisabled()
  })

  it('Submit is enabled after selecting an available seat', async () => {
    const user = userEvent.setup()
    render(<RideApplicationForm ride={freeRide} />)
    await user.click(screen.getByRole('button', { name: /front passenger/i }))
    expect(screen.getByRole('button', { name: /request seat/i })).not.toBeDisabled()
  })

  it('shows "Free ride" for rides with cost_per_person = 0', () => {
    render(<RideApplicationForm ride={freeRide} />)
    expect(screen.getByText(/free ride/i)).toBeInTheDocument()
  })

  it('shows estimated cost per person for paid rides', () => {
    // $60 / (1 accepted + 1 driver + 1 new rider) = $20
    render(<RideApplicationForm ride={paidRide} />)
    expect(screen.getByText(/\$20\.00/)).toBeInTheDocument()
  })

  it('shows custom pickup address field when driver has flexible pickup radius', () => {
    render(<RideApplicationForm ride={flexRide} />)
    expect(screen.getByLabelText(/custom pickup/i)).toBeInTheDocument()
  })

  it('does not show custom pickup when pickup_radius_miles is null', () => {
    render(<RideApplicationForm ride={freeRide} />)
    expect(screen.queryByLabelText(/custom pickup/i)).not.toBeInTheDocument()
  })
})
