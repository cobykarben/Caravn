/**
 * Top-down SVG silhouettes for each vehicle type.
 * All viewBoxes are "0 0 100 240" — portrait orientation, front of car at top.
 *
 * interiorTop/Bottom/Left/Right are percentages of the viewBox dimensions.
 * The SeatMap component uses them to place seat buttons inside the cabin area.
 */

export type VehicleType = 'sedan' | 'coupe' | 'hatchback' | 'suv' | 'minivan' | 'van' | 'truck'

export type Silhouette = {
  viewBox: string
  /** Outer body outline — closed SVG path */
  bodyPath: string
  /** Front glass area — filled trapezoid */
  windshieldPath: string
  /** Rear glass area — filled trapezoid (empty string if none, e.g. truck) */
  rearWindowPath: string
  /** Horizontal interior dividers: door lines, cab wall, tailgate, etc. */
  doorLines: string[]
  /** Arcs at the four corners showing tyre/wheel-well protrusions */
  wheelWells: string[]
  steeringWheelCx: number
  steeringWheelCy: number
  /** Seat placement bounds as % of viewBox height (0–100) */
  interiorTop: number
  interiorBottom: number
  /** Seat placement bounds as % of viewBox width (0–100) */
  interiorLeft: number
  interiorRight: number
}

// ─── Sedan ────────────────────────────────────────────────────────────────────
// Classic 3-box: tapered hood, rectangular cabin, tapered trunk.
// Rows: [2, 3]  Max capacity: 5

const sedan: Silhouette = {
  viewBox: '0 0 100 240',
  bodyPath:
    'M 50,10 Q 74,10 78,22 L 85,64 L 85,176 Q 82,212 76,226 Q 63,232 50,232 Q 37,232 24,226 Q 18,212 15,176 L 15,64 L 22,22 Q 26,10 50,10 Z',
  windshieldPath: 'M 22,66 L 78,66 L 84,88 L 16,88 Z',
  rearWindowPath: 'M 18,180 L 82,180 L 76,210 L 24,210 Z',
  doorLines: ['M 15,132 L 85,132'],
  wheelWells: [
    'M 85,50 A 8,15 0 0 1 85,80',   // front-right
    'M 15,50 A 8,15 0 0 0 15,80',   // front-left
    'M 85,162 A 8,15 0 0 1 85,192', // rear-right
    'M 15,162 A 8,15 0 0 0 15,192', // rear-left
  ],
  steeringWheelCx: 28,
  steeringWheelCy: 76,
  interiorTop: 37,    // y=88 / 240
  interiorBottom: 75, // y=180 / 240
  interiorLeft: 20,
  interiorRight: 80,
}

// ─── Coupe ────────────────────────────────────────────────────────────────────
// Sportier, sleeker, shorter cabin, pronounced rear taper (fastback silhouette).
// Rows: [2, 2]  Max capacity: 4

const coupe: Silhouette = {
  viewBox: '0 0 100 240',
  bodyPath:
    'M 50,14 Q 70,14 74,26 L 82,62 L 84,155 Q 80,196 70,216 Q 60,222 50,222 Q 40,222 30,216 Q 20,196 16,155 L 18,62 L 26,26 Q 30,14 50,14 Z',
  windshieldPath: 'M 24,64 L 76,64 L 83,84 L 17,84 Z',
  rearWindowPath: 'M 19,160 L 81,160 L 72,208 L 28,208 Z',
  doorLines: ['M 17,120 L 83,120'],
  wheelWells: [
    'M 82,50 A 7,13 0 0 1 82,76',
    'M 18,50 A 7,13 0 0 0 18,76',
    'M 83,148 A 7,13 0 0 1 83,174',
    'M 17,148 A 7,13 0 0 0 17,174',
  ],
  steeringWheelCx: 28,
  steeringWheelCy: 73,
  interiorTop: 35,    // y=84 / 240
  interiorBottom: 66, // y=159 / 240
  interiorLeft: 22,
  interiorRight: 78,
}

// ─── Hatchback ────────────────────────────────────────────────────────────────
// Like sedan but shorter rear section; rear window is tall and upright (hatch).
// Rows: [2, 3]  Max capacity: 5

const hatchback: Silhouette = {
  viewBox: '0 0 100 240',
  bodyPath:
    'M 50,12 Q 73,12 77,22 L 84,64 L 85,168 Q 83,196 77,210 Q 64,218 50,218 Q 36,218 23,210 Q 17,196 15,168 L 16,64 L 23,22 Q 27,12 50,12 Z',
  windshieldPath: 'M 22,66 L 78,66 L 84,88 L 16,88 Z',
  // Taller, more upright than sedan (hatch style)
  rearWindowPath: 'M 17,172 L 83,172 L 82,204 L 18,204 Z',
  doorLines: ['M 16,128 L 84,128'],
  wheelWells: [
    'M 84,50 A 8,15 0 0 1 84,80',
    'M 16,50 A 8,15 0 0 0 16,80',
    'M 84,156 A 8,15 0 0 1 84,186',
    'M 16,156 A 8,15 0 0 0 16,186',
  ],
  steeringWheelCx: 28,
  steeringWheelCy: 76,
  interiorTop: 37,    // y=88 / 240
  interiorBottom: 72, // y=172 / 240
  interiorLeft: 20,
  interiorRight: 80,
}

// ─── SUV ──────────────────────────────────────────────────────────────────────
// Wider (74 px), boxier, squared-off front and rear, bigger wheel wells.
// Rows: [2, 3, 2]  Max capacity: 7

