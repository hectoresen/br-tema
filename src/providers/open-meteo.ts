/**
 * Open-Meteo weather provider — MVP fallback.
 *
 * No API key required. CORS-open. Supports 7-day hourly forecasts.
 * Hourly data is grouped into three slots per day:
 *   morning   06:00–13:59  (local time, Europe/Madrid)
 *   afternoon 14:00–20:59
 *   night     21:00–05:59  (spans midnight; hours 21-23 belong to the same calendar day)
 *
 * Open-Meteo API docs: https://open-meteo.com/en/docs
 */

import type { DayForecast, SlotForecast, TimeSlot } from '../types/forecast'
import type { Alert } from '../types/alert'
import type { WeatherProvider } from './types'
import { PROVINCE_CENTRES } from '../config/provinces'
import mockAlerts from '../data/mock-alerts.json'

// ---------------------------------------------------------------------------
// Open-Meteo API types
// ---------------------------------------------------------------------------

interface OpenMeteoResponse {
  hourly: {
    time: string[]
    temperature_2m: number[]
    precipitation: number[]
    precipitation_probability: number[]
    windspeed_10m: number[]
    winddirection_10m: number[]
    relativehumidity_2m: number[]
    cloudcover: number[]
    weathercode: number[]
  }
}

// ---------------------------------------------------------------------------
// Slot boundary helpers (Europe/Madrid local hours)
// ---------------------------------------------------------------------------

const TZ = 'Europe/Madrid'

function localHour(isoString: string): number {
  // isoString from Open-Meteo is like "2024-06-01T14:00" (no timezone) and
  // represents local time in the requested timezone. We request
  // timezone=Europe/Madrid so all times are already local — parse directly.
  return parseInt(isoString.slice(11, 13), 10)
}

function localDate(isoString: string): string {
  // First 10 chars are YYYY-MM-DD in local time
  return isoString.slice(0, 10)
}

/**
 * Returns the slot a given local hour belongs to.
 * Night hours 00:00–05:59 belong to the night slot of the **previous** calendar day.
 * This is handled in groupByDay by using the date of hour 21:00 as the night date.
 */
function hourToSlot(hour: number): TimeSlot {
  if (hour >= 6 && hour <= 13) return 'morning'
  if (hour >= 14 && hour <= 20) return 'afternoon'
  return 'night'
}

// ---------------------------------------------------------------------------
// Data aggregation helpers
// ---------------------------------------------------------------------------

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function min(values: number[]): number {
  return values.length === 0 ? 0 : Math.min(...values)
}

