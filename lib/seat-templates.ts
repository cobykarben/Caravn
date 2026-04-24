export type SeatStatus = 'available' | 'reserved' | 'occupied' | 'driver'

export type Seat = {
  id: string
  row: number
  position: number
  label: string
  isDriver: boolean
  x: number
  y: number
  status: SeatStatus
}

const VEHICLE_ROW_LAYOUTS: Record<string, number[]> = {
  sedan:    [2, 3],
  coupe:    [2, 2],
  hatchback:[2, 3],
  suv:      [2, 3, 2],
  minivan:  [2, 3, 3],
  van:      [2, 3, 3, 3],
  truck:    [2, 3],
}

const X_BY_COUNT: Record<number, number[]> = {
  1: [50],
  2: [25, 75],
  3: [15, 50, 85],
}

function yPositions(rowCount: number): number[] {
  if (rowCount === 2) return [22, 72]
  if (rowCount === 3) return [18, 50, 78]
  if (rowCount === 4) return [14, 38, 62, 84]
  return [50]
}

function seatLabel(rowIndex: number, position: number, seatsInRow: number): string {
  if (rowIndex === 0) return position === 0 ? 'Driver' : 'Front Passenger'
  const labels = seatsInRow === 3
    ? ['Rear Left', 'Rear Center', 'Rear Right']
    : ['Rear Left', 'Rear Right']
  return labels[position] ?? `Seat ${position + 1}`
}

export function generateSeatTemplate(vehicleType: string, capacity: number): Seat[] {
  const base = VEHICLE_ROW_LAYOUTS[vehicleType] ?? [2, 3]
  const layout = [...base]

  let total = layout.reduce((a, b) => a + b, 0)
  while (total > capacity && layout.length > 0) {
    const last = layout[layout.length - 1]!
    if (last > 1) {
      layout[layout.length - 1] = last - 1
    } else {
      layout.pop()
    }
    total = layout.reduce((a, b) => a + b, 0)
  }

  const ys = yPositions(layout.length)
  const seats: Seat[] = []

  layout.forEach((count, rowIndex) => {
    const xs = X_BY_COUNT[count] ?? X_BY_COUNT[2]!
    const y = ys[rowIndex] ?? 50

    for (let pos = 0; pos < count; pos++) {
      const isDriver = rowIndex === 0 && pos === 0
      seats.push({
        id: `r${rowIndex}s${pos}`,
        row: rowIndex,
        position: pos,
        label: seatLabel(rowIndex, pos, count),
        isDriver,
        x: xs[pos] ?? 50,
        y,
        status: isDriver ? 'driver' : 'available',
      })
    }
  })

  return seats
}

export function seatMapToRecord(seats: Seat[]): Record<string, Seat> {
  return Object.fromEntries(seats.map(s => [s.id, s]))
}

export function seatRecordToArray(seatMap: Record<string, Seat>): Seat[] {
  return Object.values(seatMap).sort((a, b) =>
    a.row !== b.row ? a.row - b.row : a.position - b.position
  )
}
