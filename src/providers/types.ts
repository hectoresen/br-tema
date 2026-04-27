import type { DayForecast } from '../types/forecast'
import type { Alert } from '../types/alert'

export interface WeatherProvider {
  /**
   * Forecast for an arbitrary lat/lon point.
   * @param lat Latitude (WGS84)
   * @param lon Longitude (WGS84)
   * @param days Number of days to fetch (1–7)
   */
  getForecast(lat: number, lon: number, days: number): Promise<DayForecast[]>

  /**
   * Convenience wrapper using a province's canonical centre coordinates.
   * @param provinceId One of: "corunha" | "lugo" | "ourense" | "pontevedra"
   */
  getProvinceForecast(provinceId: string, days: number): Promise<DayForecast[]>

  /**
   * Forecast for a specific concello by its ID.
   * Implementations resolve the concello ID to coordinates internally.
   */
  getConcelloForecast(concelloId: string, days: number): Promise<DayForecast[]>

  /**
   * Optional: active weather alerts.
   * Providers that do not support alerts return undefined.
   */
  getAlerts?(): Promise<Alert[]>
}
