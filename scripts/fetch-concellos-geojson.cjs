// Fetch Galicia concellos boundary GeoJSON from Overpass API
// Uses bbox query (avoids area-filter member-stripping) + two-part query:
//   .rels out body  → relations with member way refs
//   way(r.rels) out geom  → way geometry
// Then assembles polygon rings from outer ways per relation.
// Run: node scripts/fetch-concellos-geojson.cjs
const https = require('https')
const fs = require('fs')

// Galicia bounding box (generous margin)
const BBOX = '41.8,-9.4,43.9,-6.5'
const PROVINCE_MAP = { '15': 'corunha', '27': 'lugo', '32': 'ourense', '36': 'pontevedra' }

const query = `[out:json][timeout:300];
relation[admin_level=8][boundary=administrative](${BBOX})->.rels;
.rels out body;
way(r.rels);
out geom;`

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query)

console.log('Fetching concellos from Overpass (bbox + way geometry)...')
https.get(url, (res) => {
  const chunks = []
  res.on('data', (chunk) => { chunks.push(chunk) })
  res.on('end', () => {
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    console.log('Total elements:', data.elements.length)

    const relations = data.elements.filter(e => e.type === 'relation')
    const wayMap = new Map(
      data.elements
        .filter(e => e.type === 'way' && e.geometry)
        .map(e => [e.id, e.geometry.map(pt => [pt.lon, pt.lat])])
    )

    console.log('Relations:', relations.length, '— Ways with geometry:', wayMap.size)

    const features = relations
      .filter(rel => {
        const ineCode = rel.tags['ine:municipio'] || rel.tags['ref:ine']
        return ineCode && PROVINCE_MAP[ineCode.substring(0, 2)]
      })
      .map(rel => {
        const ineCode = rel.tags['ine:municipio'] || rel.tags['ref:ine']
        const provinceId = PROVINCE_MAP[ineCode.substring(0, 2)]

        const outerWayIds = (rel.members || [])
          .filter(m => m.type === 'way' && m.role === 'outer')
          .map(m => m.ref)

        const waySegments = outerWayIds.map(id => wayMap.get(id)).filter(Boolean)
        if (waySegments.length === 0) return null

        const rings = assembleRings(waySegments)
        if (rings.length === 0) return null

        let geometry
        if (rings.length === 1) {
          geometry = { type: 'Polygon', coordinates: rings }
        } else {
          geometry = { type: 'MultiPolygon', coordinates: rings.map(r => [r]) }
        }

        return {
          type: 'Feature',
          properties: {
            id: ineCode,
            name: rel.tags['name:es'] || rel.tags.name,
            nameGl: rel.tags['name:gl'] || rel.tags.name,
            provinceId,
          },
          geometry,
        }
      })
      .filter(Boolean)

    const geojson = { type: 'FeatureCollection', features }
    fs.writeFileSync('src/data/galicia-concellos.geojson', JSON.stringify(geojson))
    const sizeMB = (JSON.stringify(geojson).length / 1024 / 1024).toFixed(1)
    console.log(`Written ${features.length} concellos — ${sizeMB} MB`)
    if (features.length < 300) {
      console.warn('WARNING: fewer than 300 concellos — some may be missing outer ways')
    }
  })
}).on('error', (e) => { console.error('Error:', e.message) })

function assembleRings(segments) {
  if (segments.length === 0) return []
  let remaining = segments.map(s => [...s])
  const rings = []

  while (remaining.length > 0) {
    let ring = remaining.shift()
    let changed = true

    while (changed) {
      changed = false
      const tail = ring[ring.length - 1]
      for (let i = 0; i < remaining.length; i++) {
        const seg = remaining[i]
        if (coordsEqual(tail, seg[0])) {
          ring = [...ring, ...seg.slice(1)]
          remaining.splice(i, 1)
          changed = true; break
        } else if (coordsEqual(tail, seg[seg.length - 1])) {
          ring = [...ring, ...[...seg].reverse().slice(1)]
          remaining.splice(i, 1)
          changed = true; break
        }
      }
    }

    if (!coordsEqual(ring[0], ring[ring.length - 1])) ring.push(ring[0])
    if (ring.length >= 4) rings.push(ring)
  }
  return rings
}

function coordsEqual(a, b, tol = 0.00001) {
  return Math.abs(a[0] - b[0]) < tol && Math.abs(a[1] - b[1]) < tol
}