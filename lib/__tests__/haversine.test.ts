import { describe, it, expect } from 'vitest'
import { haversineDistance, isWithinRadius } from '../haversine'

describe('haversineDistance', () => {
  it('returns 0 for same coordinates', () => {
    expect(haversineDistance(41.8781, -87.6298, 41.8781, -87.6298)).toBe(0)
  })

  it('calculates NYC to LA as roughly 2445 miles', () => {
    const dist = haversineDistance(40.7128, -74.006, 34.0522, -118.2437)
    expect(dist).toBeGreaterThan(2440)
    expect(dist).toBeLessThan(2460)
  })

  it('calculates short city distance correctly', () => {
    // Chicago Loop to Wrigley Field ≈ 4.8 miles straight-line
    const dist = haversineDistance(41.8827, -87.6233, 41.9484, -87.6553)
    expect(dist).toBeGreaterThan(4.5)
    expect(dist).toBeLessThan(5.5)
  })
})

describe('isWithinRadius', () => {
  it('returns true when point is within radius', () => {
    // 1 mile radius, ~0.5 mile apart
    expect(isWithinRadius(41.8781, -87.6298, 41.8853, -87.6298, 1)).toBe(true)
  })

  it('returns false when point is outside radius', () => {
    expect(isWithinRadius(41.8781, -87.6298, 41.9484, -87.6553, 2)).toBe(false)
  })
})
