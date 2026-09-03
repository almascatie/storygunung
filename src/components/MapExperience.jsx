import React, { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { muatLapisanKrb } from '../peta/lapisan/lapisanKrb'
import { mulaiRadarKrb, hentikanRadarKrb } from '../peta/animasi/radarKrb'

function sembunyikanLabelNonKota(map) {
  const layers = map.getStyle()?.layers || []

  layers.forEach((layer) => {
    if (layer.type !== 'symbol') return

    const id = String(layer.id || '').toLowerCase()
    const sourceLayer = String(layer['source-layer'] || '').toLowerCase()
    const filter = JSON.stringify(layer.filter || '').toLowerCase()

    const teks = `${id} ${sourceLayer} ${filter}`

    // Label yang jelas bukan kota
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

    if (bukanKota) {
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
    }
  })
}

export function MapExperience() {
  const container = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!container.current || mapRef.current) return

    const token = import.meta.env.VITE_MAPBOX_TOKEN

    console.log(
      'Mapbox token:',
      token ? 'TERBACA' : 'TIDAK TERBACA'
    )

    if (!token) {
      console.error('VITE_MAPBOX_TOKEN tidak ditemukan.')
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

      // =========================
      // TERRAIN 3D
      // =========================

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

      // =========================
      // LABEL PETA
      // Kota tetap.
      // Desa/kampung/kecamatan disembunyikan.
      // =========================

      sembunyikanLabelNonKota(map)

      // =========================
      // KRB
      // =========================

      try {
        console.log('Memuat lapisan KRB...')

        await muatLapisanKrb(map)

        console.log('Lapisan KRB berhasil dimuat.')

        mulaiRadarKrb(map)

        console.log('Radar KRB aktif.')
      } catch (error) {
        console.error(
          'Gagal memuat lapisan KRB:',
          error
        )
      }

      setTimeout(() => {
        map.resize()
      }, 100)

      // =========================
      // GERAKAN KAMERA
      // =========================

      map.easeTo({
        bearing: -12,
        duration: 13000,
        essential: false,
      })
    })

    return () => {
      hentikanRadarKrb(map)
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <section
      className="map-experience"
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
    </section>
  )
}