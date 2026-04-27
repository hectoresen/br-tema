import { describe, it, expect } from 'vitest'
import type { DayForecast, SlotForecast, TimeSlot } from '../types/forecast'

describe('DayForecast type shape', () => {
  it('SlotForecast contains all required fields', () => {
    const slot: SlotForecast = {
      slot: 'morning',
      weatherCode: 0,
      temperature: { min: 10, max: 18, current: 15 },
      precipitation: { value: 0, probability: 5 },
      wind: { speed: 12, direction: 270 },
      humidity: 65,
      cloudCover: 20,
    }
    expect(slot.slot).toBe<TimeSlot>('morning')
    expect(slot.temperature.min).toBeLessThanOrEqual(slot.temperature.max)
    expect(slot.precipitation.probability).toBeGreaterThanOrEqual(0)
    expect(slot.precipitation.probability).toBeLessThanOrEqual(100)
    expect(slot.cloudCover).toBeGreaterThanOrEqual(0)
    expect(slot.cloudCover).toBeLessThanOrEqual(100)
    expect(slot.humidity).toBeGreaterThanOrEqual(0)
    expect(slot.humidity).toBeLessThanOrEqual(100)
  })

  it('DayForecast has morning, afternoon and night slots', () => {
    const makeSlot = (s: TimeSlot): SlotForecast => ({
      slot: s,
      weatherCode: 0,
      temperature: { min: 8, max: 20, current: null },
      precipitation: { value: 0, probability: 0 },
      wind: { speed: 5, direction: 180 },
      humidity: 70,
      cloudCover: 10,
    })

    const day: DayForecast = {
      date: '2026-04-27',
      morning: makeSlot('morning'),
      afternoon: makeSlot('afternoon'),
      night: makeSlot('night'),
    }

    expect(day.morning.slot).toBe('morning')
    expect(day.afternoon.slot).toBe('afternoon')
    expect(day.night.slot).toBe('night')
    expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('partial slot flag is optional and defaults to undefined', () => {
    const slot: SlotForecast = {
      slot: 'night',
      weatherCode: 61,
      temperature: { min: 12, max: 12, current: 12 },
      precipitation: { value: 3.2, probability: 80 },
      wind: { speed: 25, direction: 315 },
      humidity: 90,
      cloudCover: 95,
    }
    expect(slot.partial).toBeUndefined()
  })
})
