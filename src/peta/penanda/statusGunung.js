import mapboxgl from 'mapbox-gl'

export function buatStatusGunung(map, data = {}) {
  if (!map) return null

  const label = data.label || 'Status'
  const level = data.level || 'Level 2'
  const coordinates = data.coordinates || [121.6410068, -8.891862]

  const element = document.createElement('div')
  element.className = 'status-gunung-marker'
  element.innerHTML = `
    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      transform:translateY(-24px);
    ">
      <div style="
        display:flex;
        align-items:center;
        gap:7px;
        padding:5px 8px;
        border:1px solid rgba(255,255,255,0.18);
        border-radius:999px;
        background:rgba(10,18,20,0.72);
        backdrop-filter:blur(8px);
        box-shadow:0 4px 16px rgba(0,0,0,0.18);
        color:#f4f1e8;
        font:600 11px/1.2 Inter,system-ui,sans-serif;
        letter-spacing:0.02em;
        white-space:nowrap;
      ">
        <span style="
          width:7px;
          height:7px;
          border-radius:50%;
          background:#e64b5d;
          box-shadow:0 0 0 2px rgba(230,75,93,0.18);
          flex:none;
        "></span>
        <span>${label} ${level}</span>
      </div>
      <span style="
        width:1px;
        height:24px;
        background:rgba(255,255,255,0.42);
      "></span>
    </div>
  `

  return new mapboxgl.Marker({
    element,
    anchor: 'bottom',
  })
    .setLngLat(coordinates)
    .addTo(map)
}

export function hapusStatusGunung(marker) {
  if (!marker) return
  marker.remove()
}