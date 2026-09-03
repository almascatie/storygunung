import mapboxgl from 'mapbox-gl'
import { open } from 'shapefile'

const DATA_SHAPEFILE = '/data/kawasan_rawan'

function ambilLcode(feature) {
  const properties = feature?.properties || {}
  const value =
    properties.LCODE ??
    properties.lcode ??
    properties.Lcode

  return value == null ? '' : String(value).trim()
}

function ambilRemark(feature) {
  const properties = feature?.properties || {}
  const value =
    properties.REMARK ??
    properties.remark ??
    properties.Remark

  return value == null ? '' : String(value).trim()
}

export async function muatLapisanLaharHujan(map) {
  if (!map) return null

  if (map.getSource('lahar-hujan')) {
    return null
  }

  const source = await open(
    `${DATA_SHAPEFILE}/IYA.shp`,
    `${DATA_SHAPEFILE}/IYA.dbf`
  )

  const features = []
  let row

  while ((row = await source.read()) && !row.done) {
    if (row.value) {
      features.push(row.value)
    }
  }

  const featureLahar = features.find((feature) => {
    const lcode = ambilLcode(feature)
    const remark = ambilRemark(feature).toLowerCase()

    return (
      lcode === '0701' &&
      remark.includes('aliran lahar hujan')
    )
  })

  if (!featureLahar) {
    console.warn(
      'Feature aliran lahar hujan LCODE 0701 tidak ditemukan.'
    )
    return null
  }

  const data = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          ...(featureLahar.properties || {}),
          jenis: 'lahar_hujan',
          label: 'Aliran Lahar Hujan',
        },
        geometry: featureLahar.geometry,
      },
    ],
  }

  map.addSource('lahar-hujan', {
    type: 'geojson',
    data,
  })

  map.addLayer({
    id: 'lahar-hujan-fill',
    type: 'fill',
    source: 'lahar-hujan',
    paint: {
      'fill-color': '#e4c83f',
      'fill-opacity': 0.34,
    },
  })

  map.addLayer({
    id: 'lahar-hujan-line',
    type: 'line',
    source: 'lahar-hujan',
    paint: {
      'line-color': '#d8c34a',
      'line-width': 1.2,
      'line-opacity': 0.9,
      'line-dasharray': [1.2, 1.8],
    },
  })

  console.log(
    'Shape aliran lahar hujan berhasil dimuat.'
  )

  return data
}

function ambilTitikLabel(data) {
  const feature = data?.features?.[0]
  const geometry = feature?.geometry

  if (!geometry) return null

  let coordinates = []

  if (geometry.type === 'Polygon') {
    coordinates =
      geometry.coordinates?.[0] || []
  } else if (geometry.type === 'MultiPolygon') {
    coordinates =
      geometry.coordinates?.[0]?.[0] || []
  }

  if (!coordinates.length) return null

  let lng = 0
  let lat = 0

  coordinates.forEach(([x, y]) => {
    lng += x
    lat += y
  })

  return [
    lng / coordinates.length,
    lat / coordinates.length,
  ]
}

export function buatLabelLaharHujan(map, data) {
  if (!map || !data?.features?.length) {
    return null
  }

  const coordinates = ambilTitikLabel(data)

  if (!coordinates) {
    console.warn(
      'Titik label lahar hujan tidak ditemukan.'
    )
    return null
  }

  const element = document.createElement('div')
  element.className = 'lahar-hujan-marker'

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
        padding:5px 9px;
        border:1px solid rgba(255,255,255,0.18);
        border-radius:999px;
        background:rgba(10,18,20,0.72);
        backdrop-filter:blur(8px);
        box-shadow:0 4px 16px rgba(0,0,0,0.18);
        color:#f4f1e8;
        font:600 11px/1.2 Inter,system-ui,sans-serif;
        letter-spacing:0.01em;
        white-space:nowrap;
      ">
        <span style="
          width:7px;
          height:7px;
          border-radius:50%;
          background:#e4c83f;
          box-shadow:0 0 0 2px rgba(228,200,63,0.18);
          flex:none;
        "></span>

        <div style="
          display:flex;
          flex-direction:column;
          gap:2px;
        ">
          <span>Lahar Hujan</span>

          <span style="
            font-size:10px;
            font-weight:400;
            opacity:0.7;
          ">
            Aliran saat hujan
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

export function hapusLabelLaharHujan(marker) {
  if (!marker) return

  marker.remove()
}