// Fetch Galicia municipality metadata from Overpass API
// Run: node scripts/fetch-concellos-meta.cjs
const https = require('https')
const fs = require('fs')

const query = '[out:json][timeout:90];area["ISO3166-2"="ES-GA"]->.galicia;(relation[admin_level=8][boundary=administrative](area.galicia););out ids tags center;'
const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query)

console.log('Fetching from Overpass API...')
https.get(url, (res) => {
  let body = ''
  res.on('data', (chunk) => { body += chunk })
  res.on('end', () => {
    const data = JSON.parse(body)
    console.log('Total elements:', data.elements.length)
    // Map to concello format
    const concellos = data.elements.map((el) => ({
      id: el.tags['ref:ine'] || el.tags['ine:municipio'] || String(el.id),
      name: el.tags['name:es'] || el.tags.name,
      nameGl: el.tags['name:gl'] || el.tags.name,
      provinceId: resolveProvince(el.tags),
      lat: el.center ? el.center.lat : null,
      lon: el.center ? el.center.lon : null,
    })).filter((c) => c.lat !== null)
    fs.writeFileSync('src/data/concellos.json', JSON.stringify(concellos, null, 2))
    console.log(`Written ${concellos.length} concellos to src/data/concellos.json`)
    // Sample
    console.log('Sample:', JSON.stringify(concellos[0]))
  })
}).on('error', (e) => { console.error('Error:', e.message) })

function resolveProvince(tags) {
  const prov = tags['addr:province'] || tags['is_in:province'] || ''
  if (/coru/i.test(prov)) return 'corunha'
  if (/lugo/i.test(prov)) return 'lugo'
  if (/ourense/i.test(prov)) return 'ourense'
  if (/pontevedra/i.test(prov)) return 'pontevedra'
  return 'unknown'
}
