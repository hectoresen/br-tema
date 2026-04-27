export interface Concello {
  /** INE municipality code, e.g. "15078" */
  id: string
  /** Display name (Spanish), e.g. "Santiago de Compostela" */
  name: string
  /** Display name in Galician */
  nameGl: string
  provinceId: 'corunha' | 'lugo' | 'ourense' | 'pontevedra'
  lat: number
  lon: number
}
