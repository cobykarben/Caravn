import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { VehicleCard } from '../vehicle-card'

const vehicle = {
  id: 'v1',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  color: 'Silver',
  type: 'sedan',
  capacity: 5,
  is_default: false,
}

describe('VehicleCard', () => {
  it('renders year, make, model', () => {
    render(<VehicleCard vehicle={vehicle} />)
    expect(screen.getByText('2022 Toyota Camry')).toBeInTheDocument()
  })

  it('renders color, type, capacity', () => {
    render(<VehicleCard vehicle={vehicle} />)
    expect(screen.getByText(/Silver/)).toBeInTheDocument()
    expect(screen.getByText(/sedan/)).toBeInTheDocument()
    expect(screen.getByText(/5 seats/)).toBeInTheDocument()
  })

  it('shows Default badge when is_default is true', () => {
    render(<VehicleCard vehicle={{ ...vehicle, is_default: true }} />)
    expect(screen.getByText('Default')).toBeInTheDocument()
  })

  it('does not show Default badge when is_default is false', () => {
    render(<VehicleCard vehicle={vehicle} />)
    expect(screen.queryByText('Default')).not.toBeInTheDocument()
  })
})
