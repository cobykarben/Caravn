import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { FAB } from '../fab'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('FAB', () => {
  it('renders the + button', () => {
    render(<FAB />)
    expect(screen.getByRole('button', { name: /open actions/i })).toBeInTheDocument()
  })

  it('opens bottom sheet with Find and Post options on tap', async () => {
    const user = userEvent.setup()
    render(<FAB />)
    await user.click(screen.getByRole('button', { name: /open actions/i }))
    expect(screen.getByText('Find a Ride')).toBeInTheDocument()
    expect(screen.getByText('Post a Ride')).toBeInTheDocument()
  })
})
