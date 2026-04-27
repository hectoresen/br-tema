// Fix provinceId in concellos.json using INE code prefix
// INE municipality codes: 15xxx = A Coruña, 27xxx = Lugo, 32xxx = Ourense, 36xxx = Pontevedra
// Run: node scripts/fix-concellos-province.cjs
const fs = require('fs')

const raw = JSON.parse(fs.readFileSync('src/data/concellos.json', 'utf8'))

const PROVINCE_MAP = { '15': 'corunha', '27': 'lugo', '32': 'ourense', '36': 'pontevedra' }

const fixed = raw.map((c) => {
  const prefix = String(c.id).substring(0, 2)
  const provinceId = PROVINCE_MAP[prefix] || c.provinceId
  return { ...c, provinceId }
})

// Report
const counts = {}
fixed.forEach(c => { counts[c.provinceId] = (counts[c.provinceId] || 0) + 1 })
console.log('Province counts:', counts)

// Sort: corunha, lugo, ourense, pontevedra; within each province by name
const ORDER = ['corunha', 'lugo', 'ourense', 'pontevedra']
fixed.sort((a, b) => {
  const pa = ORDER.indexOf(a.provinceId), pb = ORDER.indexOf(b.provinceId)
  if (pa !== pb) return pa - pb
  return a.name.localeCompare(b.name, 'es')
})

fs.writeFileSync('src/data/concellos.json', JSON.stringify(fixed, null, 2))
console.log(`Written ${fixed.length} concellos`)
