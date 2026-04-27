import { describe, it, expect } from 'vitest'
import { get } from 'svelte/store'
import {
  activeLayer,
  selectedDay,
  selectedTimeSlot,
  selectedProvince,
  selectedConcello,
  searchConcello,
  concellosGeoJSONLoaded,
  forecastDates,
  DEFAULT_SEARCH_CONCELLO,
  DAYS_AHEAD,
} from './ui'

describe('UI stores', () => {
  describe('activeLayer', () => {
    it('defaults to "general"', () => {
      expect(get(activeLayer)).toBe('general')
    })

    it('updates on set', () => {
      activeLayer.set('wind')
      expect(get(activeLayer)).toBe('wind')
      activeLayer.set('general')
    })
  })

  describe('selectedDay', () => {
    it('defaults to 0', () => {
      expect(get(selectedDay)).toBe(0)
    })

    it('clamps to valid range via consumer (stores do not clamp internally)', () => {
      selectedDay.set(3)
      expect(get(selectedDay)).toBe(3)
      selectedDay.set(0)
    })
  })

  describe('selectedTimeSlot', () => {
    it('defaults to "morning"', () => {
      expect(get(selectedTimeSlot)).toBe('morning')
    })
  })

  describe('selectedProvince', () => {
    it('defaults to null', () => {
      expect(get(selectedProvince)).toBeNull()
    })
  })

  describe('selectedConcello', () => {
    it('defaults to null', () => {
      expect(get(selectedConcello)).toBeNull()
    })
  })

  describe('searchConcello', () => {
    it('defaults to Lugo ID', () => {
      expect(get(searchConcello)).toBe(DEFAULT_SEARCH_CONCELLO)
      expect(DEFAULT_SEARCH_CONCELLO).toBe('27028000000')
    })
  })

  describe('concellosGeoJSONLoaded', () => {
    it('defaults to false', () => {
      expect(get(concellosGeoJSONLoaded)).toBe(false)
    })
  })

  describe('forecastDates', () => {
    it(`returns ${DAYS_AHEAD} dates`, () => {
      expect(get(forecastDates)).toHaveLength(DAYS_AHEAD)
    })

    it('each date matches YYYY-MM-DD', () => {
      for (const d of get(forecastDates)) {
        expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
    })

    it('first date is today (Europe/Madrid)', () => {
      const todayMadrid = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' })
      expect(get(forecastDates)[0]).toBe(todayMadrid)
    })

    it('dates are consecutive', () => {
      const dates = get(forecastDates)
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1])
        const curr = new Date(dates[i])
        expect(curr.getTime() - prev.getTime()).toBe(86400000)
      }
    })
  })
})
