import mapboxgl from 'mapbox-gl'

const LAYER_IDS = [
  'krb3-hit',
  'krb2-hit',
  'krb1-hit',
]

function buatMarkerKrb(map, info) {
  const element = document.createElement('div')

  element.className = 'krb-marker'

  element.innerHTML = `
    <div class="krb-marker-card">
      <span
        class="krb-marker-dot"
        style="background:${info.color};"
      ></span>

      <div class="krb-marker-content">
        <span class="krb-marker-title">
          ${info.label}
        </span>

        <span class="krb-marker-description">
          ${info.description}
        </span>
      </div>
    </div>

    <div class="krb-marker-line"></div>
  `

  return new mapboxgl.Marker({
    element,
    anchor: 'bottom',
  })
    .setLngLat(info.lngLat)
    .addTo(map)
}

export function pasangAtributKrb(map) {
  if (!map) return null

  let marker = null
  let aktif = true

  function hapusMarker() {
    if (!marker) {
      return
    }

    marker.remove()
    marker = null
  }

  function handleClick(event) {
    if (!aktif) {
      return
    }

    const feature = event.features?.[0]

    if (!feature) {
      return
    }

    hapusMarker()

    const properties =
      feature.properties || {}

    const info = {
      lngLat: event.lngLat,
      krb: properties.krb || '',
      label: properties.label || 'KRB',
      color: properties.color || '#ffffff',
      description: properties.description || '',
    }

    marker = buatMarkerKrb(map, info)
  }

  function handleMapClick(event) {
    if (!aktif) {
      return
    }

    const features =
      map.queryRenderedFeatures(
        event.point,
        {
          layers: LAYER_IDS,
        }
      )

    if (!features.length) {
      hapusMarker()
    }
  }

  function handleEnter() {
    if (!aktif) {
      return
    }

    map.getCanvas().style.cursor =
      'pointer'
  }

  function handleLeave() {
    if (!aktif) {
      return
    }

    map.getCanvas().style.cursor =
      ''
  }

  function aktifkan() {
    aktif = true

    map.getCanvas().style.cursor =
      ''

    console.log('>>> ATRIBUT KRB AKTIF')
  }

  function nonaktifkan() {
    aktif = false

    hapusMarker()

    map.getCanvas().style.cursor =
      ''

    console.log('>>> ATRIBUT KRB NONAKTIF')
  }

  function handleMasukMitigasi() {
    nonaktifkan()
  }

  function handleKeluarMitigasi() {
    aktifkan()
  }

  map.on(
    'click',
    LAYER_IDS,
    handleClick
  )

  map.on(
    'click',
    handleMapClick
  )

  map.on(
    'mouseenter',
    LAYER_IDS,
    handleEnter
  )

  map.on(
    'mouseleave',
    LAYER_IDS,
    handleLeave
  )

  window.addEventListener(
    'buka-mitigasi',
    handleMasukMitigasi
  )

  window.addEventListener(
    'tutup-mitigasi',
    handleKeluarMitigasi
  )

  return {
    aktifkan,
    nonaktifkan,

    hapus() {
      hapusMarker()

      map.getCanvas().style.cursor =
        ''

      map.off(
        'click',
        LAYER_IDS,
        handleClick
      )

      map.off(
        'click',
        handleMapClick
      )

      map.off(
        'mouseenter',
        LAYER_IDS,
        handleEnter
      )

      map.off(
        'mouseleave',
        LAYER_IDS,
        handleLeave
      )

      window.removeEventListener(
        'buka-mitigasi',
        handleMasukMitigasi
      )

      window.removeEventListener(
        'tutup-mitigasi',
        handleKeluarMitigasi
      )
    },
  }
}