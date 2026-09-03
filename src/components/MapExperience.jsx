import React, {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  buatPeta,
  hancurkanPeta,
} from '../peta/peta'

import {
  muatLapisanKrb,
} from '../peta/lapisan/lapisanKrb'

import {
  muatLapisanLaharHujan,
  buatLabelLaharHujan,
  hapusLabelLaharHujan,
} from '../peta/penanda/laharHujan'

import {
  mulaiRadarKrb,
  hentikanRadarKrb,
} from '../peta/animasi/radarKrb'

import {
  mulaiLaharHujan,
  hentikanLaharHujan,
} from '../peta/animasi/animasiLaharHujan'

import {
  buatStatusGunung,
  hapusStatusGunung,
} from '../peta/penanda/statusGunung'

import {
  pasangAtributKrb,
} from '../peta/penanda/atributKrb'

import {
  MitigasiExperience,
} from '../peta/mitigasi/MitigasiExperience'

import {
  KontrolPeta,
} from '../peta/kontrol/KontrolPeta'

const HOME_CAMERA = {
  center: [121.63439, -8.91708],
  zoom: 12.7,
  pitch: 61,
  bearing: -26,
}

const MITIGASI_CAMERA = {
  center: [121.64212, -8.84448],
  zoom: 13.14,
  pitch: 0,
  bearing: 58.40,
}

const DURASI_TRANSISI = 1800

export function MapExperience({ mode }) {
  const container = useRef(null)

  const [mapInstance, setMapInstance] =
    useState(null)

  const [modeLokal, setModeLokal] =
    useState(
      typeof mode === 'string'
        ? mode
        : 'home'
    )

  useEffect(() => {
    if (typeof mode === 'string') {
      setModeLokal(mode)
    }
  }, [mode])

  const modeSekarang = modeLokal

  /*
   * Event global tetap dipertahankan.
   */
  useEffect(() => {
    const bukaMitigasi = () => {
      setModeLokal('mitigasi')
    }

    const tutupMitigasi = () => {
      setModeLokal('home')
    }

    window.addEventListener(
      'buka-mitigasi',
      bukaMitigasi
    )

    window.addEventListener(
      'tutup-mitigasi',
      tutupMitigasi
    )

    return () => {
      window.removeEventListener(
        'buka-mitigasi',
        bukaMitigasi
      )

      window.removeEventListener(
        'tutup-mitigasi',
        tutupMitigasi
      )
    }
  }, [])

  /*
   * Buat peta satu kali.
   */
  useEffect(() => {
    if (!container.current) {
      return
    }

    let map = null
    let hapusAtribut = null
    let statusMarker = null
    let labelLaharHujan = null

    const mulai = async () => {
      try {
        map = buatPeta(
          container.current
        )

        setMapInstance(map)

        map.once(
          'load',
          async () => {
            try {
              await muatLapisanKrb(
                map
              )

              const dataLaharHujan =
                await muatLapisanLaharHujan(
                  map
                )

              labelLaharHujan =
                buatLabelLaharHujan(
                  map,
                  dataLaharHujan
                )

              mulaiLaharHujan(
                map,
                dataLaharHujan
              )

              mulaiRadarKrb(map)

              hapusAtribut =
                pasangAtributKrb(map)

              statusMarker =
                buatStatusGunung(
                  map,
                  {
                    label: 'Status',
                    level: 'Level 2',
                    coordinates: [
                      121.6410068,
                      -8.891862,
                    ],
                  }
                )
            } catch (error) {
              console.error(
                'Gagal memuat komponen peta:',
                error
              )
            }
          }
        )
      } catch (error) {
        console.error(
          'Gagal menjalankan peta:',
          error
        )
      }
    }

    mulai()

    return () => {
      if (hapusAtribut) {
        hapusAtribut()
      }

      hapusStatusGunung(
        statusMarker
      )

      hapusLabelLaharHujan(
        labelLaharHujan
      )

      if (map) {
        hentikanLaharHujan(map)
        hentikanRadarKrb(map)
        hancurkanPeta(map)
      }

      setMapInstance(null)
    }
  }, [])

  /*
   * MASUK MODE MITIGASI
   */
  const masukMitigasi = () => {
    const map = mapInstance

    if (!map) {
      setModeLokal('mitigasi')
      return
    }

    map.stop()

    map.flyTo({
      center: MITIGASI_CAMERA.center,
      zoom: MITIGASI_CAMERA.zoom,
      pitch: MITIGASI_CAMERA.pitch,
      bearing: MITIGASI_CAMERA.bearing,
      duration: DURASI_TRANSISI,
      essential: true,
    })

    setModeLokal('mitigasi')

    window.dispatchEvent(
      new CustomEvent(
        'buka-mitigasi'
      )
    )
  }

  /*
   * KEMBALI HOME
   */
  const kembaliHome = () => {
    const map = mapInstance

    if (!map) {
      setModeLokal('home')
      return
    }

    map.stop()

    map.flyTo({
      center: HOME_CAMERA.center,
      zoom: HOME_CAMERA.zoom,
      pitch: HOME_CAMERA.pitch,
      bearing: HOME_CAMERA.bearing,
      duration: DURASI_TRANSISI,
      essential: true,
    })

    setModeLokal('home')

    window.dispatchEvent(
      new CustomEvent(
        'tutup-mitigasi'
      )
    )
  }

  return (
    <section
      className={`map-experience ${modeSekarang}`}
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

      <KontrolPeta
        map={mapInstance}
      />

      {modeSekarang === 'home' && (
        <div className="home-story">
          <button
            type="button"
            className="mitigation-action"
            onClick={masukMitigasi}
          >
            <span>
              Mitigasi & Evakuasi
            </span>

            <span>
              →
            </span>
          </button>

          <article className="story-box">
            <span className="eyebrow">
              GUNUNG IYA · ENDE
            </span>

            <h1>
              Jejak gunung api di tepi Laut Flores.
            </h1>

            <p>
              Sebuah ruang untuk membaca lanskap
              Gunung Iya, perubahan aktivitasnya,
              serta memahami apa yang perlu
              diperhatikan di sekitarnya.
            </p>

            <button type="button">
              Baca selengkapnya
              <span>→</span>
            </button>
          </article>
        </div>
      )}

      <MitigasiExperience
        map={mapInstance}
        aktif={
          modeSekarang === 'mitigasi'
        }
        onTutup={
          kembaliHome
        }
      />
    </section>
  )
}