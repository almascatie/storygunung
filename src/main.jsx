import React, { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { MapExperience } from './components/MapExperience'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ContentPage } from './components/ContentPage'

function App() {
  const [page, setPage] = useState('map')
  const [mapMode, setMapMode] = useState('home')
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)

  const [disclaimer, setDisclaimer] = useState(null)
  const [sejarah, setSejarah] = useState(null)
  const [tentang, setTentang] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/data/disclaimer.json').then((response) => response.json()),
      fetch('/data/sejarah.json').then((response) => response.json()),
      fetch('/data/tentang.json').then((response) => response.json()),
    ])
      .then(([disclaimerData, sejarahData, tentangData]) => {
        setDisclaimer(disclaimerData)
        setSejarah(sejarahData)
        setTentang(tentangData)
      })
      .catch((error) => {
        console.error('Gagal memuat data JSON:', error)
      })
  }, [])

  const openMap = (mode) => {
    setPage('map')
    setMapMode(mode)
  }

  const navigate = (target) => {
    if (target === 'home' || target === 'mitigasi') {
      openMap(target)
    } else {
      setPage(target)
    }
  }

  const content =
    page === 'sejarah'
      ? sejarah
      : page === 'tentang'
        ? tentang
        : null

  return (
    <div className="app-shell">
      <Header
        page={page}
        mapMode={mapMode}
        onNavigate={navigate}
      />

      <main>
        {page === 'map' ? (
          <MapExperience mode={mapMode} />
        ) : (
          <ContentPage
            kind={page}
            data={content}
          />
        )}
      </main>

      <Footer
        onNavigate={navigate}
        onDisclaimer={() => setDisclaimerOpen(true)}
      />

      {disclaimerOpen && disclaimer && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setDisclaimerOpen(false)}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="disclaimer-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              onClick={() => setDisclaimerOpen(false)}
              aria-label="Tutup"
            >
              ×
            </button>

            <span className="eyebrow">
              INFORMASI
            </span>

            <h2 id="disclaimer-title">
              {disclaimer.title}
            </h2>

            <p>
              {disclaimer.intro}
            </p>

            <div className="source-list">
              {disclaimer.sources.map((source) => (
                <article key={source.id}>
                  <strong>
                    {source.name}
                  </strong>

                  <p>
                    {source.role}
                  </p>

                  <small>
                    {source.limitations}
                  </small>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

createRoot(
  document.getElementById('root')
).render(
  <StrictMode>
    <App />
  </StrictMode>
)