const suv: Silhouette = {
  viewBox: '0 0 100 240',
  bodyPath:
    'M 50,10 Q 78,10 82,22 L 87,66 L 87,178 Q 85,214 79,226 Q 65,232 50,232 Q 35,232 21,226 Q 15,214 13,178 L 13,66 L 18,22 Q 22,10 50,10 Z',
  windshieldPath: 'M 19,68 L 81,68 L 86,92 L 14,92 Z',
  rearWindowPath: 'M 15,182 L 85,182 L 82,216 L 18,216 Z',
  doorLines: ['M 13,138 L 87,138'],
  wheelWells: [
    'M 87,52 A 9,18 0 0 1 87,88',
    'M 13,52 A 9,18 0 0 0 13,88',
    'M 87,166 A 9,18 0 0 1 87,202',
    'M 13,166 A 9,18 0 0 0 13,202',
  ],
  steeringWheelCx: 26,
  steeringWheelCy: 80,
  interiorTop: 38,    // y=92 / 240
  interiorBottom: 76, // y=182 / 240
  interiorLeft: 17,
  interiorRight: 83,
}

// ─── Minivan ──────────────────────────────────────────────────────────────────
// Widest body (80 px), most rectangular, flat front, 3 seat rows.
// Rows: [2, 3, 3]  Max capacity: 8

const minivan: Silhouette = {
  viewBox: '0 0 100 240',
  bodyPath:
    'M 50,12 Q 79,12 84,22 L 90,60 L 90,190 Q 88,224 80,232 Q 65,238 50,238 Q 35,238 20,232 Q 12,224 10,190 L 10,60 L 16,22 Q 21,12 50,12 Z',
  windshieldPath: 'M 17,58 L 83,58 L 89,82 L 11,82 Z',
  rearWindowPath: 'M 12,194 L 88,194 L 86,226 L 14,226 Z',
  doorLines: [
    'M 10,124 L 90,124',
    'M 10,160 L 90,160',
  ],
  wheelWells: [
    'M 90,46 A 9,17 0 0 1 90,80',
    'M 10,46 A 9,17 0 0 0 10,80',
    'M 90,178 A 9,17 0 0 1 90,212',
    'M 10,178 A 9,17 0 0 0 10,212',
  ],
  steeringWheelCx: 24,
  steeringWheelCy: 70,
  interiorTop: 34,    // y=82 / 240
  interiorBottom: 80, // y=192 / 240
  interiorLeft: 13,
  interiorRight: 87,
}

// ─── Van ──────────────────────────────────────────────────────────────────────
// Commercial van: near-rectangular, minimal hood taper, 4 seat rows.
// Rows: [2, 3, 3, 3]  Max capacity: 11

const van: Silhouette = {
  viewBox: '0 0 100 240',
  bodyPath:
    'M 50,12 Q 80,12 85,20 L 89,50 L 89,196 Q 87,226 80,232 Q 65,236 50,236 Q 35,236 20,232 Q 13,226 11,196 L 11,50 L 15,20 Q 20,12 50,12 Z',
  windshieldPath: 'M 16,48 L 84,48 L 88,70 L 12,70 Z',
  rearWindowPath: 'M 13,200 L 87,200 L 85,228 L 15,228 Z',
  doorLines: [
    'M 11,108 L 89,108',
    'M 11,144 L 89,144',
    'M 11,180 L 89,180',
  ],
  wheelWells: [
    'M 89,36 A 9,17 0 0 1 89,68',
    'M 11,36 A 9,17 0 0 0 11,68',
    'M 89,186 A 9,17 0 0 1 89,220',
    'M 11,186 A 9,17 0 0 0 11,220',
  ],
  steeringWheelCx: 24,
  steeringWheelCy: 60,
  interiorTop: 29,    // y=70 / 240
  interiorBottom: 82, // y=197 / 240
  interiorLeft: 14,
  interiorRight: 86,
}

// ─── Truck ────────────────────────────────────────────────────────────────────
// Pickup truck: cab section (front 58%) + open bed (rear 42%).
// Seats only in the cab — interiorBottom stops at the cab rear wall.
// Bed slightly wider than cab (step at the transition — realistic fender flares).
// Rows: [2, 3]  Max capacity: 5

const truck: Silhouette = {
  viewBox: '0 0 100 240',
  bodyPath:
    'M 50,12 Q 73,12 77,22 L 84,62 L 85,136 L 87,142 L 87,226 Q 85,234 50,236 Q 15,234 13,226 L 13,142 L 15,136 L 16,62 L 23,22 Q 27,12 50,12 Z',
  windshieldPath: 'M 22,64 L 78,64 L 84,84 L 16,84 Z',
  rearWindowPath: '', // no rear window — cab rear wall is solid
  doorLines: [
    'M 16,108 L 84,108', // cab door line (front / rear seat row)
    'M 15,136 L 85,136', // cab rear wall (thick structural line)
    'M 13,144 L 87,144', // bed front wall (showing panel thickness)
    'M 13,220 L 87,220', // tailgate
  ],
  wheelWells: [
    'M 84,50 A 7,14 0 0 1 84,78',   // front-right
    'M 16,50 A 7,14 0 0 0 16,78',   // front-left
    'M 87,168 A 9,18 0 0 1 87,204', // rear-right (bigger — dual rear wheels)
    'M 13,168 A 9,18 0 0 0 13,204', // rear-left
  ],
  steeringWheelCx: 27,
  steeringWheelCy: 74,
  interiorTop: 35,    // y=84 / 240
  interiorBottom: 55, // y=132 / 240 — stops just before cab rear wall
  interiorLeft: 20,
  interiorRight: 80,
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const SILHOUETTES: Record<VehicleType, Silhouette> = {
  sedan,
  coupe,
  hatchback,
  suv,
  minivan,
  van,
  truck,
}
