const IMAGE_ID = 'lahar-hujan-flow'
const LAYER_ID = 'lahar-hujan-flow'

let frameId = null
let aktif = false
let posisi = 0
let waktuTerakhir = 0

const UKURAN = 96
const INTERVAL = 40
const KECEPATAN = 1.8

function buatPattern(offset) {
  const data = new Uint8Array(UKURAN * UKURAN * 4)

  for (let y = 0; y < UKURAN; y += 1) {
    for (let x = 0; x < UKURAN; x += 1) {
      const index = (y * UKURAN + x) * 4

      const diagonal = (x + y + offset) % UKURAN
      const jarak = Math.min(
        diagonal,
        UKURAN - diagonal
      )

      let alpha = 0

      if (jarak < 3) {
        alpha = 130
      } else if (jarak < 7) {
        alpha = 65
      } else if (jarak < 11) {
        alpha = 20
      }

      data[index] = 255
      data[index + 1] = 236
      data[index + 2] = 90
      data[index + 3] = alpha
    }
  }

  return {
    width: UKURAN,
    height: UKURAN,
    data,
  }
}

function pasangPattern(map) {
  if (map.hasImage(IMAGE_ID)) {
    map.updateImage(
      IMAGE_ID,
      buatPattern(0)
    )
    return
  }

  map.addImage(
    IMAGE_ID,
    buatPattern(0),
    {
      pixelRatio: 1,
    }
  )
}

function pasangLayer(map) {
  if (map.getLayer(LAYER_ID)) return

  map.addLayer(
    {
      id: LAYER_ID,
      type: 'fill',
      source: 'lahar-hujan',
      paint: {
        'fill-pattern': IMAGE_ID,
        'fill-opacity': 0.85,
      },
    },
    map.getLayer('lahar-hujan-line')
      ? 'lahar-hujan-line'
      : undefined
  )
}

export function mulaiLaharHujan(map, data) {
  if (!map || !data?.features?.length) {
    console.warn(
      'Data aliran lahar hujan tidak tersedia untuk animasi.'
    )
    return
  }

  if (aktif) return

  pasangPattern(map)
  pasangLayer(map)

  posisi = 0
  waktuTerakhir = 0
  aktif = true

  console.log(
    '>>> ANIMASI LAHAR HUJAN DIMULAI'
  )

  function frame(waktu) {
    if (!aktif || !map) return

    if (waktu - waktuTerakhir >= INTERVAL) {
      posisi += KECEPATAN

      if (posisi >= UKURAN) {
        posisi = 0
      }

      map.updateImage(
        IMAGE_ID,
        buatPattern(Math.floor(posisi))
      )

      waktuTerakhir = waktu
    }

    frameId =
      window.requestAnimationFrame(frame)
  }

  frameId =
    window.requestAnimationFrame(frame)
}

export function hentikanLaharHujan(map) {
  aktif = false

  if (frameId !== null) {
    window.cancelAnimationFrame(frameId)
    frameId = null
  }

  if (map?.getLayer(LAYER_ID)) {
    map.removeLayer(LAYER_ID)
  }

  if (map?.hasImage(IMAGE_ID)) {
    map.removeImage(IMAGE_ID)
  }

  posisi = 0
  waktuTerakhir = 0

  console.log(
    '>>> ANIMASI LAHAR HUJAN DIHENTIKAN'
  )
}