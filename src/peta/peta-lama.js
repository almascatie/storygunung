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

function mulaiPutaran(map) {
  let animationFrame = null
  let aktif = true

  const bearingAwal =
    map.getBearing()

  const waktuPutaran = 90000

  let waktuMulai = null

  console.log(
    '>>> PUTARAN 360 DIMULAI'
  )

  function frame(timestamp) {
    if (!aktif || !map) {
      return
    }

    if (waktuMulai === null) {
      waktuMulai = timestamp
    }

    const elapsed =
      timestamp - waktuMulai

    const progress =
      (elapsed % waktuPutaran) /
      waktuPutaran

    const bearing =
      bearingAwal +
      progress * 360

    map.setBearing(bearing)

    animationFrame =
      window.requestAnimationFrame(frame)
  }

  animationFrame =
    window.requestAnimationFrame(frame)

  return () => {
    if (!aktif) {
      return
    }

    aktif = false

    if (animationFrame !== null) {
      window.cancelAnimationFrame(
        animationFrame
      )

      animationFrame = null
    }

    console.log(
      '>>> PUTARAN 360 DIHENTIKAN'
    )
  }
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
      121.63439,
      -8.91708,
    ],
    zoom: 12.7,
    pitch: 61,
    bearing: -26,
    antialias: true,
  })

  map.on('error', (event) => {
    console.error(
      'MAPBOX ERROR:',
      event?.error || event
    )
  })

  map.addControl(
    new mapboxgl.NavigationControl({
      visualizePitch: true,
    }),
    'bottom-right'
  )

  let hentikanPutaran = null

  const mulaiPutaranSekarang = () => {
    if (hentikanPutaran) {
      return
    }

    if (
      !map ||
      map.isRemoved?.()
    ) {
      return
    }

    hentikanPutaran =
      mulaiPutaran(map)
  }

  const hentikanPutaranSekarang = () => {
    if (!hentikanPutaran) {
      return
    }

    hentikanPutaran()
    hentikanPutaran = null
  }

  /*
   * Event kontrol putaran dari mode Mitigasi.
   */
  const handleHentikanPutaran = () => {
    hentikanPutaranSekarang()
  }

  const handleMulaiPutaran = () => {
    mulaiPutaranSekarang()
  }

  window.addEventListener(
    'hentikan-putaran-peta',
    handleHentikanPutaran
  )

  window.addEventListener(
    'mulai-putaran-peta',
    handleMulaiPutaran
  )

  /*
   * API internal untuk komponen/modul lain.
   */
  map._hentikanPutaran = () => {
    hentikanPutaranSekarang()
  }

  map._mulaiPutaran = () => {
    mulaiPutaranSekarang()
  }

  /*
   * Cleanup listener.
   */
  map._hapusListenerPutaran = () => {
    window.removeEventListener(
      'hentikan-putaran-peta',
      handleHentikanPutaran
    )

    window.removeEventListener(
      'mulai-putaran-peta',
      handleMulaiPutaran
    )
  }

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

    setTimeout(() => {
      if (
        !map ||
        map.isRemoved?.()
      ) {
        return
      }

      map.resize()

      mulaiPutaranSekarang()
    }, 300)

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
    if (map._hentikanPutaran) {
      map._hentikanPutaran()
    }

    if (map._hapusListenerPutaran) {
      map._hapusListenerPutaran()
    }

    map.remove()
  } catch (error) {
    console.warn(
      'Gagal menghancurkan instance Mapbox:',
      error
    )
  }
}