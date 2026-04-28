# Seat Map Redesign — Realistic Vehicle Silhouettes

## Goal

Replace the current abstract dot-on-rectangle seat map with an airline-style interactive layout:
- Vertical top-down silhouette of the actual vehicle type
- Seats rendered as rounded rectangles inside the silhouette (not floating circles)
- 7 distinct silhouettes — one per vehicle type — so a minivan looks nothing like a truck
- All existing interactivity preserved (tap to select, color-coded status, read-only mode)

## What changes and what doesn't

**Changes:**
- `components/rides/seat-map.tsx` — full redesign of the SVG layer + seat shape
- `components/rides/vehicle-silhouettes.ts` — NEW file, exports one SVG path set per vehicle type
- `components/rides/ride-application-form.tsx` — add `vehicleType` prop, pass to SeatMap
- `components/rides/create-ride-wizard.tsx` — pass `v.type` to both Step 2 preview and Step 4 review
- `app/(app)/rides/[id]/page.tsx` — pass `ride.vehicle.type` into RideApplicationForm

**Doesn't change:**
- `lib/seat-templates.ts` — row/position/label data stays the same; x/y percentages become unused (SeatMap will compute positions from row/position directly)
- All existing tests — SeatMap tests use aria-labels/roles which won't change
- DB schema, types, anything backend

---

## Task 1 — Vehicle silhouette SVG library ✅ Done

**File to create:** `components/rides/vehicle-silhouettes.ts`

**What it exports:**
```typescript
export type VehicleType = 'sedan' | 'coupe' | 'hatchback' | 'suv' | 'minivan' | 'van' | 'truck'

export type Silhouette = {
  viewBox: string         // e.g. "0 0 100 240"
  bodyPath: string        // main outer body outline (SVG path d=)
  windshieldPath: string  // front glass area
  rearWindowPath: string  // rear glass area
  doorLines: string[]     // horizontal SVG line elements (as path d= strings) separating seat rows
  wheelWells: string[]    // 4 small arc/rect paths at corners
  steeringWheelCx: number // center x of steering wheel circle
  steeringWheelCy: number // center y
  // Interior bounding box — used by SeatMap to place seat buttons
  interiorTop: number     // y% where first seat row starts
  interiorBottom: number  // y% where last seat row ends
  interiorLeft: number    // x% of left seat column edge
  interiorRight: number   // x% of right seat column edge
}

export const SILHOUETTES: Record<VehicleType, Silhouette>
```

**Visual design per type (all viewBox 0 0 100 240, top = front of car):**

| Type | Key visual features |
|------|-------------------|
| sedan | Classic 3-box. Tapered hood and trunk. Two windshield/rear-window glass panes. Door line between row 0 and row 1. |
| coupe | Like sedan but shorter (viewBox 0 0 100 210), sleeker tapering rear, single door line. |
| hatchback | Like sedan but rear is more upright — rear window merges into the trunk, making the car shorter. |
| suv | Wider, boxier, taller apparent roof line. Squared-off front and rear. Bigger wheel wells. |
| minivan | Very wide and rectangular. Flat front. Implied sliding door line on each side wall. Two door lines (3 seat rows). |
| van | Near-rectangle. Commercial. Virtually no hood. Flat front bumper. Three door lines (4 rows). |
| truck | Two distinct sections: cab (front ~45%) with glass, then an open bed (rear ~55%) with just a tailgate line. |

**Acceptance:** File exports `SILHOUETTES` with all 7 entries. No runtime errors when imported.

**Prompt to run this task:**
> "Read `docs/superpowers/plans/seat-map-redesign.md`. Implement Task 1 only: create `components/rides/vehicle-silhouettes.ts` with all 7 vehicle silhouette SVG path definitions. Do not touch any other files."

---

## Task 2 — Redesign the SeatMap component ✅ Done

**File to modify:** `components/rides/seat-map.tsx`

**What changes:**

1. **New prop:** `vehicleType?: VehicleType` (default: `'sedan'`). Import from vehicle-silhouettes.ts.

