import { open } from 'shapefile'

const DATA_SHAPEFILE = '/data/kawasan_rawan'

const KRB_CONFIG = [
  {
    name: 'krb3',
    lcode: ['0703', '0603'],
    color: '#e64b5d',
  },
  {
    name: 'krb2',
    lcode: ['0702', '0602'],
    color: '#f28c28',
  },
  {
    name: 'krb1',
    lcode: ['0701', '0601'],
    color: '#f4d34f',
  },
]

function ambilLcode(feature) {
  const properties = feature?.properties || {}

  const value =
    properties.LCODE ??
    properties.lcode ??
    properties.Lcode

  return value == null
    ? ''
    : String(value).trim()
}

function kelompokkanKrb(features) {
  const hasil = {
    krb3: [],
    krb2: [],
    krb1: [],
  }

  features.forEach((feature) => {
    const lcode = ambilLcode(feature)

    const config = KRB_CONFIG.find((item) =>
      item.lcode.includes(lcode)
    )

    if (config) {
      hasil[config.name].push(feature)
    }
  })

  return hasil
}

export async function muatLapisanKrb(map) {
  if (!map) return

  if (
    map.getSource('kawasan-krb3') ||
    map.getSource('kawasan-krb2') ||
    map.getSource('kawasan-krb1')
  ) {
    return
  }

  const source = await open(
    `${DATA_SHAPEFILE}/IYA.shp`,
    `${DATA_SHAPEFILE}/IYA.dbf`
  )

  const features = []
  let row

  while (
    (row = await source.read()) &&
    !row.done
  ) {
    if (row.value) {
      features.push(row.value)
    }
  }

  const kelompok = kelompokkanKrb(features)

  KRB_CONFIG.forEach((config) => {
    const data = {
      type: 'FeatureCollection',
      features: kelompok[config.name],
    }

    map.addSource(
      `kawasan-${config.name}`,
      {
        type: 'geojson',
        data,
      }
    )

    /*
     * Hanya garis batas.
     * Tidak ada fill.
     */
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

    console.log(
      `${config.name.toUpperCase()}: ${kelompok[config.name].length} feature`
    )
  })

  console.log('Semua lapisan KRB berhasil dimuat.')
}