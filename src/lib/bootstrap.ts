/**
 * Bootstrap — called once during app startup (from main.ts).
 *
 * Loads forecast data for all 4 Galician provinces in parallel (morning slot,
 * day 0) so the map has data to show immediately without waiting for user
 * interaction. Also triggers the first alerts load.
 *
 * Does NOT block the app mount — data arrives asynchronously and the map
 * shows a spinner/placeholder until the stores populate.
 */

import { forecastData } from '../stores/forecast'
import { alerts } from '../stores/alerts'

const GALICIA_PROVINCES = ['corunha', 'lugo', 'ourense', 'pontevedra'] as const

export function bootstrapApp(): void {
  // Fire-and-forget: components react via store subscriptions
  Promise.all(
    GALICIA_PROVINCES.map((id) => forecastData.loadProvince(id, 4))
  ).catch(() => {
    // Individual errors are captured inside the store per province;
    // this catch handles any unexpected rejection that escapes.
  })

  alerts.load().catch(() => {
    // Errors are captured inside alerts store with fallback to mock data.
  })
}
