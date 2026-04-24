import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CreateRideWizard } from '../create-ride-wizard'
import type { Seat } from '@/lib/seat-templates'

const mockEvent = {
  id: 'evt-1',
  name: 'Taylor Swift — Eras Tour',
  venue_name: 'Wrigley Field',
  city: 'Chicago',
  starts_at: '2026-07-15T19:00:00Z',
}

const mockSeats: Seat[] = [
  { id: 'r0s0', row: 0, position: 0, label: 'Driver',           isDriver: true,  x: 25, y: 22, status: 'driver'    },
  { id: 'r0s1', row: 0, position: 1, label: 'Front Passenger',  isDriver: false, x: 75, y: 22, status: 'available' },
  { id: 'r1s0', row: 1, position: 0, label: 'Rear Left',        isDriver: false, x: 15, y: 72, status: 'available' },
  { id: 'r1s1', row: 1, position: 1, label: 'Rear Center',      isDriver: false, x: 50, y: 72, status: 'available' },
  { id: 'r1s2', row: 1, position: 2, label: 'Rear Right',       isDriver: false, x: 85, y: 72, status: 'available' },
]

const mockVehicle = {
  id: 'v1',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  color: 'Silver',
  type: 'sedan' as const,
  capacity: 5,
  seat_template: mockSeats,
  is_default: true,
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    },
    from: vi.fn(() => {
      const chain: Record<string, unknown> = {}
      const resolved = { data: [], error: null }
      const methods = ['select','eq','neq','ilike','or','order','limit','gte','in']
      methods.forEach(m => { chain[m] = vi.fn(() => chain) })
      chain['insert'] = vi.fn(() => ({
        select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: 'ride-new-1' }, error: null }) })),
      }))
      chain['update'] = vi.fn(() => chain)
      Object.assign(chain, { then: (cb: (v: typeof resolved) => void) => Promise.resolve().then(() => cb(resolved)) })
      return chain
    }),
  })),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}))

describe('CreateRideWizard — step indicators', () => {
  it('renders all 4 step numbers', () => {
    render(<CreateRideWizard />)
    ;['1','2','3','4'].forEach(n =>
      expect(screen.getAllByText(n).length).toBeGreaterThanOrEqual(1)
    )
  })

  it('starts on step 1 — event selection', () => {
    render(<CreateRideWizard />)
    expect(screen.getByText(/select event/i)).toBeInTheDocument()
  })
})

describe('CreateRideWizard — step 1 (event selection)', () => {
  it('renders event search input', () => {
    render(<CreateRideWizard />)
    expect(screen.getByPlaceholderText(/search events/i)).toBeInTheDocument()
  })

  it('Next is disabled when no event is selected', () => {
    render(<CreateRideWizard />)
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled()
  })

  it('Next is enabled when a preselected event is provided', () => {
    render(<CreateRideWizard preselectedEvent={mockEvent} />)
    expect(screen.getByRole('button', { name: /^next$/i })).not.toBeDisabled()
  })

  it('shows selected event name when preselected', () => {
    render(<CreateRideWizard preselectedEvent={mockEvent} />)
    expect(screen.getByText('Taylor Swift — Eras Tour')).toBeInTheDocument()
  })
})

describe('CreateRideWizard — step 2 (vehicle selection)', () => {
  async function goToStep2() {
    const user = userEvent.setup()
    render(<CreateRideWizard preselectedEvent={mockEvent} />)
    await user.click(screen.getByRole('button', { name: /^next$/i }))
    return user
  }

  it('advances to step 2 when Next is clicked with event selected', async () => {
    await goToStep2()
    expect(screen.getByText(/select vehicle/i)).toBeInTheDocument()
  })

  it('Back button returns to step 1', async () => {
    const user = await goToStep2()
    await user.click(screen.getByRole('button', { name: /^back$/i }))
    expect(screen.getByText(/select event/i)).toBeInTheDocument()
  })

  it('Next is disabled when no vehicle is selected', async () => {
    await goToStep2()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled()
  })
})

describe('CreateRideWizard — step 3 (ride details)', () => {
  async function goToStep3() {
    const user = userEvent.setup()
    render(<CreateRideWizard preselectedEvent={mockEvent} preselectedVehicle={mockVehicle} />)
    await user.click(screen.getByRole('button', { name: /^next$/i })) // step 1 → 2
    await user.click(screen.getByRole('button', { name: /^next$/i })) // step 2 → 3
    return user
  }

  it('advances to step 3 with vehicle preselected', async () => {
    await goToStep3()
    expect(screen.getByText(/ride details/i)).toBeInTheDocument()
  })

  it('renders departure address and time inputs', async () => {
    await goToStep3()
    expect(screen.getByLabelText(/departure address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/departure time/i)).toBeInTheDocument()
  })

  it('renders cost per person input defaulting to 0', async () => {
    await goToStep3()
    const costInput = screen.getByLabelText(/cost per person/i) as HTMLInputElement
    expect(costInput.value).toBe('0')
  })

  it('renders optional pickup radius toggle', async () => {
    await goToStep3()
    expect(screen.getByLabelText(/flexible pickup/i)).toBeInTheDocument()
  })

  it('Next is disabled when required fields are empty', async () => {
    await goToStep3()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled()
  })

  it('Next is enabled when departure address and time are filled', async () => {
    const user = await goToStep3()
    await user.type(screen.getByLabelText(/departure address/i), '123 Main St, Chicago')
    await user.type(screen.getByLabelText(/departure time/i), '2026-07-15T17:00')
    expect(screen.getByRole('button', { name: /^next$/i })).not.toBeDisabled()
  })
})

describe('CreateRideWizard — step 4 (preview + publish)', () => {
  async function goToStep4() {
    const user = userEvent.setup()
    render(<CreateRideWizard preselectedEvent={mockEvent} preselectedVehicle={mockVehicle} />)
    await user.click(screen.getByRole('button', { name: /^next$/i })) // → step 2
    await user.click(screen.getByRole('button', { name: /^next$/i })) // → step 3
    await user.type(screen.getByLabelText(/departure address/i), '123 Main St')
    await user.type(screen.getByLabelText(/departure time/i), '2026-07-15T17:00')
    await user.click(screen.getByRole('button', { name: /^next$/i })) // → step 4
    return user
  }

  it('shows review heading and Publish Ride button', async () => {
    await goToStep4()
    expect(screen.getByText(/review & publish/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /publish ride/i })).toBeInTheDocument()
  })

  it('shows selected event name in review', async () => {
    await goToStep4()
    expect(screen.getByText('Taylor Swift — Eras Tour')).toBeInTheDocument()
  })

  it('shows vehicle info in review', async () => {
    await goToStep4()
    expect(screen.getByText(/2022 Toyota Camry/i)).toBeInTheDocument()
  })

  it('shows departure address in review', async () => {
    await goToStep4()
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
  })

  it('Back button in step 4 returns to step 3', async () => {
    const user = await goToStep4()
    await user.click(screen.getByRole('button', { name: /^back$/i }))
    expect(screen.getByText(/ride details/i)).toBeInTheDocument()
  })
})
