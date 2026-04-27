// Debug: try without area filter, direct relation ID
const https = require('https')

// Direct relation by ID (Santiago de Compostela = 346204), no area filter
const query = '[out:json][timeout:30];(relation(346204););out body;'
const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query)

https.get(url, (res) => {
  let chunks = []
  res.on('data', c => chunks.push(c))
  res.on('end', () => {
    const data = JSON.parse(Buffer.concat(chunks).toString())
    const el = data.elements[0]
    console.log('keys:', Object.keys(el))
    if (el.members) {
      console.log('member count:', el.members.length)
      console.log('member[0]:', JSON.stringify(el.members[0]))
    } else {
      console.log('NO MEMBERS - CONFIRMED BUG')
    }
  })
}).on('error', e => console.error(e.message))
