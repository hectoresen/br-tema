// Script to filter + simplify Spanish provinces GeoJSON → Galicia provinces
// Run once: node scripts/build-provinces-geojson.js
// Requires: spain-provinces.tmp.geojson in project root (temp file, gitignored)

const fs = require('fs')
const path = require('path')

const GALICIA_PROVINCE_NAMES = ['A Coruña', 'Lugo', 'Ourense', 'Pontevedra']

const PROVINCE_IDS = {
  'A Coruña': 'corunha',
  'Lugo': 'lugo',
  'Ourense': 'ourense',
  'Pontevedra': 'pontevedra',
}

/**
 * Ramer-Douglas-Peucker simplification for a polygon ring.
 * tolerance in degrees (~0.001° ≈ 100m at this latitude, good for province outlines)
 */
function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd[0] - lineStart[0]
  const dy = lineEnd[1] - lineStart[1]
  const mag = Math.sqrt(dx * dx + dy * dy)
  if (mag === 0) return Math.sqrt((point[0] - lineStart[0]) ** 2 + (point[1] - lineStart[1]) ** 2)
  return Math.abs(dy * point[0] - dx * point[1] + lineEnd[0] * lineStart[1] - lineEnd[1] * lineStart[0]) / mag
}

function rdp(points, tolerance) {
  if (points.length <= 2) return points
  let maxDist = 0
  let maxIdx = 0
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], points[0], points[points.length - 1])
    if (d > maxDist) { maxDist = d; maxIdx = i }
  }
  if (maxDist > tolerance) {
    const left = rdp(points.slice(0, maxIdx + 1), tolerance)
    const right = rdp(points.slice(maxIdx), tolerance)
    return [...left.slice(0, -1), ...right]
  }
  return [points[0], points[points.length - 1]]
}

function simplifyRing(ring, tolerance) {
  const simplified = rdp(ring, tolerance)
  // Ensure ring is closed
  if (simplified.length < 4) return ring // too few points after simplification, keep original
  const first = simplified[0], last = simplified[simplified.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) simplified.push(simplified[0])
  return simplified
}

function simplifyGeometry(geometry, tolerance) {
  // For MultiPolygon, also drop sub-polygons smaller than minRingArea (filter tiny islands)
  const minPoints = 4
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates.map(ring => simplifyRing(ring, tolerance)).filter(r => r.length >= minPoints)
    return { ...geometry, coordinates: rings.length ? rings : geometry.coordinates }
  }
  if (geometry.type === 'MultiPolygon') {
    // Keep only the largest polygon + any with > 100 source points (mainland + major peninsulas)
    const simplified = geometry.coordinates
      .filter(poly => poly[0].length > 50) // drop tiny islands before simplifying
      .map(poly => poly.map(ring => simplifyRing(ring, tolerance)).filter(r => r.length >= minPoints))
      .filter(poly => poly.length > 0)
    return { ...geometry, coordinates: simplified.length ? simplified : geometry.coordinates }
  }
  return geometry
}

const src = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'spain-provinces.tmp.geojson'), 'utf8'))

const galiciaFeatures = src.features
  .filter(f => GALICIA_PROVINCE_NAMES.includes(f.properties.name))
  .map(f => ({
    type: 'Feature',
    properties: {
      id: PROVINCE_IDS[f.properties.name],
      name: f.properties.name,
      nameGl: { 'A Coruña': 'A Coruña', Lugo: 'Lugo', Ourense: 'Ourense', Pontevedra: 'Pontevedra' }[f.properties.name],
    },
    geometry: simplifyGeometry(f.geometry, 0.05),
  }))

const output = { type: 'FeatureCollection', features: galiciaFeatures }
const outPath = path.join(__dirname, '..', 'src', 'data', 'galicia-provinces.geojson')
fs.writeFileSync(outPath, JSON.stringify(output))

const originalSize = galiciaFeatures.reduce((s, f) => s + JSON.stringify(f.geometry).length, 0)
const finalSize = JSON.stringify(output).length
console.log(`✓ galicia-provinces.geojson — ${galiciaFeatures.length} provinces — ${(finalSize / 1024).toFixed(1)} KB`)
