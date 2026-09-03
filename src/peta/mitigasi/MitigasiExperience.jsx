import React, {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  masukMitigasi,
  keluarMitigasi,
} from './mitigasi'

import {
  matikanSemuaLapisanMitigasi,
} from './lapisanMitigasi'

import {
  PanelMitigasi,
} from './panelMitigasi'

export function MitigasiExperience({
  map,
  aktif = false,
  onTutup,
}) {
  const prosesMasuk = useRef(false)
  const sudahMasuk = useRef(false)

  const [siap, setSiap] = useState(false)

  useEffect(() => {
    if (!map) {
      return
    }

    let batal = false

    async function buka() {
      if (prosesMasuk.current) {
        return
      }

      prosesMasuk.current = true

      try {
        await masukMitigasi(map)

        if (batal) {
          return
        }

        sudahMasuk.current = true
        setSiap(true)
      } catch (error) {
        console.error(
          'Gagal masuk mode Mitigasi:',
          error
        )
      } finally {
        prosesMasuk.current = false
      }
    }

    function tutup() {
      if (!sudahMasuk.current) {
        return
      }

      keluarMitigasi(map)

      sudahMasuk.current = false
      setSiap(false)
    }

    if (aktif) {
      buka()
    } else {
      tutup()
    }

    return () => {
      batal = true
    }
  }, [map, aktif])

  useEffect(() => {
    return () => {
      if (!map) {
        return
      }

      if (sudahMasuk.current) {
        matikanSemuaLapisanMitigasi(map)
        sudahMasuk.current = false
      }
    }
  }, [map])

  if (!aktif) {
    return null
  }

  return (
    <div className="mitigasi-experience">
      <PanelMitigasi
        map={map}
        siap={siap}
        onTutup={onTutup}
      />
    </div>
  )
}