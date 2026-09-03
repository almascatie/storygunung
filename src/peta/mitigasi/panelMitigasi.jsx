import React, {
  useState,
} from 'react'

import {
  tampilkanLapisanMitigasi,
  sembunyikanLapisanMitigasi,
  aturSkenarioMitigasi,
} from './lapisanMitigasi'

const LAYERS = [
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
]

export function PanelMitigasi({
  map,
  siap = false,
  onTutup,
}) {
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

  function toggleScenario(key) {
    const berikutnya = {
      ...scenario,
      [key]: !scenario[key],
    }

    setScenario(berikutnya)

    aturSkenarioMitigasi(
      map,
      berikutnya
    )
  }

  function toggleLayer(key) {
    const aktif = !layers[key]

    setLayers((previous) => ({
      ...previous,
      [key]: aktif,
    }))

    if (aktif) {
      tampilkanLapisanMitigasi(
        map,
        key
      )
    } else {
      sembunyikanLapisanMitigasi(
        map,
        key
      )
    }
  }

  return (
    <aside className="mitigation-panel">
      <div className="mitigation-panel-header">
        <div>
          <span className="eyebrow">
            PETA INTERAKTIF
          </span>

          <h2>
            Mitigasi
          </h2>
        </div>

        <button
          type="button"
          className="mitigation-close"
          onClick={onTutup}
          aria-label="Tutup Mitigasi"
        >
          ×
        </button>
      </div>

      <div className="mitigation-panel-scroll">
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

          {LAYERS.map(
            ([id, label]) => (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={
                    Boolean(
                      layers[id]
                    )
                  }
                  onChange={() =>
                    toggleLayer(id)
                  }
                />

                <span>
                  {label}
                </span>
              </label>
            )
          )}
        </fieldset>

        {!siap && (
          <div className="mitigation-loading">
            Menyiapkan peta…
          </div>
        )}
      </div>
    </aside>
  )
}