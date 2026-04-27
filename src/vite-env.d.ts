/// <reference types="vite/client" />

declare module '*/concellos.json' {
  import type { Concello } from './types/concello'
  const data: Concello[]
  export default data
}

declare module '*/galicia-provinces.geojson' {
  import type { FeatureCollection } from 'geojson'
  const data: FeatureCollection
  export default data
}

declare module '*/galicia-concellos.geojson' {
  import type { FeatureCollection } from 'geojson'
  const data: FeatureCollection
  export default data
}

declare module '*/webcams.json' {
  interface Webcam {
    id: string
    name: string
    nameGl: string
    concelloId: string
    provinceId: string
    lat: number
    lon: number
    url: string | null
    source: string
    mock: boolean
  }
  const data: Webcam[]
  export default data
}

declare module '*/mock-alerts.json' {
  import type { Alert } from './types/alert'
  const data: Alert[]
  export default data
}
