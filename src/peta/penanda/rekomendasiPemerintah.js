import mapboxgl from 'mapbox-gl'

const DATA_URL = '/data/rekomendasi_pemerintah.geojson'

function ambilNama(properties) {
  return (
    properties?.Name ||
    properties?.NAME ||
    properties?.name ||
    'Lokasi Pengungsian'
  )
}

function ambilDeskripsi(properties) {
  return (
    properties?.Description ||
    properties?.DESCRIPTION ||
    properties?.description ||
    'Tempat mengungsi'
  )
}

function ambilKoordinat(feature) {
  const geometry = feature?.geometry

  if (
    !geometry ||
    geometry.type !== 'Point' ||
    !Array.isArray(geometry.coordinates) ||
    geometry.coordinates.length < 2
  ) {
    return null
  }

  const lng = Number(geometry.coordinates[0])
  const lat = Number(geometry.coordinates[1])

  if (
    !Number.isFinite(lng) ||
    !Number.isFinite(lat)
  ) {
    return null
  }

  return [lng, lat]
}

function buatMarker(map, feature) {
  const coordinates = ambilKoordinat(feature)

  if (!coordinates) {
    return null
  }

  const properties = feature.properties || {}
  const nama = ambilNama(properties)
  const deskripsi = ambilDeskripsi(properties)

  const element = document.createElement('div')

  element.className =
    'rekomendasi-pemerintah-marker'

  element.innerHTML = `
    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      transform:translateY(-24px);
    ">
      <div style="
        display:flex;
        align-items:center;
        gap:7px;
        padding:5px 8px;
        border:1px solid rgba(255,255,255,0.18);
        border-radius:999px;
        background:rgba(10,18,20,0.72);
        backdrop-filter:blur(8px);
        box-shadow:0 4px 16px rgba(0,0,0,0.18);
        color:#f4f1e8;
        font:600 11px/1.2 Manrope,system-ui,sans-serif;
        letter-spacing:0.02em;
        white-space:nowrap;
      ">
        <span style="
          width:7px;
          height:7px;
          border-radius:50%;
          background:#55c77a;
          box-shadow:0 0 0 2px rgba(85,199,122,0.18);
          flex:none;
        "></span>

        <div style="
          display:flex;
          flex-direction:column;
          gap:2px;
        ">
          <span>${nama}</span>

          <span style="
            font-size:10px;
            line-height:1.3;
            font-weight:400;
            opacity:0.7;
          ">
            ${deskripsi}
          </span>
        </div>
      </div>

      <span style="
        width:1px;
        height:24px;
        background:rgba(255,255,255,0.42);
      "></span>
    </div>
  `

  return new mapboxgl.Marker({
    element,
    anchor: 'bottom',
  })
    .setLngLat(coordinates)
    .addTo(map)
}

export async function pasangRekomendasiPemerintah(map) {
  if (!map) {
    return null
  }

  try {
    const response =
      await fetch(DATA_URL)

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      )
    }

    const data =
      await response.json()

    if (!data?.features?.length) {
      console.warn(
        'rekomendasi_pemerintah.geojson tidak memiliki feature.'
      )

      return null
    }

    const markers = []

    data.features.forEach((feature) => {
      const marker =
        buatMarker(
          map,
          feature
        )

      if (marker) {
        markers.push(marker)
      }
    })

    console.log(
      `Lokasi pengungsian pemerintah: ${markers.length} lokasi`
    )

    return markers
  } catch (error) {
    console.error(
      'Gagal memuat lokasi pengungsian pemerintah:',
      error
    )

    return null
  }
}

export function hapusRekomendasiPemerintah(markers) {
  if (!markers) {
    return
  }

  markers.forEach((marker) => {
    marker?.remove()
  })
}