import type { SlotForecast } from '../types/forecast'
import type { WeatherIconId } from '../types/weather-icon'

/**
 * Resolve the best semantic icon ID for a forecast slot.
 *
 * Priority chain (highest wins):
 *   1. Thunderstorm  — weatherCode 2xx (WMO) OR lightning in WMO group 17/28/29
 *   2. Snow          — weatherCode 3xx/7x (WMO heavy-precipitation snow range) OR temp < 2°C + precip
 *   3. Rain-heavy    — precipitation.value ≥ 4 mm OR (probability ≥ 70% AND cloudCover ≥ 75)
 *   4. Rain-light    — precipitation.probability ≥ 40% OR precipitation.value ≥ 0.5 mm
 *   5. Fog           — weatherCode 4x (WMO) OR weatherCode 45/48
 *   6. Cloudy        — cloudCover ≥ 75%
 *   7. Partly cloudy — cloudCover ≥ 35%
 *   8. Sunny         — default
 *
 * WMO weather interpretation codes (used by Open-Meteo):
 *   0        Clear sky
 *   1–3      Mainly clear, partly cloudy, overcast
 *   45, 48   Fog and rime fog
 *   51–57    Drizzle
 *   61–67    Rain
 *   71–77    Snow
 *   80–82    Rain showers
 *   85–86    Snow showers
 *   95       Thunderstorm
 *   96, 99   Thunderstorm with slight/heavy hail
 *
 * MeteoSIX uses a different sky_state field (see providers/meteosix-codes.ts),
 * which is already mapped to WMO-like codes before reaching here.
 */
export function getWeatherIcon(forecast: SlotForecast): WeatherIconId {
  const { weatherCode, precipitation, cloudCover, temperature } = forecast

  // 1. Thunderstorm
  if (isThunderstorm(weatherCode)) return 'thunderstorm'

  // 2. Snow
  if (isSnow(weatherCode, temperature.min, precipitation)) return 'snow'

  // 3. Rain heavy
  if (isRainHeavy(weatherCode, precipitation, cloudCover)) return 'rain-heavy'

  // 4. Rain light
  if (isRainLight(weatherCode, precipitation)) return 'rain-light'

  // 5. Fog
  if (isFog(weatherCode)) return 'fog'

  // 6. Cloudy
  if (cloudCover >= 75) return 'cloudy'

  // 7. Partly cloudy
  if (cloudCover >= 35) return 'partly-cloudy'

  return 'sunny'
}

function isThunderstorm(code: number): boolean {
  return (code >= 200 && code < 300) || code === 95 || code === 96 || code === 99
}

function isSnow(
  code: number,
  tempMin: number,
  precipitation: SlotForecast['precipitation']
): boolean {
  // Explicit snow codes
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return true
  // Below-freezing + precipitation
  if (tempMin < 2 && precipitation.value >= 0.5) return true
  return false
}

function isRainHeavy(
  code: number,
  precipitation: SlotForecast['precipitation'],
  cloudCover: number
): boolean {
  if (code === 65 || code === 67 || code === 82) return true
  if (precipitation.value >= 4) return true
  if (precipitation.probability >= 70 && cloudCover >= 75) return true
  return false
}

function isRainLight(
  code: number,
  precipitation: SlotForecast['precipitation']
): boolean {
  // WMO: drizzle (51-57), light rain (61, 63), moderate rain (62-64), rain showers (80-81)
  if ((code >= 51 && code <= 64) || (code >= 80 && code <= 81)) return true
  if (precipitation.probability >= 40) return true
  if (precipitation.value >= 0.5) return true
  return false
}

function isFog(code: number): boolean {
  return code === 45 || code === 48
}
