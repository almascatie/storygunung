const files = [
  'lokasi_utama',
  'lokasi_lain',
  'titik_aman_utama',
  'rute_evakuasi_utama',
  'hambatan_rute_utama',
  'rute_evakuasi_alternatif',
  'hambatan_rute_alternatif',
  'titik_aman_alternatif',
  'titik_aman_lain',
  'seluruh_titik_aman',
  'rekomendasi_pemerintah',
  'publik_evakuasi',
  'bahaya_tsunami',
]

const colors = {
  lokasi_utama: '#f4f1e8',
  lokasi_lain: '#a7d8d1',
  titik_aman_utama: '#7ee0a3',
  rute_evakuasi_utama: '#f6c552',
  hambatan_rute_utama: '#ff7462',
  rute_evakuasi_alternatif: '#a68cf2',
  hambatan_rute_alternatif: '#ff8d63',
  titik_aman_alternatif: '#bf9cff',
  titik_aman_lain: '#79c7f6',
  seluruh_titik_aman: '#72dfbc',
  rekomendasi_pemerintah: '#f5b64d',
  publik_evakuasi: '#5499d8',
  bahaya_tsunami: '#5bb8c9',
}

const sourceId = (nama) => `mitigasi-${nama}`
const layerId = (nama) => `mitigasi-${nama}-layer`
const dataUrl = (nama) => `/data/${nama}.geojson`

function jenisGeometry(feature) {
  const type = feature?.geometry?.type || ''

  if (type.includes('Line')) return 'line'
  if (type.includes('Point')) return 'circle'
  if (type.includes('Polygon')) return 'fill'

  return null
}

function buatPaint(nama, jenis) {
  const color = colors[nama] || '#ffffff'

  if (jenis === 'line') {
    return {
      'line-color': color,
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        9,
        1.5,
        12,
        3,
        15,
        5,
      ],
      'line-opacity': 0.9,
    }
  }

  if (jenis === 'circle') {
    return {
      'circle-color': color,
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        9,
        4,
        12,
        6,
        15,
        8,
      ],
      'circle-stroke-color': '#0d1719',
      'circle-stroke-width': 1.5,
      'circle-opacity': 0.95,
    }
  }

  if (jenis === 'fill') {
    return {
      'fill-color': color,
      'fill-opacity': 0.22,
      'fill-outline-color': color,
    }
  }

  return null
}

async function ambilGeoJson(nama) {
  const response = await fetch(dataUrl(nama))

  if (!response.ok) {
    throw new Error(
      `Gagal memuat ${nama}.geojson (${response.status})`
    )
  }

  return response.json()
}

function mapSiap(map) {
  if (!map) return false

  if (typeof map.isStyleLoaded === 'function') {
    return map.isStyleLoaded()
  }

  return Boolean(map.getStyle?.())
}

async function tungguStyle(map) {
  if (mapSiap(map)) return

  await new Promise((resolve) => {
    const selesai = () => {
      map.off('style.load', selesai)
      resolve()
    }

    map.once('style.load', selesai)
  })
}

export async function muatLapisanMitigasi(map) {
  if (!map) return

  await tungguStyle(map)

  for (const nama of files) {
    const source = sourceId(nama)
    const layer = layerId(nama)

    try {
      if (map.getSource(source) && map.getLayer(layer)) {
        continue
      }

      const geojson = await ambilGeoJson(nama)

      if (!geojson?.features?.length) {
        console.warn(`Tidak ada fitur: ${nama}`)
        continue
      }

      const feature = geojson.features.find(
        (item) => jenisGeometry(item)
      )

      const jenis = jenisGeometry(feature)

      if (!jenis) {
        console.warn(
          `Geometry tidak dikenali: ${nama}`
        )
        continue
      }

      const paint = buatPaint(nama, jenis)

      if (!paint) continue

      if (!map.getSource(source)) {
        map.addSource(source, {
          type: 'geojson',
          data: geojson,
        })
      }

      if (!map.getLayer(layer)) {
        map.addLayer({
          id: layer,
          type: jenis,
          source,
          layout: {
            visibility: 'none',
          },
          paint,
        })
      }

      console.log(
        `>>> LAPISAN MITIGASI SIAP: ${nama}`
      )
    } catch (error) {
      console.error(
        `Gagal memuat lapisan ${nama}:`,
        error
      )
    }
  }
}

