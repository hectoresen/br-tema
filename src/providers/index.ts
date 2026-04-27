/**
 * Active weather provider registry.
 *
 * Swap the import and `activeProvider` export here to change the data source
 * without touching any other file. The provider must implement WeatherProvider.
 *
 * Current priority:
 *   MVP     → OpenMeteoProvider (no API key, CORS-open, global coverage)
 *   Post-MVP → AemetProvider   (official Spanish alerts, municipal forecasts)
 *   Post-MVP → MeteoSIXProvider (maximum Galician precision, cloud_area_fraction)
 */

import { OpenMeteoProvider } from './open-meteo'
import type { WeatherProvider } from './types'

export const activeProvider: WeatherProvider = new OpenMeteoProvider()