2. **SVG silhouette layer:** Replace the current hardcoded `<rect>` shapes with the dynamic silhouette from `SILHOUETTES[vehicleType]`. Render:
   - Body outline path (stroke only, no fill, color: `hsl(var(--border))`)
   - Windshield + rear window (very subtle fill: `hsl(var(--muted) / 0.3)`, same stroke)
   - Wheel wells (stroke only, slightly dimmer)
   - Door lines (dashed or thin solid, `hsl(var(--border))` at 40% opacity)
   - Steering wheel (small filled circle, `hsl(var(--foreground) / 0.6)`, radius ~4px)

3. **Seat shape:** Change from `rounded-full` (circle) to rounded rectangle. Use fixed px size of `28×22px`. Apply `rounded-md` (border-radius ~4px). This matches the airline reference.

4. **Seat positioning:** Instead of using `seat.x` / `seat.y` percentages from seat-templates, compute from `seat.row` and `seat.position`:
   - Use the silhouette's `interiorTop`, `interiorBottom`, `interiorLeft`, `interiorRight` bounds
   - Row spacing: divide interior height evenly across total row count
   - Column spacing: divide interior width evenly across seats-in-that-row
   - This makes seats always fit naturally inside the silhouette regardless of vehicle type

5. **Content inside seat:**
   - Driver: steering wheel icon `⊙` or `▲` (keep current)
   - Selected: `✓`
   - Available/reserved/occupied: empty (color alone communicates status)

6. **Colors stay the same** (driver=white, available=green, reserved=yellow, occupied=zinc, selected=white)

7. **Container:** Change aspect ratio to match each silhouette's viewBox proportions. Keep `max-w-[200px] mx-auto`.

**Existing tests must still pass** — they test aria-labels and click behavior, not visual styling.

**Acceptance:** `npm run test:run components/rides/__tests__/seat-map.test.tsx` passes. Visual: seats sit clearly inside the car outline with no overlap.

**Prompt to run this task:**
> "Read `docs/superpowers/plans/seat-map-redesign.md`. Implement Task 2 only: redesign `components/rides/seat-map.tsx` to use the vehicle silhouettes from Task 1. Compute seat positions from row/position + silhouette interior bounds. Change seat shape to rounded rectangle. Keep all tests passing."

---

## Task 3 — Wire vehicleType through all callers ✅ Done

**4 touch points — all small changes:**

### 3a. `components/rides/ride-application-form.tsx`
- Add `vehicleType: string` to the `Props.ride` object (alongside existing fields)
- Pass it to `<SeatMap vehicleType={ride.vehicleType} ... />`

### 3b. `app/(app)/rides/[id]/page.tsx`
- `vehicle.type` is already fetched (line 30: `vehicles!vehicle_id(make, model, year, color, type, capacity)`)
- Pass it into `<RideApplicationForm ride={{ ..., vehicleType: vehicle?.type ?? 'sedan' }} />`

### 3c. `components/rides/create-ride-wizard.tsx` — Step 2 vehicle preview
- Line 166: `<SeatMap seats={v.seat_template} readOnly />` → add `vehicleType={v.type}`
- `WizardVehicle` type already has `type: string` — no type changes needed

### 3d. `components/rides/create-ride-wizard.tsx` — Step 4 review
- Line 279: `<SeatMap seats={vehicle.seat_template} readOnly />` → add `vehicleType={vehicle.type}`

**Acceptance:** `npm run build` passes with zero TypeScript errors. All 4 SeatMap usages now receive vehicleType.

**Prompt to run this task:**
> "Read `docs/superpowers/plans/seat-map-redesign.md`. Implement Task 3 only: wire the `vehicleType` prop through all 4 SeatMap callers — RideApplicationForm, both usages in CreateRideWizard, and the rides/[id] page."

---

## Suggested prompt order

Run these one at a time, confirm each works before moving to the next:

1. > "Read `docs/superpowers/plans/seat-map-redesign.md`. Implement Task 1 only: create `components/rides/vehicle-silhouettes.ts`."

2. > "Read `docs/superpowers/plans/seat-map-redesign.md`. Implement Task 2 only: redesign `components/rides/seat-map.tsx` using the silhouettes from Task 1."

3. > "Read `docs/superpowers/plans/seat-map-redesign.md`. Implement Task 3 only: wire vehicleType through all callers."

After all 3: `npm run test:run && npm run build` — both must be green.
