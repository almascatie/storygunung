const RADAR = [
  {
    name: 'krb3',
    color: '#e64b5d',
    durasi: 2600,
  },
  {
    name: 'krb2',
    color: '#f28c28',
    durasi: 3200,
  },
  {
    name: 'krb1',
    color: '#f4d34f',
    durasi: 3800,
  },
]

const SOURCE_ID = 'radar-krb'

let animationFrame = null
let running = false
let startTime = 0
let pusat = null
let radiusKrb3 = 0
let radiusKrb2 = 0
let radiusKrb1 = 0

function ambilKoordinat(geometry) {
  if (!geometry) return []

  const hasil = []

  function baca(coords) {
    if (!Array.isArray(coords)) return

    if (
      coords.length >= 2 &&
      typeof coords[0] === 'number' &&
      typeof coords[1] === 'number'
    ) {
      hasil.push([coords[0], coords[1]])
      return
    }

    coords.forEach(baca)
  }

  baca(geometry.coordinates)

  return hasil
}

function hitungPusat(features) {
  const semua = []

  features.forEach((feature) => {
    semua.push(
      ...ambilKoordinat(feature.geometry)
    )
  })

  if (!semua.length) return null

  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  semua.forEach(([lon, lat]) => {
    minLon = Math.min(minLon, lon)
    maxLon = Math.max(maxLon, lon)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  })

  return [
    (minLon + maxLon) / 2,
    (minLat + maxLat) / 2,
  ]
}

function jarakMeter(a, b) {
  const R = 6371000

  const lat1 = (a[1] * Math.PI) / 180
  const lat2 = (b[1] * Math.PI) / 180

  const dLat =
    ((b[1] - a[1]) * Math.PI) / 180

  const dLon =
    ((b[0] - a[0]) * Math.PI) / 180

  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)

  const h =
    sinLat * sinLat +
    Math.cos(lat1) *
      Math.cos(lat2) *
      sinLon *
      sinLon

  return (
    2 *
    R *
    Math.atan2(
      Math.sqrt(h),
      Math.sqrt(1 - h)
    )
  )
}

function hitungRadius(features, center) {
  let radius = 0

  features.forEach((feature) => {
    const koordinat =
      ambilKoordinat(feature.geometry)

    koordinat.forEach((point) => {
      radius = Math.max(
        radius,
        jarakMeter(center, point)
      )
    })
  })

  return radius
}

function buatLingkaran(center, radius) {
  const jumlahTitik = 128
  const coordinates = []
  const R = 6371000

  const lat1 =
    (center[1] * Math.PI) / 180

  const lon1 =
    (center[0] * Math.PI) / 180

  const angularDistance =
    radius / R

  for (
    let i = 0;
    i <= jumlahTitik;
    i++
  ) {
    const bearing =
      (i / jumlahTitik) *
      Math.PI *
      2

    const lat2 = Math.asin(
      Math.sin(lat1) *
        Math.cos(angularDistance) +
        Math.cos(lat1) *
          Math.sin(angularDistance) *
          Math.cos(bearing)
    )

    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(bearing) *
          Math.sin(angularDistance) *
          Math.cos(lat1),
        Math.cos(angularDistance) -
          Math.sin(lat1) *
            Math.sin(lat2)
      )

    coordinates.push([
      (lon2 * 180) / Math.PI,
      (lat2 * 180) / Math.PI,
    ])
  }

  return coordinates
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3)
}

function buatDataRadar(
  center,
  radius,
  color,
  opacity
) {
  return {
    type: 'Feature',
    properties: {
      color,
      opacity,
    },
    geometry: {
      type: 'LineString',
      coordinates: buatLingkaran(
        center,
        radius
      ),
    },
  }
}

function updateRadar(
  map,
  timestamp
) {
  if (!running || !map) return

  const waktu =
    timestamp - startTime

  const features = []

  /*
   * KRB III
   *
   * Pusat → batas KRB III
   */
  const p3 =
    (waktu % RADAR[0].durasi) /
    RADAR[0].durasi

  const radius3 =
    radiusKrb3 *
    easeOut(p3)

  features.push(
    buatDataRadar(
      pusat,
      radius3,
      RADAR[0].color,
      Math.sin(p3 * Math.PI)
    )
  )

  /*
   * KRB II
   *
   * Batas KRB III → batas KRB II
   */
  const p2 =
    (waktu % RADAR[1].durasi) /
    RADAR[1].durasi

  const radius2 =
    radiusKrb3 +
    (radiusKrb2 - radiusKrb3) *
      easeOut(p2)

  features.push(
    buatDataRadar(
      pusat,
      radius2,
      RADAR[1].color,
      Math.sin(p2 * Math.PI)
    )
  )

  /*
   * KRB I
   *
   * Batas KRB II → batas KRB I
   */
  const p1 =
    (waktu % RADAR[2].durasi) /
    RADAR[2].durasi

  const radius1 =
    radiusKrb2 +
    (radiusKrb1 - radiusKrb2) *
      easeOut(p1)

  features.push(
    buatDataRadar(
      pusat,
      radius1,
      RADAR[2].color,
      Math.sin(p1 * Math.PI)
    )
  )

  const source =
    map.getSource(SOURCE_ID)

  if (source) {
    source.setData({
      type: 'FeatureCollection',
      features,
    })
  }

  animationFrame =
    requestAnimationFrame(
      (nextTimestamp) => {
        updateRadar(
          map,
          nextTimestamp
        )
      }
    )
}

