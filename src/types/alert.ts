export type AlertSeverity = 'yellow' | 'orange' | 'red'
export type AlertPhenomenon =
  | 'wind'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'coast'
  | 'heat'
  | 'frost'
  | 'fog'
  | 'other'

export interface Alert {
  id: string
  severity: AlertSeverity
  phenomenon: AlertPhenomenon
  /** Province IDs this alert applies to, e.g. ["corunha","lugo"] */
  provinceIds: string[]
  /** ISO date range */
  startTime: string
  endTime: string
  /** Short description (translated) */
  description: string
}
