/**
 * Canonical geographic centres for each Galician province.
 * Used by OpenMeteoProvider (and future providers) to resolve
 * getProvinceForecast() calls without a GeoJSON dependency.
 *
 * Coordinates are WGS84 centroids chosen to represent the most
 * populated / meteorologically representative point of each province.
 */
export const PROVINCE_CENTRES: Record<string, { lat: number; lon: number }> = {
  corunha:    { lat: 43.3713, lon: -8.3959 },
  lugo:       { lat: 43.0097, lon: -7.5568 },
  ourense:    { lat: 42.3365, lon: -7.8638 },
  pontevedra: { lat: 42.4329, lon: -8.6482 },
}
