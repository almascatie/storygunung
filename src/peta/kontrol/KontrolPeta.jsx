import React, {
  useEffect,
  useRef,
  useState,
} from 'react'

function ikonPutar() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 11a8 8 0 0 0-14.9-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M5 3v4h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M4 13a8 8 0 0 0 14.9 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M19 21v-4h-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ikonPlus() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ikonMinus() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function KontrolPeta({ map }) {
  const [memutar, setMemutar] = useState(false)

  const dragRef = useRef({
    aktif: false,
    pointerId: null,
    xAwal: 0,
    bearingAwal: 0,
  })

  useEffect(() => {
    return () => {
      dragRef.current.aktif = false
    }
  }, [])

  if (!map) {
    return null
  }

  const mulaiPutar = (event) => {
    if (!map || map.isRemoved?.()) {
      return
    }

    event.preventDefault()

    dragRef.current = {
      aktif: true,
      pointerId: event.pointerId,
      xAwal: event.clientX,
      bearingAwal: map.getBearing(),
    }

    setMemutar(true)

    event.currentTarget.setPointerCapture?.(
      event.pointerId
    )
  }

  const gerakPutar = (event) => {
    const drag = dragRef.current

    if (
      !drag.aktif ||
      drag.pointerId !== event.pointerId
    ) {
      return
    }

    event.preventDefault()

    const deltaX =
      event.clientX - drag.xAwal

    /*
     * Sensitivitas putaran.
     *
     * 2 pixel drag ≈ 1 derajat.
     * Nilainya cukup ringan untuk mouse
     * tetapi tetap nyaman untuk touch.
     */
    const bearing =
      drag.bearingAwal +
      deltaX * 0.5

    map.setBearing(bearing)
  }

  const selesaiPutar = (event) => {
    const drag = dragRef.current

    if (
      !drag.aktif ||
      drag.pointerId !== event.pointerId
    ) {
      return
    }

    dragRef.current.aktif = false
    dragRef.current.pointerId = null

    setMemutar(false)

    try {
      event.currentTarget.releasePointerCapture?.(
        event.pointerId
      )
    } catch {
      // Tidak perlu melakukan apa pun.
    }
  }

  const zoomIn = () => {
    if (!map || map.isRemoved?.()) {
      return
    }

    map.zoomIn({
      duration: 280,
    })
  }

  const zoomOut = () => {
    if (!map || map.isRemoved?.()) {
      return
    }

    map.zoomOut({
      duration: 280,
    })
  }

  return (
    <div
  className="kontrol-peta"
  style={{
    position: 'absolute',
    zIndex: 10,
    top: '24px',
    right: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    userSelect: 'none',
    touchAction: 'none',
  }}
>
      <button
        type="button"
        aria-label="Putar peta"
        title="Geser kiri atau kanan untuk memutar peta"
        onPointerDown={mulaiPutar}
        onPointerMove={gerakPutar}
        onPointerUp={selesaiPutar}
        onPointerCancel={selesaiPutar}
        style={{
          width: '58px',
          height: '58px',
          padding: 0,
          border: '1px solid rgba(255,255,255,0.22)',
          borderRadius: '50%',
          background: memutar
            ? 'rgba(13,27,29,0.94)'
            : 'rgba(13,27,29,0.82)',
          color: '#f4f1e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: memutar
            ? 'grabbing'
            : 'grab',
          boxShadow:
            '0 8px 24px rgba(0,0,0,0.28)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          transition:
            'background 160ms ease, transform 160ms ease',
          transform: memutar
            ? 'scale(0.96)'
            : 'scale(1)',
          touchAction: 'none',
        }}
      >
        {ikonPutar()}
      </button>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border:
            '1px solid rgba(255,255,255,0.22)',
          borderRadius: '14px',
          background: 'rgba(13,27,29,0.82)',
          boxShadow:
            '0 8px 24px rgba(0,0,0,0.28)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <button
          type="button"
          aria-label="Perbesar peta"
          title="Perbesar"
          onClick={zoomIn}
          style={{
            width: '44px',
            height: '42px',
            padding: 0,
            border: 0,
            borderBottom:
              '1px solid rgba(255,255,255,0.14)',
            background: 'transparent',
            color: '#f4f1e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
        >
          {ikonPlus()}
        </button>

        <button
          type="button"
          aria-label="Perkecil peta"
          title="Perkecil"
          onClick={zoomOut}
          style={{
            width: '44px',
            height: '42px',
            padding: 0,
            border: 0,
            background: 'transparent',
            color: '#f4f1e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
        >
          {ikonMinus()}
        </button>
      </div>
    </div>
  )
}