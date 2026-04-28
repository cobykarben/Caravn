'use client'

import { cn } from '@/lib/utils'
import type { Seat, SeatStatus } from '@/lib/seat-templates'
import { SILHOUETTES, type VehicleType, type Silhouette } from './vehicle-silhouettes'

type ExtendedSeat = Omit<Seat, 'status'> & { status: SeatStatus }

type SeatMapProps = {
  seats: ExtendedSeat[]
  selectedSeatIds?: string[]
  onSeatToggle?: (seatId: string) => void
  readOnly?: boolean
  vehicleType?: VehicleType
}

function getSeatStyle(seat: ExtendedSeat, isSelected: boolean): string {
  if (isSelected)                 return 'bg-foreground border-foreground text-background scale-110'
  if (seat.isDriver)              return 'bg-foreground border-foreground text-background cursor-default'
  if (seat.status === 'occupied') return 'bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed'
  if (seat.status === 'reserved') return 'bg-yellow-500/15 border-yellow-600 text-yellow-500 cursor-not-allowed opacity-80'
  return 'bg-green-500/15 border-green-500 text-green-400 hover:bg-green-500/25 active:scale-95'
}

function computePosition(
  seat: ExtendedSeat,
  rowGroups: Map<number, ExtendedSeat[]>,
  rowIndices: number[],
  sil: Silhouette,
): { left: number; top: number } {
  const rowIdx = rowIndices.indexOf(seat.row)
  const seatsInRow = rowGroups.get(seat.row)!
  const totalRows = rowIndices.length
  const interiorH = sil.interiorBottom - sil.interiorTop
  const interiorW = sil.interiorRight - sil.interiorLeft
  return {
    top:  sil.interiorTop  + (rowIdx + 0.5) * (interiorH / totalRows),
    left: sil.interiorLeft + (seat.position + 0.5) * (interiorW / seatsInRow.length),
  }
}

export function SeatMap({
  seats,
  selectedSeatIds = [],
  onSeatToggle,
  readOnly = false,
  vehicleType = 'sedan',
}: SeatMapProps) {
  const sil = SILHOUETTES[vehicleType]
  const [, , vbWStr, vbHStr] = sil.viewBox.split(' ')
  const vbW = parseFloat(vbWStr!)
  const vbH = parseFloat(vbHStr!)

  // Group seats by row (sorted by position within each row)
  const rowGroups = new Map<number, ExtendedSeat[]>()
  for (const seat of seats) {
    const group = rowGroups.get(seat.row) ?? []
    group.push(seat)
    rowGroups.set(seat.row, group)
  }
  for (const [row, group] of rowGroups) {
    rowGroups.set(row, group.sort((a, b) => a.position - b.position))
  }
  const rowIndices = [...rowGroups.keys()].sort((a, b) => a - b)

  function handleClick(seat: ExtendedSeat) {
    if (readOnly || seat.isDriver || seat.status !== 'available') return
    onSeatToggle?.(seat.id)
  }

  return (
    <div
      className="relative w-full max-w-[200px] mx-auto"
      style={{ aspectRatio: `${vbW} / ${vbH}` }}
    >
      {/* Vehicle silhouette */}
      <svg viewBox={sil.viewBox} className="absolute inset-0 w-full h-full" aria-hidden="true">
        {/* Body — white/silver fill, Uber-style bright on dark */}
        <path
          d={sil.bodyPath}
          fill="rgba(255,255,255,0.13)"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.5"
        />
        {/* Glass areas — blue-tinted */}
        {sil.windshieldPath && (
          <path
            d={sil.windshieldPath}
            fill="rgba(147,197,253,0.18)"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1"
          />
        )}
        {sil.rearWindowPath && (
          <path
            d={sil.rearWindowPath}
            fill="rgba(147,197,253,0.18)"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1"
          />
        )}
        {/* Wheel wells */}
        {sil.wheelWells.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" />
        ))}
        {/* Door lines */}
        {sil.doorLines.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" strokeDasharray="3 2" />
        ))}
        {/* Steering wheel */}
        <circle
          cx={sil.steeringWheelCx}
          cy={sil.steeringWheelCy}
          r="4"
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Seat buttons */}
      {seats.map(seat => {
        const isSelected = selectedSeatIds.includes(seat.id)
        const isClickable = !readOnly && !seat.isDriver && seat.status === 'available'
        const { left, top } = computePosition(seat, rowGroups, rowIndices, sil)

        return (
          <button
            key={seat.id}
            type="button"
            onClick={() => handleClick(seat)}
            disabled={!isClickable && !seat.isDriver}
            aria-label={`${seat.label}${isSelected ? ' (selected)' : ''}`}
            aria-pressed={isSelected}
            title={seat.label}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: `${top}%`,
              transform: 'translate(-50%, -50%)',
              width: '28px',
              height: '22px',
            }}
            className={cn(
              'rounded-md border-2 text-[11px] font-bold transition-all flex items-center justify-center',
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
