import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { open } from 'shapefile'
import 'mapbox-gl/dist/mapbox-gl.css'

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

const dataUrl = (name) => `/data/${name}.geojson`

const colors = {
  iya: '#e2aa45',
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

const homeVisible = new Set([
  'iya',
  'lokasi_utama',
  'lokasi_lain',
  'titik_aman_utama',
  'rute_evakuasi_utama',
  'hambatan_rute_utama',
])

function layerKind(feature) {
  const type = feature?.geometry?.type || ''

  if (type.includes('Line')) {
    return 'line'
  }

  if (type.includes('Point')) {
    return 'circle'
  }

  if (type.includes('Polygon')) {
    return 'fill'
  }

  return null
}

function getPoint(feature) {
  try {
    if (!feature?.geometry) {
      return null
    }

    if (feature.geometry.type === 'Point') {
      return feature.geometry.coordinates
    }

    const coords = feature.geometry.coordinates
      .flat(Infinity)
      .filter((value) => typeof value === 'number')

    if (coords.length < 2) {
      return null
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (let i = 0; i < coords.length; i += 2) {
      const x = coords[i]
      const y = coords[i + 1]

      if (typeof x !== 'number' || typeof y !== 'number') {
        continue
      }

      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }

    if (
      !Number.isFinite(minX) ||
      !Number.isFinite(minY) ||
      !Number.isFinite(maxX) ||
      !Number.isFinite(maxY)
    ) {
      return null
    }

    return [
      (minX + maxX) / 2,
      (minY + maxY) / 2,
    ]
  } catch (error) {
    console.warn('Gagal mendapatkan titik feature:', error)
    return null
  }
}

function Callout({ name, description }) {
  return (
    <div className="callout">
      <b>{name}</b>

      {description && (
        <small>{description}</small>
      )}

      <i />
    </div>
  )
}

export function MapExperience({ mode }) {
  const container = useRef(null)
  const mapRef = useRef(null)

  const markers = useRef([])
  const sourceData = useRef({})
  const loaded = useRef(false)

  const [ready, setReady] = useState(false)

  const [scenario, setScenario] = useState({
    rumah: false,
    kantor: false,
    lain: false,
  })

  const [layers, setLayers] = useState({
    iya: true,
    rute_evakuasi_utama: false,
    rute_evakuasi_alternatif: false,
    titik_aman_lain: false,
    rekomendasi_pemerintah: false,
    publik_evakuasi: false,
    bahaya_tsunami: false,
  })

  useEffect(() => {
    if (!container.current || mapRef.current) {
      return
    }

    const token = import.meta.env.VITE_MAPBOX_TOKEN

    console.log(
      'Mapbox token:',
      token ? 'TERBACA' : 'TIDAK TERBACA'
    )

    if (!token) {
      console.error(
        'VITE_MAPBOX_TOKEN tidak ditemukan.'
      )
      return
    }

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [121.63, -8.88],
      zoom: 12.7,
      pitch: 61,
      bearing: -26,
      antialias: true,
    })

    mapRef.current = map

    console.log('Mapbox instance dibuat.')

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

    map.on('load', async () => {
      console.log('Mapbox style berhasil dimuat.')

      try {
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

        console.log('Terrain 3D aktif.')
      } catch (error) {
        console.error(
          'Gagal mengaktifkan terrain:',
          error
        )
      }

      /*
       * LOAD SHAPEFILE GUNUNG IYA
       */
      try {
        console.log('Memuat IYA.shp...')

        const source = await open(
          '/data/IYA.shp',
          '/data/IYA.dbf'
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

        const data = {
          type: 'FeatureCollection',
          features,
        }

        sourceData.current.iya = data

        console.log(
          `IYA.shp berhasil dimuat: ${features.length} feature`
        )

        addSourceLayers(
          map,
          'iya',
          data
        )
      } catch (error) {
        console.error(
          'Dataset IYA tidak dapat dimuat:',
          error
        )
      }

      /*
       * LOAD SEMUA GEOJSON
       */
      await Promise.all(
        files.map(async (name) => {
          try {
            console.log(
              `Memuat ${name}.geojson...`
            )

            const response = await fetch(
              dataUrl(name)
            )

            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}`
              )
            }

            const data = await response.json()

            sourceData.current[name] = data

            addSourceLayers(
              map,
              name,
              data
            )

            console.log(
              `${name}.geojson berhasil dimuat.`
            )
          } catch (error) {
            console.error(
              `Data ${name} tidak dapat dimuat:`,
              error
            )
          }
        })
      )

      loaded.current = true
      setReady(true)

      updateVisibility(
        map,
        mode,
        scenario,
        layers,
        markers,
        sourceData
      )

      /*
       * Pastikan ukuran map benar
       */
      setTimeout(() => {
        map.resize()
      }, 100)

      /*
       * Pergerakan kamera awal
       */
      map.easeTo({
        bearing: -12,
        duration: 13000,
        essential: false,
      })
    })

    return () => {
      markers.current.forEach(
        (marker) => marker.remove()
      )

      markers.current = []

      map.remove()

      mapRef.current = null
      loaded.current = false
      sourceData.current = {}
    }
  }, [])

  useEffect(() => {
    if (
      loaded.current &&
      mapRef.current
    ) {
      updateVisibility(
        mapRef.current,
        mode,
        scenario,
        layers,
        markers,
        sourceData
      )
    }
  }, [
    mode,
    scenario,
    layers,
    ready,
  ])

  const toggleScenario = (key) => {
    setScenario((previous) => ({
      ...previous,
      [key]: !previous[key],
    }))
  }

  const tokenExists =
    Boolean(import.meta.env.VITE_MAPBOX_TOKEN)

  return (
    <section
      className={`map-experience ${mode}`}
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 52px)',
        minHeight: '600px',
        overflow: 'hidden',
      }}
    >
      <div
        ref={container}
        className="map"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />

      {!tokenExists && (
        <div className="token-note">
          <strong>
            Mapbox token diperlukan
          </strong>

          <span>
            Tambahkan{' '}
            <code>
              VITE_MAPBOX_TOKEN
            </code>{' '}
            pada file <code>.env</code>.
          </span>
        </div>
      )}

      {mode === 'home' ? (
        <article className="story-box">
          <span className="eyebrow">
            GUNUNG IYA · ENDE
          </span>

          <h1>
            Jejak gunung api di tepi Laut Flores.
          </h1>

          <p>
            Sebuah ruang untuk membaca lanskap
            Gunung Iya, lokasi penting, dan arah
            evakuasi melalui peta tiga dimensi.
          </p>

          <button>
            Baca selengkapnya{' '}
            <span>→</span>
          </button>
        </article>
      ) : (
        <aside className="mitigation-panel">
          <div>
            <span className="eyebrow">
              PETA INTERAKTIF
            </span>

            <h2>
              Mitigasi
            </h2>
          </div>

          <fieldset>
            <legend>
              Pilih titik awal
            </legend>

            {[
              ['rumah', 'Rumah'],
              ['kantor', 'Kantor'],
              ['lain', 'Lokasi lain'],
            ].map(([id, label]) => (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={scenario[id]}
                  onChange={() =>
                    toggleScenario(id)
                  }
                />

                <span>
                  {label}
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>
              Layer peta
            </legend>

            {[
              [
                'rute_evakuasi_utama',
                'Rute utama',
              ],
              [
                'rute_evakuasi_alternatif',
                'Rute alternatif',
              ],
              [
                'titik_aman_lain',
                'Titik aman lain',
              ],
              [
                'rekomendasi_pemerintah',
                'Rekomendasi pemerintah',
              ],
              [
                'publik_evakuasi',
                'Evakuasi warga',
              ],
              [
                'bahaya_tsunami',
                'Bahaya tsunami',
              ],
              [
                'iya',
                'Dataset Gunung Iya',
              ],
            ].map(([id, label]) => (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={Boolean(
                    layers[id]
                  )}
                  onChange={() =>
                    setLayers(
                      (previous) => ({
                        ...previous,
                        [id]:
                          !previous[id],
                      })
                    )
                  }
                />

                <span>
                  {label}
                </span>
              </label>
            ))}
          </fieldset>
        </aside>
      )}
    </section>
  )
}

function addSourceLayers(
  map,
  name,
  data
) {
  if (!data) {
    return
  }

  if (map.getSource(name)) {
    return
  }

  const features =
    data.features || []

  if (!features.length) {
    console.warn(
      `Dataset ${name} tidak memiliki feature.`
    )
    return
  }

  const firstFeature =
    features.find(
      (feature) =>
        feature?.geometry
    )

  const kind =
    layerKind(firstFeature)

  if (!kind) {
    console.warn(
      `Geometry ${name} tidak dikenali.`
    )
    return
  }

  map.addSource(name, {
    type: 'geojson',
    data,
  })

  const color =
    colors[name] || '#ffffff'

  const layerId =
    `${name}-${kind}`

  /*
   * LINE
   */
  if (kind === 'line') {
    map.addLayer({
      id: layerId,
      type: 'line',
      source: name,

      paint: {
        'line-color': color,
        'line-width':
          name.includes('rute')
            ? 5
            : 3,
        'line-opacity': 0.9,

        'line-dasharray':
          name.includes('rute')
            ? [1.2, 1.1]
            : [1, 0],
      },
    })

    return
  }

  /*
   * POINT
   */
  if (kind === 'circle') {
    map.addLayer({
      id: layerId,
      type: 'circle',
      source: name,

      paint: {
        'circle-radius': 7,
        'circle-color': color,
        'circle-opacity': 1,

        'circle-stroke-color':
          '#10252b',

        'circle-stroke-width': 2,
      },
    })

    return
  }

  /*
   * POLYGON
   */
  if (kind === 'fill') {
    map.addLayer({
      id: layerId,
      type: 'fill',
      source: name,

      paint: {
        'fill-color': color,

        'fill-opacity':
          name === 'iya'
            ? 0.25
            : 0.32,
      },
    })

    map.addLayer({
      id: `${name}-outline`,
      type: 'line',
      source: name,

      paint: {
        'line-color': color,
        'line-width': 1.3,
      },
    })
  }
}

function updateVisibility(
  map,
  mode,
  scenario,
  controls,
  markersRef,
  sourceDataRef
) {
  if (!map) {
    return
  }

  const active =
    new Set()

  /*
   * HOME
   */
  if (mode === 'home') {
    homeVisible.forEach(
      (name) =>
        active.add(name)
    )
  }

  /*
   * MITIGASI
   */
  else {
    if (scenario.rumah) {
      [
        'lokasi_utama',
        'rute_evakuasi_utama',
        'titik_aman_utama',
        'hambatan_rute_utama',
      ].forEach((name) =>
        active.add(name)
      )
    }

    if (scenario.kantor) {
      [
        'lokasi_utama',
        'rute_evakuasi_alternatif',
        'titik_aman_alternatif',
        'hambatan_rute_alternatif',
      ].forEach((name) =>
        active.add(name)
      )
    }

    if (scenario.lain) {
      [
        'lokasi_lain',
        'seluruh_titik_aman',
        'titik_aman_lain',
      ].forEach((name) =>
        active.add(name)
      )
    }

    Object.entries(
      controls
    ).forEach(
      ([key, value]) => {
        if (value) {
          active.add(key)
        }
      }
    )
  }

  /*
   * VISIBILITY LAYERS
   */
  Object.keys(colors).forEach(
    (name) => {
      const visibility =
        active.has(name)
          ? 'visible'
          : 'none'

      const possibleLayers = [
        `${name}-fill`,
        `${name}-line`,
        `${name}-circle`,
      ]

      possibleLayers.forEach(
        (layerId) => {
          if (
            map.getLayer(layerId)
          ) {
            map.setLayoutProperty(
              layerId,
              'visibility',
              visibility
            )
          }
        }
      )

      const outlineId =
        `${name}-outline`

      if (
        map.getLayer(outlineId)
      ) {
        map.setLayoutProperty(
          outlineId,
          'visibility',
          visibility
        )
      }
    }
  )

  /*
   * REMOVE EXISTING MARKERS
   */
  markersRef.current.forEach(
    (marker) =>
      marker.remove()
  )

  markersRef.current = []

  /*
   * CALLOUT MARKERS
   */
  const markerLayers = [
    'lokasi_utama',
    'lokasi_lain',
    'titik_aman_utama',
    'titik_aman_lain',
  ]

  markerLayers.forEach(
    (name) => {
      if (!active.has(name)) {
        return
      }

      const data =
        sourceDataRef.current[name]

      if (!data?.features) {
        return
      }

      const max =
        name.includes('lokasi')
          ? 3
          : 2

      data.features
        .slice(0, max)
        .forEach((feature) => {
          const point =
            getPoint(feature)

          if (!point) {
            return
          }

          const element =
            document.createElement(
              'div'
            )

          const root =
            document.createElement(
              'div'
            )

          root.className =
            'marker-root'

          element.appendChild(root)

          const nameValue =
            feature.properties?.Name ||
            feature.properties?.NAME ||
            feature.properties?.name ||
            'Lokasi'

          const description =
            feature.properties?.Description ||
            feature.properties?.DESCRIPTION ||
            feature.properties?.description ||
            ''

          import(
            'react-dom/client'
          ).then(
            ({ createRoot }) => {
              createRoot(root).render(
                <Callout
                  name={nameValue}
                  description={description}
                />
              )
            }
          )

          const marker =
            new mapboxgl.Marker({
              element,
              anchor: 'bottom',
            })
              .setLngLat(point)
              .addTo(map)

          markersRef.current.push(
            marker
          )
        })
    }
  )
}