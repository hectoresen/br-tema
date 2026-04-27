/**
 * UI state stores.
 *
 * These are lightweight, synchronous stores that drive the map and UI.
 * All values survive locale changes but are NOT persisted to localStorage.
 */

import { writable, derived } from 'svelte/store'
import type { TimeSlot } from '../types/forecast'

// ---------------------------------------------------------------------------
// 8.1  activeLayer
// ---------------------------------------------------------------------------

export type MapLayer =
  | 'general'
  | 'wind'
  | 'precipitation'
  | 'temperature'
  | 'humidity'
  | 'storms'
  | 'webcams'
  | 'satellite'

export const activeLayer = writable<MapLayer>('general')

// ---------------------------------------------------------------------------
// 8.2  selectedDay  (0 = today, 1 = tomorrow, …, max 3)
// ---------------------------------------------------------------------------

export const DAYS_AHEAD = 4

export const selectedDay = writable<number>(0)

// ---------------------------------------------------------------------------
// 8.3  selectedTimeSlot
// ---------------------------------------------------------------------------

export const selectedTimeSlot = writable<TimeSlot>('morning')

// ---------------------------------------------------------------------------
// 8.4  selectedProvince  (province ID or null)
// ---------------------------------------------------------------------------

export const selectedProvince = writable<string | null>(null)

// ---------------------------------------------------------------------------
// 8.5  selectedConcello  (concello ID or null — null = home/map view)
// ---------------------------------------------------------------------------

export const selectedConcello = writable<string | null>(null)

// ---------------------------------------------------------------------------
// 8.6  searchConcello  (concello ID in the search card; default: Lugo)
// ---------------------------------------------------------------------------

export const DEFAULT_SEARCH_CONCELLO = '27028000000' // Lugo

export const searchConcello = writable<string>(DEFAULT_SEARCH_CONCELLO)

// ---------------------------------------------------------------------------
// 8.10 concellosGeoJSONLoaded
//       Set to true by Map.svelte after the 5.2 MB concellos GeoJSON finishes
//       loading. Blocks concello-level interactivity until ready.
// ---------------------------------------------------------------------------

export const concellosGeoJSONLoaded = writable<boolean>(false)

// ---------------------------------------------------------------------------
// Derived: dates array for current forecast window
// ---------------------------------------------------------------------------

/** ISO YYYY-MM-DD strings for today + 3 days (Europe/Madrid local date). */
export const forecastDates = derived(selectedDay, () => {
  const dates: string[] = []
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    dates.push(d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }))
  }
  return dates
})
