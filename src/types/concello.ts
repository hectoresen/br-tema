export interface Concello {
  /** Unique slug, e.g. "lugo" */
  id: string
  /** Display name in Galician, e.g. "Lugo" */
  name: string
  provinceId: 'corunha' | 'lugo' | 'ourense' | 'pontevedra'
  lat: number
  lon: number
}
