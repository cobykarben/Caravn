# Phase 1 · Task 9 (Done) + Task 10 (Pending): Vehicles & Seat Map

---

## Task 9: Vehicle Registration + Live Seat Preview ✅

**Commits:** `4472688`, `1ef0f96`

**What was built:**

- `components/vehicles/vehicle-card.tsx` — Card: avatar icon, "2022 Toyota Camry", "Silver · sedan · 5 seats", "Default" badge when `is_default`. Optional `onSetDefault` callback renders "Set as default" underline button.
- `components/vehicles/vehicle-form.tsx` — Client component. Make/model/year/color fields + vehicle type select + capacity number input. `useEffect` regenerates seat preview whenever type or capacity changes. Max capacity per type: sedan=5, coupe=4, hatchback=5, suv=7, minivan=8, van=11, truck=5. On save: checks if user has existing vehicles (if not, sets `is_default: true`), inserts with `seat_template` from `generateSeatTemplate()`.
- `app/(app)/profile/vehicles/page.tsx` — Client component (needs client for `setDefault` mutation). Loads vehicles on mount, renders `<VehicleCard onSetDefault={setDefault}>`. `setDefault` does two updates: clear all → set one.
- `app/(app)/profile/vehicles/new/page.tsx` — Wraps `<VehicleForm />`.

**Tests:** 4 tests for `VehicleCard`, 3 tests for `VehicleForm` (fields present, seat preview section, submit button).

---

## Task 10: Interactive Seat Map Component ⬜ PENDING

**Next prompt to run:**
> "Read `docs/superpowers/plans/phase-1-task-3-vehicles-seatmap.md` only. Implement Task 10: Interactive Seat Map. Follow the TDD steps exactly."

### Objective

Replace the `seat-map.tsx` placeholder with a full interactive SVG seat map. Add `seatRecordToArray` helper to `seat-templates.ts`. This component is used in the ride wizard (Task 11), ride detail page (Task 12), and application form.

### Files to Modify/Create

| File | Action |
|------|--------|
| `components/rides/seat-map.tsx` | Replace stub with full implementation |
| `components/rides/__tests__/seat-map.test.tsx` | Create (6 tests) |
| `lib/seat-templates.ts` | Add `seatRecordToArray` helper |
| `lib/__tests__/seat-templates.test.ts` | Add round-trip test |

---

### Step 1: Create the failing test file

Create `components/rides/__tests__/seat-map.test.tsx`:

```typescript
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
```

Run to confirm it fails:
```bash
npm run test:run components/rides/__tests__/seat-map.test.tsx
```

---

### Step 2: Implement SeatMap

Replace `components/rides/seat-map.tsx`:

```typescript
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
```

Run tests — expect PASS (6 tests).

---

### Step 3: Add seatRecordToArray to seat-templates.ts

Append to `lib/seat-templates.ts`:

```typescript
export function seatRecordToArray(seatMap: Record<string, Seat>): Seat[] {
  return Object.values(seatMap).sort((a, b) =>
    a.row !== b.row ? a.row - b.row : a.position - b.position
  )
}
```

---

### Step 4: Add round-trip test

Append to `lib/__tests__/seat-templates.test.ts`:

```typescript
import { generateSeatTemplate, seatMapToRecord, seatRecordToArray } from '../seat-templates'

describe('seatRecordToArray', () => {
  it('round-trips through seatMapToRecord preserving row/position order', () => {
    const original = generateSeatTemplate('sedan', 5)
    const record = seatMapToRecord(original)
    const result = seatRecordToArray(record)
    expect(result.map(s => s.id)).toEqual(original.map(s => s.id))
  })
})
```

---

### Step 5: Verify

```bash
npm run test:run
npm run build
```

Both must pass with zero errors.

### Step 6: Commit

```bash
git add components/rides/seat-map.tsx components/rides/__tests__/ lib/seat-templates.ts lib/__tests__/seat-templates.test.ts
git commit -m "feat: interactive SVG seat map with color-coded status, seat selection, and read-only mode"
```

### Acceptance Criteria

- [ ] 6 SeatMap tests pass
- [ ] 1 new seat-templates round-trip test passes
- [ ] `seatRecordToArray` exported from `lib/seat-templates.ts`
- [ ] `npm run build` has zero TypeScript errors

---

## Next Steps After Task 10

Read `phase-1-task-4-rides.md` to implement the Create Ride Wizard (Task 11).
