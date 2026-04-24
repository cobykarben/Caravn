import { describe, it, expect } from 'vitest'
import { generateSeatTemplate, seatMapToRecord, seatRecordToArray } from '../seat-templates'

describe('generateSeatTemplate', () => {
  it('returns the correct number of seats for a sedan with capacity 5', () => {
    const seats = generateSeatTemplate('sedan', 5)
    expect(seats).toHaveLength(5)
  })

  it('marks the first seat as the driver', () => {
    const seats = generateSeatTemplate('sedan', 5)
    const driver = seats.find(s => s.isDriver)
    expect(driver).toBeDefined()
    expect(driver?.status).toBe('driver')
    expect(driver?.label).toBe('Driver')
  })

  it('returns correct count for an SUV trimmed to 7 seats', () => {
    const seats = generateSeatTemplate('suv', 7)
    expect(seats).toHaveLength(7)
  })

  it('assigns unique ids to every seat', () => {
    const seats = generateSeatTemplate('minivan', 7)
    const ids = seats.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('seatMapToRecord', () => {
  it('converts seat array to a record keyed by seat id', () => {
    const seats = generateSeatTemplate('sedan', 5)
    const record = seatMapToRecord(seats)
    expect(Object.keys(record)).toHaveLength(5)
    seats.forEach(seat => {
      expect(record[seat.id]).toEqual(seat)
    })
  })
})

describe('seatRecordToArray', () => {
  it('round-trips through seatMapToRecord preserving row/position order', () => {
    const original = generateSeatTemplate('sedan', 5)
    const record = seatMapToRecord(original)
    const result = seatRecordToArray(record)
    expect(result.map(s => s.id)).toEqual(original.map(s => s.id))
  })
})
