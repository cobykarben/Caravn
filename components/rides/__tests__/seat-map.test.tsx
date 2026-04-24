import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SeatMap } from '../seat-map'
import { generateSeatTemplate } from '@/lib/seat-templates'

const seats = generateSeatTemplate('sedan', 5)

describe('SeatMap', () => {
  it('renders a button for every seat', () => {
    render(<SeatMap seats={seats} readOnly />)
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  it('driver seat is labelled Driver', () => {
    render(<SeatMap seats={seats} readOnly />)
    expect(screen.getByRole('button', { name: /driver/i })).toBeInTheDocument()
  })

  it('calls onSeatToggle when an available seat is clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<SeatMap seats={seats} onSeatToggle={onToggle} />)
    const passenger = screen.getAllByRole('button').find(
      b => !b.getAttribute('aria-label')?.toLowerCase().includes('driver')
    )!
    await user.click(passenger)
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('does not call onSeatToggle when readOnly', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<SeatMap seats={seats} onSeatToggle={onToggle} readOnly />)
    const passenger = screen.getAllByRole('button').find(
      b => !b.getAttribute('aria-label')?.toLowerCase().includes('driver')
    )!
    await user.click(passenger)
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('marks selected seats with aria-pressed=true', () => {
    const firstPassenger = seats.find(s => !s.isDriver)!
    render(<SeatMap seats={seats} selectedSeatIds={[firstPassenger.id]} />)
    const btn = screen.getByRole('button', { name: new RegExp(firstPassenger.label, 'i') })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('disables occupied seats', () => {
    const withOccupied = seats.map(s =>
      s.isDriver ? s : { ...s, status: 'occupied' as const }
    )
    render(<SeatMap seats={withOccupied} />)
    const passengers = screen.getAllByRole('button').filter(
      b => !b.getAttribute('aria-label')?.toLowerCase().includes('driver')
    )
    passengers.forEach(b => expect(b).toBeDisabled())
  })
})
