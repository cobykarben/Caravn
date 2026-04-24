import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventCard } from '../event-card'

const event = {
  id: 'evt-1',
  name: 'Taylor Swift — Eras Tour',
  venue_name: 'Wrigley Field',
  city: 'Chicago',
  starts_at: '2026-07-15T19:00:00Z',
  category: 'concert' as const,
  image_url: null,
  ride_count: 4,
}

describe('EventCard', () => {
  it('renders event name', () => {
    render(<EventCard event={event} />)
    expect(screen.getByText('Taylor Swift — Eras Tour')).toBeInTheDocument()
  })

  it('renders venue and city', () => {
    render(<EventCard event={event} />)
    expect(screen.getByText(/Wrigley Field/)).toBeInTheDocument()
    expect(screen.getByText(/Chicago/)).toBeInTheDocument()
  })

  it('renders ride count', () => {
    render(<EventCard event={event} />)
    expect(screen.getByText(/4 rides/)).toBeInTheDocument()
  })

  it('renders 0 rides text when no rides', () => {
    render(<EventCard event={{ ...event, ride_count: 0 }} />)
    expect(screen.getByText(/No rides yet/)).toBeInTheDocument()
  })

  it('renders category badge', () => {
    render(<EventCard event={event} />)
    expect(screen.getByText('concert')).toBeInTheDocument()
  })
})
