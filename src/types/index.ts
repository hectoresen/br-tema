// Re-export all domain types from a single entry point
export type { DayForecast, SlotForecast, TimeSlot } from './forecast'
export type { Alert, AlertSeverity, AlertPhenomenon } from './alert'
export type { WeatherIcon, WeatherIconId } from './weather-icon'
export type { Concello } from './concello'
export type { Locale } from './locale'
export { SUPPORTED_LOCALES, MVP_LOCALES, DEFAULT_LOCALE } from './locale'