export async function mulaiRadarKrb(map) {
  if (!map || running) return

  const source3 =
    map.getSource('kawasan-krb3')

  const source2 =
    map.getSource('kawasan-krb2')

  const source1 =
    map.getSource('kawasan-krb1')

  if (
    !source3 ||
    !source2 ||
    !source1
  ) {
    console.warn(
      'Source KRB I, II, atau III belum tersedia.'
    )
    return
  }

  const data3 = source3._data
  const data2 = source2._data
  const data1 = source1._data

  if (
    !data3?.features?.length ||
    !data2?.features?.length ||
    !data1?.features?.length
  ) {
    console.warn(
      'Geometry KRB tidak lengkap.'
    )
    return
  }

  /*
   * Pusat radar berasal dari
   * geometry KRB III.
   */
  pusat =
    hitungPusat(
      data3.features
    )

  if (!pusat) {
    console.warn(
      'Pusat radar tidak ditemukan.'
    )
    return
  }

  /*
   * Radius setiap batas KRB.
   */
  radiusKrb3 =
    hitungRadius(
      data3.features,
      pusat
    )

  radiusKrb2 =
    hitungRadius(
      data2.features,
      pusat
    )

  radiusKrb1 =
    hitungRadius(
      data1.features,
      pusat
    )

  /*
   * Pastikan radius bertingkat.
   */
  radiusKrb2 =
    Math.max(
      radiusKrb2,
      radiusKrb3
    )

  radiusKrb1 =
    Math.max(
      radiusKrb1,
      radiusKrb2
    )

  /*
   * Source radar.
   */
  if (
    !map.getSource(SOURCE_ID)
  ) {
    map.addSource(
      SOURCE_ID,
      {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      }
    )
  }

  /*
   * Satu layer untuk tiga
   * gelombang radar.
   */
  if (
    !map.getLayer(
      'radar-krb-ring'
    )
  ) {
    map.addLayer({
      id: 'radar-krb-ring',
      type: 'line',
      source: SOURCE_ID,

      paint: {
        'line-color': [
          'get',
          'color',
        ],

        'line-opacity': [
          'get',
          'opacity',
        ],

        'line-width': 2.5,

        'line-blur': 0.4,
      },
    })
  }

  /*
   * Batas KRB:
   * tipis + putus-putus.
   */
  RADAR.forEach((layer) => {
    const outlineId =
      `${layer.name}-outline`

    if (
      map.getLayer(
        outlineId
      )
    ) {
      map.setPaintProperty(
        outlineId,
        'line-width',
        1
      )

      map.setPaintProperty(
        outlineId,
        'line-dasharray',
        [1.2, 2]
      )

      map.setPaintProperty(
        outlineId,
        'line-opacity',
        0.9
      )
    }
  })

  console.log(
    'Radius radar:',
    {
      KRB3: radiusKrb3,
      KRB2: radiusKrb2,
      KRB1: radiusKrb1,
    }
  )

  running = true
  startTime = performance.now()

  animationFrame =
    requestAnimationFrame(
      (timestamp) => {
        updateRadar(
          map,
          timestamp
        )
      }
    )
}

export function hentikanRadarKrb(map) {
  running = false

  if (animationFrame) {
    cancelAnimationFrame(
      animationFrame
    )

    animationFrame = null
  }

  startTime = 0
  pusat = null
  radiusKrb3 = 0
  radiusKrb2 = 0
  radiusKrb1 = 0

  if (!map) return

  if (
    map.getLayer(
      'radar-krb-ring'
    )
  ) {
    map.removeLayer(
      'radar-krb-ring'
    )
  }

  if (
    map.getSource(
      SOURCE_ID
    )
  ) {
    map.removeSource(
      SOURCE_ID
    )
  }
}