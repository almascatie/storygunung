import {
  muatLapisanMitigasi,
  tampilkanLapisanMitigasi,
  sembunyikanLapisanMitigasi,
  matikanSemuaLapisanMitigasi,
} from './lapisanMitigasi'

const PUSAT_MITIGASI = [121.63984, -8.84587]

const ZOOM_MITIGASI = 12.7
const PITCH_MITIGASI = 61

let modeMitigasiAktif = false

export async function masukMitigasi(map) {
  if (!map) {
    return
  }

  modeMitigasiAktif = true

  /*
   * Hentikan seluruh animasi kamera yang sedang berjalan.
   * Ini menghentikan easeTo/flyTo yang sedang aktif.
   */
  map.stop()

  /*
   * Putar kamera Home menggunakan requestAnimationFrame
   * sehingga juga perlu dihentikan melalui flag/event dari peta.js.
   */
  window.dispatchEvent(
    new CustomEvent('hentikan-putaran-peta')
  )

  /*
   * Pindahkan kamera ke pusat Mitigasi.
   * Tidak dianimasikan agar tidak terjadi gerakan tambahan.
   */
  map.jumpTo({
    center: PUSAT_MITIGASI,
    zoom: ZOOM_MITIGASI,
    pitch: PITCH_MITIGASI,
  })

  console.log(
    '>>> MODE MITIGASI: KAMERA DIHENTIKAN'
  )

  console.log(
    '>>> PUSAT MITIGASI:',
    PUSAT_MITIGASI
  )

  /*
   * Pastikan semua dataset Mitigasi sudah benar-benar
   * ada sebelum visibility diatur.
   */
  await muatLapisanMitigasi(map)

  if (!modeMitigasiAktif) {
    return
  }

  /*
   * Default Mitigasi mengikuti struktur lama:
   *
   * iya
   * lokasi utama/lain ditentukan oleh scenario
   * layer tambahan dikendalikan panel.
   */
  tampilkanLapisanMitigasi(
    map,
    'lokasi_utama'
  )

  console.log(
    '>>> MODE MITIGASI SIAP'
  )
}

export function keluarMitigasi(map) {
  if (!map) {
    return
  }

  modeMitigasiAktif = false

  matikanSemuaLapisanMitigasi(map)

  /*
   * Kembalikan putaran Home.
   */
  window.dispatchEvent(
    new CustomEvent('mulai-putaran-peta')
  )

  console.log(
    '>>> KELUAR MODE MITIGASI'
  )
}

export function aktifMitigasi() {
  return modeMitigasiAktif
}