/**
 * Barrel export for all stores.
 * Import from here to avoid specifying individual store files in components.
 */

export {
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
  type MapLayer,
} from './ui'

export { forecastData } from './forecast'
export { alerts } from './alerts'
