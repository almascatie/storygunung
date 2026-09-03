import { open } from 'shapefile'

const DATA_SHAPEFILE = '/data/kawasan_rawan'

const KRB_CONFIG = [
  {
    name: 'krb3',
    label: 'KRB III',
    lcode: ['0703', '0603'],
    color: '#e64b5d',
    description: 'Kawasan rawan bencana tingkat III.',
  },
  {
    name: 'krb2',
    label: 'KRB II',
    lcode: ['0702', '0602'],
    color: '#f28c28',
    description: 'Kawasan rawan bencana tingkat II.',
  },
  {
    name: 'krb1',
    label: 'KRB I',
    lcode: ['0701', '0601'],
    color: '#f4d34f',
    description: 'Kawasan rawan bencana tingkat I.',
  },
]

function ambilLcode(feature) {
  const properties = feature?.properties || {}
  const value = properties.LCODE ?? properties.lcode ?? properties.Lcode
  return value == null ? '' : String(value).trim()
}

function kelompokkanKrb(features) {
  const hasil = { krb3: [], krb2: [], krb1: [] }

  features.forEach((feature) => {
    const lcode = ambilLcode(feature)
    const config = KRB_CONFIG.find((item) => item.lcode.includes(lcode))
    if (!config) return

    const featureBaru = {
      ...feature,
      properties: {
        ...(feature.properties || {}),
        krb: config.name,
        label: config.label,
        color: config.color,
        description: config.description,
      },
    }

    hasil[config.name].push(featureBaru)
  })

  return hasil
}

function buatPusatFeature(feature) {
  const geometry = feature?.geometry
  if (!geometry) return null

  if (geometry.type === 'Point') {
    return geometry.coordinates
  }

  const coords = geometry.coordinates?.flat(Infinity) || []
  const angka = coords.filter((value) => typeof value === 'number')

  if (angka.length < 2) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (let i = 0; i < angka.length; i += 2) {
    const x = angka[i]
    const y = angka[i + 1]

    if (!Number.isFinite(x) || !Number.isFinite(y)) continue

    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }

  if (![minX, minY, maxX, maxY].every(Number.isFinite)) {
    return null
  }

  return [(minX + maxX) / 2, (minY + maxY) / 2]
}

export async function muatLapisanKrb(map) {
  if (!map) return null

  if (map.getSource('kawasan-krb3') || map.getSource('kawasan-krb2') || map.getSource('kawasan-krb1')) {
    return null
  }

  const source = await open(`${DATA_SHAPEFILE}/IYA.shp`, `${DATA_SHAPEFILE}/IYA.dbf`)
  const features = []
  let row

  while ((row = await source.read()) && !row.done) {
    if (row.value) features.push(row.value)
  }

  const kelompok = kelompokkanKrb(features)
  const pusatKrb = {}

  KRB_CONFIG.forEach((config) => {
    const data = {
      type: 'FeatureCollection',
      features: kelompok[config.name],
    }

    const pusat = data.features.map(buatPusatFeature).find(Boolean)
    pusatKrb[config.name] = pusat || null

    map.addSource(`kawasan-${config.name}`, {
      type: 'geojson',
      data,
    })

    map.addLayer({
      id: `${config.name}-hit`,
      type: 'fill',
      source: `kawasan-${config.name}`,
      paint: {
        'fill-color': config.color,
        'fill-opacity': 0.01,
      },
    })

    map.addLayer({
      id: `${config.name}-outline`,
      type: 'line',
      source: `kawasan-${config.name}`,
      paint: {
        'line-color': config.color,
        'line-width': 1,
        'line-opacity': 0.9,
        'line-dasharray': [1.2, 2],
      },
    })

    console.log(`${config.label}: ${kelompok[config.name].length} feature`)
  })

  console.log('Semua lapisan KRB berhasil dimuat.')

  return {
    pusatKrb,
    konfigurasi: KRB_CONFIG,
  }
}

export function pasangInteraksiKrb(map, onSelect) {
  if (!map) return

  const layerIds = ['krb3-hit', 'krb2-hit', 'krb1-hit']

  map.on('click', layerIds, (event) => {
    const feature = event.features?.[0]
    if (!feature) return

    const properties = feature.properties || {}

    if (typeof onSelect === 'function') {
      onSelect({
        lngLat: event.lngLat,
        label: properties.label || 'KRB',
        description: properties.description || '',
        color: properties.color || '#ffffff',
        krb: properties.krb || '',
      })
    }
  })

  map.on('mouseenter', layerIds, () => {
    map.getCanvas().style.cursor = 'pointer'
  })

  map.on('mouseleave', layerIds, () => {
    map.getCanvas().style.cursor = ''
  })
}