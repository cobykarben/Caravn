import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BottomNav } from '../bottom-nav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/events',
}))

describe('BottomNav', () => {
  it('renders all 5 navigation items', () => {
    render(<BottomNav />)
    expect(screen.getByLabelText('Events')).toBeInTheDocument()
    expect(screen.getByLabelText('Rides')).toBeInTheDocument()
    expect(screen.getByLabelText('AI')).toBeInTheDocument()
    expect(screen.getByLabelText('Inbox')).toBeInTheDocument()
    expect(screen.getByLabelText('Profile')).toBeInTheDocument()
  })

  it('marks /events as active when pathname is /events', () => {
    render(<BottomNav />)
    expect(screen.getByLabelText('Events')).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark Rides as active when on /events', () => {
    render(<BottomNav />)
    expect(screen.getByLabelText('Rides')).not.toHaveAttribute('aria-current', 'page')
  })
})
