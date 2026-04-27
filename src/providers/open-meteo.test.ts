import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OpenMeteoProvider } from './open-meteo'

// ---------------------------------------------------------------------------
// Helpers to build minimal Open-Meteo-shaped payloads
// ---------------------------------------------------------------------------

/** Generate an array of 24 * days hourly time strings in Open-Meteo local format */
function makeTimes(startDate: string, days: number): string[] {
  const times: string[] = []
  for (let d = 0; d < days; d++) {
    const base = new Date(startDate + 'T00:00:00')
    base.setDate(base.getDate() + d)
    const yyyy = base.toISOString().slice(0, 10)
    for (let h = 0; h < 24; h++) {
      times.push(`${yyyy}T${String(h).padStart(2, '0')}:00`)
    }
  }
  return times
}

function makeHourly(times: string[], overrides: Partial<{
  temperature_2m: number[]
  precipitation: number[]
  precipitation_probability: number[]
  windspeed_10m: number[]
  winddirection_10m: number[]
  relativehumidity_2m: number[]
  cloudcover: number[]
  weathercode: number[]
}> = {}) {
  const n = times.length
  return {
    time: times,
    temperature_2m: overrides.temperature_2m ?? new Array(n).fill(15),
    precipitation: overrides.precipitation ?? new Array(n).fill(0),
    precipitation_probability: overrides.precipitation_probability ?? new Array(n).fill(0),
    windspeed_10m: overrides.windspeed_10m ?? new Array(n).fill(20),
    winddirection_10m: overrides.winddirection_10m ?? new Array(n).fill(180),
    relativehumidity_2m: overrides.relativehumidity_2m ?? new Array(n).fill(60),
    cloudcover: overrides.cloudcover ?? new Array(n).fill(30),
    weathercode: overrides.weathercode ?? new Array(n).fill(0),
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OpenMeteoProvider', () => {
  const provider = new OpenMeteoProvider()

  describe('getForecast (mocked fetch)', () => {
    beforeEach(() => {
      const times = makeTimes('2024-06-01', 3)
      const hourly = makeHourly(times, {
        temperature_2m: times.map((_, i) => 10 + (i % 10)),
        cloudcover: times.map((_, i) => (i % 24 < 8 ? 10 : i % 24 < 16 ? 50 : 80)),
        precipitation_probability: times.map(() => 20),
      })
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ hourly }),
      }))
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('returns one DayForecast per requested day', async () => {
      const result = await provider.getForecast(42.73, -7.87, 3)
      expect(result).toHaveLength(3)
    })

    it('each DayForecast has morning, afternoon, night slots', async () => {
      const result = await provider.getForecast(42.73, -7.87, 1)
      expect(result[0]).toHaveProperty('morning')
      expect(result[0]).toHaveProperty('afternoon')
      expect(result[0]).toHaveProperty('night')
    })

    it('slot names are correct', async () => {
      const result = await provider.getForecast(42.73, -7.87, 1)
      expect(result[0].morning.slot).toBe('morning')
      expect(result[0].afternoon.slot).toBe('afternoon')
      expect(result[0].night.slot).toBe('night')
    })

    it('temperature min ≤ max', async () => {
      const result = await provider.getForecast(42.73, -7.87, 1)
      for (const day of result) {
        for (const slot of [day.morning, day.afternoon, day.night]) {
          expect(slot.temperature.min).toBeLessThanOrEqual(slot.temperature.max)
        }
      }
    })

    it('precipitation probability is 0–100', async () => {
      const result = await provider.getForecast(42.73, -7.87, 1)
      for (const day of result) {
        for (const slot of [day.morning, day.afternoon, day.night]) {
          expect(slot.precipitation.probability).toBeGreaterThanOrEqual(0)
          expect(slot.precipitation.probability).toBeLessThanOrEqual(100)
        }
      }
    })

    it('date strings are YYYY-MM-DD format', async () => {
      const result = await provider.getForecast(42.73, -7.87, 2)
      for (const day of result) {
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
    })

    it('passes correct URL parameters to fetch', async () => {
      await provider.getForecast(42.73, -7.87, 3)
      const fetchMock = vi.mocked(fetch)
      const url = fetchMock.mock.calls[0][0] as string
      expect(url).toContain('latitude=42.73')
      expect(url).toContain('longitude=-7.87')
      expect(url).toContain('forecast_days=3')
      expect(url).toContain('timezone=Europe%2FMadrid')
      expect(url).toContain('windspeed_unit=kmh')
    })
  })

  describe('getProvinceForecast', () => {
    beforeEach(() => {
      const times = makeTimes('2024-06-01', 1)
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ hourly: makeHourly(times) }),
      }))
    })

    afterEach(() => vi.unstubAllGlobals())

    it('resolves known province IDs without error', async () => {
      for (const id of ['corunha', 'lugo', 'ourense', 'pontevedra']) {
        await expect(provider.getProvinceForecast(id, 1)).resolves.toBeDefined()
      }
    })

    it('throws for unknown province ID', async () => {
      await expect(provider.getProvinceForecast('unknown', 1)).rejects.toThrow('unknown province')
    })
  })

  describe('getAlerts', () => {
    it('returns an array (fallback to mock-alerts.json)', async () => {
      const alerts = await provider.getAlerts()
      expect(Array.isArray(alerts)).toBe(true)
    })

    it('each alert has required fields', async () => {
      const alerts = await provider.getAlerts()
      for (const a of alerts) {
        expect(a).toHaveProperty('id')
        expect(a).toHaveProperty('severity')
        expect(a).toHaveProperty('phenomenon')
        expect(a).toHaveProperty('provinceIds')
        expect(a).toHaveProperty('startTime')
        expect(a).toHaveProperty('endTime')
      }
    })
  })

  describe('error handling', () => {
    it('throws on HTTP error response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      }))
      await expect(provider.getForecast(42.73, -7.87, 1)).rejects.toThrow('HTTP 429')
      vi.unstubAllGlobals()
    })

    it('throws on network failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
      await expect(provider.getForecast(42.73, -7.87, 1)).rejects.toThrow('Failed to fetch')
      vi.unstubAllGlobals()
    })

    it('throws when response is missing hourly field', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ error: true, reason: 'Bad parameter' }),
      }))
      await expect(provider.getForecast(42.73, -7.87, 1)).rejects.toThrow('missing hourly')
      vi.unstubAllGlobals()
    })
  })
})
