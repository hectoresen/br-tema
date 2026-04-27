import { describe, it, expect } from 'vitest'
import { MAP_STYLE_URL, GALICIA_CENTER, GALICIA_ZOOM } from '../config/map'

describe('Map config', () => {
  it('MAP_STYLE_URL points to OpenFreeMap', () => {
    expect(MAP_STYLE_URL).toContain('openfreemap.org')
  })

  it('GALICIA_CENTER is [lon, lat] format within Galicia bounding box', () => {
    const [lon, lat] = GALICIA_CENTER
    // Galicia bounding box approx: lon -9.3 to -6.7, lat 41.8 to 43.8
    expect(lon).toBeGreaterThan(-9.5)
    expect(lon).toBeLessThan(-6.5)
    expect(lat).toBeGreaterThan(41.5)
    expect(lat).toBeLessThan(44.0)
  })

  it('GALICIA_ZOOM shows the full region', () => {
    expect(GALICIA_ZOOM).toBeGreaterThanOrEqual(7)
    expect(GALICIA_ZOOM).toBeLessThanOrEqual(9)
  })
})
