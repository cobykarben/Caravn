import { describe, it, expect } from 'vitest'
import { calculateCostShare } from '../cost-split'

describe('calculateCostShare', () => {
  it('returns 0 for free rides', () => {
    expect(calculateCostShare(0, 3)).toBe(0)
  })

  it('splits cost equally including driver (1 rider = 2-way split)', () => {
    expect(calculateCostShare(60, 1)).toBe(30)
  })

  it('splits cost equally including driver (3 riders = 4-way split)', () => {
    expect(calculateCostShare(60, 3)).toBe(15)
  })

  it('rounds to 2 decimal places', () => {
    // $10 / 3 people = $3.33
    expect(calculateCostShare(10, 2)).toBe(3.33)
  })

  it('returns 0 when no riders accepted yet', () => {
    expect(calculateCostShare(60, 0)).toBe(0)
  })
})
