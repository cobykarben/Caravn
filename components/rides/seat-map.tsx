'use client'

import { cn } from '@/lib/utils'
import type { Seat, SeatStatus } from '@/lib/seat-templates'

type ExtendedSeat = Omit<Seat, 'status'> & { status: SeatStatus }

type SeatMapProps = {
  seats: ExtendedSeat[]
  selectedSeatIds?: string[]
  onSeatToggle?: (seatId: string) => void
  readOnly?: boolean
}

function getSeatStyle(seat: ExtendedSeat, isSelected: boolean): string {
  if (isSelected)                 return 'bg-foreground border-foreground text-background scale-110'
  if (seat.isDriver)              return 'bg-foreground border-foreground text-background cursor-default'
  if (seat.status === 'occupied') return 'bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed'
  if (seat.status === 'reserved') return 'bg-yellow-500/15 border-yellow-600 text-yellow-500 cursor-not-allowed opacity-80'
  return 'bg-green-500/15 border-green-500 text-green-400 hover:bg-green-500/25 active:scale-95'
}

export function SeatMap({
  seats,
  selectedSeatIds = [],
  onSeatToggle,
  readOnly = false,
}: SeatMapProps) {
  function handleClick(seat: ExtendedSeat) {
    if (readOnly || seat.isDriver || seat.status !== 'available') return
    onSeatToggle?.(seat.id)
  }

  return (
    <div className="relative w-full max-w-[200px] mx-auto" style={{ aspectRatio: '1 / 2.2' }}>
      {/* Car silhouette SVG */}
      <svg viewBox="0 0 100 220" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <rect x="8" y="18" width="84" height="184" rx="24"
          fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
        <rect x="20" y="36" width="60" height="36" rx="6"
          fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" opacity="0.5" />
        <rect x="20" y="148" width="60" height="36" rx="6"
          fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" opacity="0.5" />
        <rect x="24" y="10" width="52" height="9" rx="4" fill="hsl(var(--muted))" />
        <rect x="24" y="201" width="52" height="9" rx="4" fill="hsl(var(--muted))" />
      </svg>

      {/* Seat buttons */}
      {seats.map(seat => {
        const isSelected = selectedSeatIds.includes(seat.id)
        const isClickable = !readOnly && !seat.isDriver && seat.status === 'available'

        return (
          <button
            key={seat.id}
            onClick={() => handleClick(seat)}
            disabled={!isClickable && !seat.isDriver}
            aria-label={`${seat.label}${isSelected ? ' (selected)' : ''}`}
            aria-pressed={isSelected}
            title={seat.label}
            style={{
              position: 'absolute',
              left: `${seat.x}%`,
              top: `${seat.y}%`,
              transform: 'translate(-50%, -50%)',
              width: '30px',
              height: '30px',
            }}
            className={cn(
              'rounded-full border-2 text-[11px] font-bold transition-all',
              getSeatStyle(seat, isSelected),
            )}
          >
            {seat.isDriver ? '▲' : isSelected ? '✓' : null}
          </button>
        )
      })}
    </div>
  )
}