export function aturVisibilitasLapisan(
  map,
  nama,
  terlihat
) {
  if (!map || !nama) return
  if (!mapSiap(map)) return

  const id = layerId(nama)

  if (!map.getLayer(id)) return

  try {
    map.setLayoutProperty(
      id,
      'visibility',
      terlihat ? 'visible' : 'none'
    )
  } catch (error) {
    console.warn(
      `Gagal mengubah visibility ${id}:`,
      error
    )
  }
}

export function tampilkanLapisanMitigasi(
  map,
  nama
) {
  aturVisibilitasLapisan(
    map,
    nama,
    true
  )
}

export function sembunyikanLapisanMitigasi(
  map,
  nama
) {
  aturVisibilitasLapisan(
    map,
    nama,
    false
  )
}

export function tampilkanSemuaLapisanMitigasi(map) {
  if (!map) return

  files.forEach((nama) => {
    tampilkanLapisanMitigasi(
      map,
      nama
    )
  })

  console.log(
    '>>> SEMUA LAPISAN MITIGASI DITAMPILKAN'
  )
}

export function matikanSemuaLapisanMitigasi(map) {
  if (!map) return

  files.forEach((nama) => {
    sembunyikanLapisanMitigasi(
      map,
      nama
    )
  })

  console.log(
    '>>> SEMUA LAPISAN MITIGASI DIMATIKAN'
  )
}

export function aturSkenarioMitigasi(
  map,
  scenario = {}
) {
  if (!map) return

  const {
    rumah = false,
    kantor = false,
    lain = false,
  } = scenario

  matikanSemuaLapisanMitigasi(map)

  if (rumah) {
    tampilkanLapisanMitigasi(
      map,
      'lokasi_utama'
    )

    tampilkanLapisanMitigasi(
      map,
      'rute_evakuasi_utama'
    )

    tampilkanLapisanMitigasi(
      map,
      'titik_aman_utama'
    )

    tampilkanLapisanMitigasi(
      map,
      'hambatan_rute_utama'
    )
  }

  if (kantor) {
    tampilkanLapisanMitigasi(
      map,
      'lokasi_utama'
    )

    tampilkanLapisanMitigasi(
      map,
      'rute_evakuasi_alternatif'
    )

    tampilkanLapisanMitigasi(
      map,
      'titik_aman_alternatif'
    )

    tampilkanLapisanMitigasi(
      map,
      'hambatan_rute_alternatif'
    )
  }

  if (lain) {
    tampilkanLapisanMitigasi(
      map,
      'lokasi_lain'
    )

    tampilkanLapisanMitigasi(
      map,
      'seluruh_titik_aman'
    )

    tampilkanLapisanMitigasi(
      map,
      'titik_aman_lain'
    )
  }
}

export function tampilkanBahayaMitigasi(map) {
  tampilkanLapisanMitigasi(
    map,
    'bahaya_tsunami'
  )
}

export function resetLapisanMitigasi(map) {
  matikanSemuaLapisanMitigasi(map)
}

export function hapusLapisanMitigasi(
  map,
  nama
) {
  if (!map || !nama) return

  const id = layerId(nama)
  const source = sourceId(nama)

  try {
    if (map.getLayer(id)) {
      map.removeLayer(id)
    }

    if (map.getSource(source)) {
      map.removeSource(source)
    }
  } catch (error) {
    console.warn(
      `Gagal menghapus ${nama}:`,
      error
    )
  }
}

export function hapusSemuaLapisanMitigasi(map) {
  if (!map) return

  files.forEach((nama) => {
    hapusLapisanMitigasi(
      map,
      nama
    )
  })
}

export function daftarLapisanMitigasi() {
  return [...files]
}