/**
 * Canonical slot definitions.
 *
 * Mañana  : 06:00–13:59 (local time, day N)
 * Tarde   : 14:00–20:59 (local time, day N)
 * Noche   : 21:00–23:59 (day N) + 00:00–05:59 (day N+1)
 *
 * IMPORTANT: all timestamps from MeteoSIX include an explicit UTC offset
 * (+01:00 CET / +02:00 CEST). Always parse via `new Date(isoString)` and
 * compare local hours using Europe/Madrid timezone — never assume UTC+1 fixed.
 */
export type TimeSlot = 'morning' | 'afternoon' | 'night'

export interface SlotForecast {
  slot: TimeSlot
  /** Whether this slot was built from partial data (degraded gracefully) */
  partial?: boolean
  weatherCode: number
  temperature: {
    min: number
    max: number
    /** Closest value to the current instant; null when slot is in the future */
    current: number | null
  }
  precipitation: {
    /** Accumulated precipitation in l/m² over the slot */
    value: number
    /** 0–100 */
    probability: number
  }
  wind: {
    /** km/h, slot average */
    speed: number
    /** Degrees 0–360, slot mode */
    direction: number
  }
  /** 0–100 */
  humidity: number
  /** 0–100; direct from MeteoSIX cloud_area_fraction, or derived for other providers */
  cloudCover: number
}

export interface DayForecast {
  /** ISO date string YYYY-MM-DD, local date (Galicia) */
  date: string
  morning: SlotForecast
  afternoon: SlotForecast
  night: SlotForecast
}