function max(values: number[]): number {
  return values.length === 0 ? 0 : Math.max(...values)
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

/** Most frequent value (mode). Ties broken by highest value. */
function mode(values: number[]): number {
  if (values.length === 0) return 0
  const freq = new Map<number, number>()
  for (const v of values) freq.set(v, (freq.get(v) ?? 0) + 1)
  let best = values[0]
  let bestCount = 0
  for (const [v, count] of freq) {
    if (count > bestCount || (count === bestCount && v > best)) {
      best = v
      bestCount = count
    }
  }
  return best
}

// ---------------------------------------------------------------------------
// Hourly index → slot grouping
// ---------------------------------------------------------------------------

interface HourlyEntry {
  /** Local date YYYY-MM-DD */
  date: string
  slot: TimeSlot
  temperature: number
  precipitation: number
  precipitationProbability: number
  windspeed: number
  winddirection: number
  humidity: number
  cloudcover: number
  weathercode: number
}

function parseHourly(data: OpenMeteoResponse['hourly']): HourlyEntry[] {
  const entries: HourlyEntry[] = []
  for (let i = 0; i < data.time.length; i++) {
    const iso = data.time[i]
    const hour = localHour(iso)
    const slot = hourToSlot(hour)
    // Night hours 00:00–05:59 are attributed to the PREVIOUS calendar day's night slot.
    // We track them by storing the date they logically belong to.
    // Since Open-Meteo returns them under the next calendar day, we subtract one day.
    let date = localDate(iso)
    if (hour < 6) {
      const d = new Date(date + 'T00:00:00')
      d.setDate(d.getDate() - 1)
      date = d.toISOString().slice(0, 10)
    }
    entries.push({
      date,
      slot,
      temperature: data.temperature_2m[i],
      precipitation: data.precipitation[i],
      precipitationProbability: data.precipitation_probability[i],
      windspeed: data.windspeed_10m[i],
      winddirection: data.winddirection_10m[i],
      humidity: data.relativehumidity_2m[i],
      cloudcover: data.cloudcover[i],
      weathercode: data.weathercode[i],
    })
  }
  return entries
}

function buildSlot(
  slot: TimeSlot,
  entries: HourlyEntry[],
  nowIso: string
): SlotForecast {
  if (entries.length === 0) {
    // Partial slot — return zeroed data with partial flag
    return {
      slot,
      partial: true,
      weatherCode: 0,
      temperature: { min: 0, max: 0, current: null },
      precipitation: { value: 0, probability: 0 },
      wind: { speed: 0, direction: 0 },
      humidity: 0,
      cloudCover: 0,
    }
  }

  const temps = entries.map((e) => e.temperature)
  const now = new Date(nowIso).getTime()

  // current temp: entry whose time is closest to now (null if all in the future)
  let current: number | null = null
  let minDiff = Infinity
  for (const e of entries) {
    const diff = Math.abs(new Date(e.date + 'T12:00:00').getTime() - now)
    if (diff < minDiff) {
      minDiff = diff
      current = e.temperature
    }
  }
  // Only set current if the slot has already started
  const slotStartHour = slot === 'morning' ? 6 : slot === 'afternoon' ? 14 : 21
  const slotDate = new Date(entries[0].date + 'T' + String(slotStartHour).padStart(2, '0') + ':00:00')
  if (slotDate.getTime() > now) current = null

  return {
    slot,
    weatherCode: mode(entries.map((e) => e.weathercode)),
    temperature: {
      min: Math.round(min(temps) * 10) / 10,
      max: Math.round(max(temps) * 10) / 10,
      current: current !== null ? Math.round(current * 10) / 10 : null,
    },
    precipitation: {
      value: Math.round(sum(entries.map((e) => e.precipitation)) * 10) / 10,
      probability: Math.round(avg(entries.map((e) => e.precipitationProbability))),
    },
    wind: {
      speed: Math.round(avg(entries.map((e) => e.windspeed))),
      direction: Math.round(avg(entries.map((e) => e.winddirection))),
    },
    humidity: Math.round(avg(entries.map((e) => e.humidity))),
    cloudCover: Math.round(avg(entries.map((e) => e.cloudcover))),
  }
}

function buildDayForecasts(data: OpenMeteoResponse['hourly'], days: number): DayForecast[] {
  const entries = parseHourly(data)
  const nowIso = new Date().toISOString()

  // Group entries by date+slot
  const byDateSlot = new Map<string, HourlyEntry[]>()
  for (const e of entries) {
    const key = `${e.date}__${e.slot}`
    if (!byDateSlot.has(key)) byDateSlot.set(key, [])
    byDateSlot.get(key)!.push(e)
  }

  // Collect unique dates in order
  const dateSet = new Set<string>()
  for (const e of entries) dateSet.add(e.date)
  const dates = Array.from(dateSet).sort().slice(0, days)

  return dates.map((date): DayForecast => ({
    date,
    morning: buildSlot('morning', byDateSlot.get(`${date}__morning`) ?? [], nowIso),
    afternoon: buildSlot('afternoon', byDateSlot.get(`${date}__afternoon`) ?? [], nowIso),
    night: buildSlot('night', byDateSlot.get(`${date}__night`) ?? [], nowIso),
  }))
}

// ---------------------------------------------------------------------------
// Network fetch with error handling
// ---------------------------------------------------------------------------

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast'
const HOURLY_PARAMS = [
  'temperature_2m',
  'precipitation',
  'precipitation_probability',
  'windspeed_10m',
  'winddirection_10m',
  'relativehumidity_2m',
  'cloudcover',
  'weathercode',
].join(',')

async function fetchForecast(lat: number, lon: number, days: number): Promise<DayForecast[]> {
  const url = new URL(OPEN_METEO_BASE)
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('hourly', HOURLY_PARAMS)
  url.searchParams.set('timezone', TZ)
  url.searchParams.set('forecast_days', String(Math.min(days, 7)))
  url.searchParams.set('windspeed_unit', 'kmh')

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Open-Meteo HTTP ${response.status}: ${response.statusText}`)
  }

  const json = (await response.json()) as OpenMeteoResponse
  if (!json.hourly) {
    throw new Error('Open-Meteo: unexpected response shape (missing hourly)')
  }

  return buildDayForecasts(json.hourly, days)
}

// ---------------------------------------------------------------------------
// Concello lookup
// ---------------------------------------------------------------------------

let concelloCache: Array<{ id: string; lat: number; lon: number }> | null = null

async function getConcelloCoords(concelloId: string): Promise<{ lat: number; lon: number }> {
  if (!concelloCache) {
    const mod = await import('../data/concellos.json')
    concelloCache = mod.default as Array<{ id: string; lat: number; lon: number }>
  }
  const entry = concelloCache.find((c) => c.id === concelloId)
  if (!entry) throw new Error(`OpenMeteoProvider: unknown concello id "${concelloId}"`)
  return { lat: entry.lat, lon: entry.lon }
}

// ---------------------------------------------------------------------------
// OpenMeteoProvider implementation
// ---------------------------------------------------------------------------

export class OpenMeteoProvider implements WeatherProvider {
  async getForecast(lat: number, lon: number, days: number): Promise<DayForecast[]> {
    return fetchForecast(lat, lon, days)
  }

  async getProvinceForecast(provinceId: string, days: number): Promise<DayForecast[]> {
    const centre = PROVINCE_CENTRES[provinceId]
    if (!centre) throw new Error(`OpenMeteoProvider: unknown province "${provinceId}"`)
    return fetchForecast(centre.lat, centre.lon, days)
  }

  async getConcelloForecast(concelloId: string, days: number): Promise<DayForecast[]> {
    const { lat, lon } = await getConcelloCoords(concelloId)
    return fetchForecast(lat, lon, days)
  }

  async getAlerts(): Promise<Alert[]> {
    // Open-Meteo does not provide alerts. Return mock data as a stub.
    return mockAlerts as Alert[]
  }
}
