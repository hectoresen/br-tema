/**
 * Semantic icon IDs. Components never reference SVG paths directly —
 * they use these IDs so the icon catalogue can be swapped without UI changes.
 */
export type WeatherIconId =
  | 'sunny'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'rain-light'
  | 'rain-heavy'
  | 'snow'
  | 'thunderstorm'

export interface WeatherIcon {
  id: WeatherIconId
  /** Accessible label key (i18n) */
  labelKey: string
}
