import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

function sembunyikanLabelNonKota(map) {
  const layers = map.getStyle()?.layers || []

  layers.forEach((layer) => {
    if (layer.type !== 'symbol') return

    const id = String(layer.id || '').toLowerCase()

    const sourceLayer = String(
      layer['source-layer'] || ''
    ).toLowerCase()

    const filter = JSON.stringify(
      layer.filter || ''
    ).toLowerCase()

    const teks =
      `${id} ${sourceLayer} ${filter}`

    const bukanKota =
      teks.includes('village') ||
      teks.includes('hamlet') ||
      teks.includes('town') ||
      teks.includes('locality') ||
      teks.includes('suburb') ||
      teks.includes('neighbourhood') ||
      teks.includes('neighborhood') ||
      teks.includes('district') ||
      teks.includes('subdistrict') ||
      teks.includes('settlement-subdivision') ||
      teks.includes('settlement-minor')

    if (!bukanKota) return

    try {
      map.setLayoutProperty(
        layer.id,
        'visibility',
        'none'
      )
    } catch (error) {
      console.warn(
        `Tidak dapat menyembunyikan layer label: ${layer.id}`,
        error
      )
    }
  })
}

function aktifkanTerrain(map) {
  if (!map.getSource('mapbox-dem')) {
    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    })
  }

  map.setTerrain({
    source: 'mapbox-dem',
    exaggeration: 1.25,
  })

  map.setFog({
    range: [0.6, 10],
    color: '#bdd7e4',
    'horizon-blend': 0.13,
  })
}

export function buatPeta(container) {
  if (!container) {
    throw new Error(
      'Container peta tidak ditemukan.'
    )
  }

  const token =
    import.meta.env.VITE_MAPBOX_TOKEN

  console.log(
    'Mapbox token:',
    token
      ? 'TERBACA'
      : 'TIDAK TERBACA'
  )

  if (!token) {
    throw new Error(
      'VITE_MAPBOX_TOKEN tidak ditemukan.'
    )
  }

  mapboxgl.accessToken = token

  const map = new mapboxgl.Map({
    container,
    style:
      'mapbox://styles/mapbox/satellite-streets-v12',
    center: [
      121.62581,
      -8.89929,
    ],
    zoom: 12.7,
    pitch: 61,
    bearing: 0,
    antialias: true,
  })

  map.on('error', (event) => {
    console.error(
      'MAPBOX ERROR:',
      event?.error || event
    )
  })

  map.once('load', () => {
    console.log(
      'Mapbox style berhasil dimuat.'
    )

    try {
      aktifkanTerrain(map)

      console.log(
        'Terrain 3D aktif.'
      )
    } catch (error) {
      console.error(
        'Gagal mengaktifkan terrain:',
        error
      )
    }

    sembunyikanLabelNonKota(map)

    map.resize()

    console.log(
      'Peta dasar siap.'
    )
  })

  return map
}

export function hancurkanPeta(map) {
  if (!map) {
    return
  }

  try {
    map.remove()
  } catch (error) {
    console.warn(
      'Gagal menghancurkan instance Mapbox:',
      error
    )
  }
}