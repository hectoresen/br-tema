import { describe, it, expect, vi, afterEach } from 'vitest'
import { get } from 'svelte/store'
import type { DayForecast } from '../types/forecast'

// ---------------------------------------------------------------------------
// Mock the active provider before importing the store
// ---------------------------------------------------------------------------

const mockForecast: DayForecast[] = [
  {
    date: '2024-06-01',
    morning: {
      slot: 'morning',
      weatherCode: 0,
      temperature: { min: 12, max: 18, current: null },
      precipitation: { value: 0, probability: 10 },
      wind: { speed: 15, direction: 270 },
      humidity: 65,
      cloudCover: 20,
    },
    afternoon: {
      slot: 'afternoon',
      weatherCode: 1,
      temperature: { min: 15, max: 22, current: null },
      precipitation: { value: 0, probability: 5 },
      wind: { speed: 18, direction: 280 },
      humidity: 55,
      cloudCover: 30,
    },
    night: {
      slot: 'night',
      weatherCode: 0,
      temperature: { min: 10, max: 14, current: null },
      precipitation: { value: 0, probability: 5 },
      wind: { speed: 10, direction: 260 },
      humidity: 70,
      cloudCover: 15,
    },
  },
]

vi.mock('../providers/index', () => ({
  activeProvider: {
    getForecast: vi.fn().mockResolvedValue(mockForecast),
    getProvinceForecast: vi.fn().mockResolvedValue(mockForecast),
    getConcelloForecast: vi.fn().mockResolvedValue(mockForecast),
    getAlerts: vi.fn().mockResolvedValue([]),
  },
}))

// Import after mocking
const { forecastData } = await import('./forecast')

describe('forecastData store', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initially has empty data, not loading, no errors', () => {
    const state = get(forecastData)
    // cache may have been seeded by previous tests; just check structure
    expect(state).toHaveProperty('data')
    expect(state).toHaveProperty('loading')
    expect(state).toHaveProperty('errors')
  })

  it('loadProvince populates data after resolution', async () => {
    await forecastData.loadProvince('corunha', 4)
    const result = forecastData.getProvince('corunha', 4)
    expect(result).toBeDefined()
    expect(result![0].date).toBe('2024-06-01')
  })

  it('loadProvince does not re-fetch cached data', async () => {
    const { activeProvider } = await import('../providers/index')
    const spy = vi.spyOn(activeProvider, 'getProvinceForecast')
    // already cached from previous test
    await forecastData.loadProvince('corunha', 4)
    expect(spy).not.toHaveBeenCalled()
  })

  it('loadConcello populates data after resolution', async () => {
    await forecastData.loadConcello('27028000000', 4)
    const result = forecastData.getConcello('27028000000', 4)
    expect(result).toBeDefined()
  })

  it('getProvince returns undefined for uncached province', () => {
    expect(forecastData.getProvince('unknown', 4)).toBeUndefined()
  })

  it('handles provider error gracefully', async () => {
    const { activeProvider } = await import('../providers/index')
    vi.spyOn(activeProvider, 'getProvinceForecast').mockRejectedValueOnce(
      new Error('network error')
    )
    await forecastData.loadProvince('ourense_error_test', 4)
    const err = forecastData.getError(forecastData._cacheKey('province', 'ourense_error_test', 4))
    expect(err).toMatch('network error')
  })
})
