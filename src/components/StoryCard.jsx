import React, {
  useState,
} from 'react'

import './StoryCard.css'

export function StoryCard() {
  const [terbuka, setTerbuka] =
    useState(true)

  return (
    <article
      className={`story-card ${
        terbuka
          ? 'story-card-open'
          : 'story-card-closed'
      }`}
    >

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="story-card-header">

        <div className="story-card-heading">

          <span className="story-card-eyebrow">
            GUNUNG IYA · ENDE
          </span>

          <div className="story-card-status">
            Level II · Waspada
          </div>

          <div className="story-card-date">
            Iya, Kamis — 03 September 2026 ·
            00:00–24:00 WITA
          </div>

        </div>


        {/* =================================================
            TOGGLE
            ================================================= */}

        <button
          type="button"
          className="story-card-toggle"
          onClick={() =>
            setTerbuka(!terbuka)
          }
          aria-label={
            terbuka
              ? 'Tutup cerita'
              : 'Buka cerita'
          }
          aria-expanded={terbuka}
        >
          <span
            className="story-card-chevron"
            aria-hidden="true"
          >
            {terbuka ? '⌃' : '⌄'}
          </span>
        </button>

      </div>


      {/* =====================================================
          CONTENT
          Seluruh bagian ini ikut tertutup bersama card.
          ===================================================== */}

      <div className="story-card-content">

        {/* =================================================
            CERITA GUNUNG
            ================================================= */}

        <section className="story-today">

          <span className="story-label">
            CERITA GUNUNG HARI INI
          </span>

          <p>
            Hari ini Gunung Iya masih merekam
            aktivitas dari dalam tubuhnya.
            Tercatat 2 gempa Vulkanik Dalam,
            yang berkaitan dengan tekanan atau
            pergerakan magma di kedalaman gunung.
          </p>

          <p>
            Di sekitar Gunung Iya juga tercatat
            11 gempa Tektonik Lokal dan 45 gempa
            Tektonik Jauh. Satu gempa terasa
            dengan skala II MMI.
          </p>

          <p>
            Kegempaan tersebut menjadi bagian
            dari pengamatan aktivitas Gunung Iya
            hari ini. Perubahan aktivitas gunung
            perlu dilihat dari rekaman pengamatan
            berikutnya, bukan dari satu jenis
            gempa saja.
          </p>

        </section>


        {/* =================================================
            TABEL KEGEMPAAN
            ================================================= */}

        <section className="seismic-table">

          <div className="seismic-row seismic-head">

            <div>
              Jenis Kegempaan
            </div>

            <div>
              Jumlah
            </div>

            <div>
              Parameter
            </div>

          </div>


          {/* Vulkanik Dalam */}

          <div className="seismic-row">

            <div className="quake-type">
              Vulkanik Dalam
            </div>

            <div className="quake-count">
              2 kali
            </div>

            <div className="quake-detail">

              <div>
                Amplitudo 3.34–7.38 mm
              </div>

              <div>
                S-P 1.1–2.32 detik
              </div>

              <div>
                Lama gempa 21.17–28.02 detik
              </div>

            </div>

          </div>


          {/* Tektonik Lokal */}

          <div className="seismic-row">

            <div className="quake-type">
              Tektonik Lokal
            </div>

            <div className="quake-count">
              11 kali
            </div>

            <div className="quake-detail">

              <div>
                Amplitudo 3.7–41.2 mm
              </div>

              <div>
                S-P 4.61–10.73 detik
              </div>

              <div>
                Lama gempa 35.71–43.65 detik
              </div>

            </div>

          </div>


          {/* Gempa Terasa */}

          <div className="seismic-row">

            <div className="quake-type">
              Gempa Terasa
            </div>

            <div className="quake-count">
              1 kali
            </div>

            <div className="quake-detail">

              <div>
                Skala II MMI
              </div>

              <div>
                Amplitudo 41.2 mm
              </div>

              <div>
                S-P tidak teramati
              </div>

              <div>
                Lama gempa 147.46 detik
              </div>

            </div>

          </div>


          {/* Tektonik Jauh */}

          <div className="seismic-row">

            <div className="quake-type">
              Tektonik Jauh
            </div>

            <div className="quake-count">
              45 kali
            </div>

            <div className="quake-detail">

              <div>
                Amplitudo 1.8–38.21 mm
              </div>

              <div>
                S-P 11–32.05 detik
              </div>

              <div>
                Lama gempa 47.56–108.28 detik
              </div>

            </div>

          </div>

        </section>

      </div>

    </article>
  )
}