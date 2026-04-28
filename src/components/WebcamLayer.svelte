<script lang="ts">
  /**
   * WebcamLayer.svelte — renders webcam markers on the MapLibre map.
   *
   * Accepts the map instance as a prop. Mounts markers when active,
   * removes them when destroyed or layer switches away from 'webcams'.
   *
   * Task 11: webcam icons on map + popup with name, source, and URL.
   */
  import { onDestroy } from 'svelte'
  import { get } from 'svelte/store'
  import maplibregl from 'maplibre-gl'
  import { _ } from 'svelte-i18n'
  import type maplibreglTypes from 'maplibre-gl'
  import webcamsRaw from '../data/webcams.json'

  export let map: maplibreglTypes.Map

  interface Webcam {
    id: string
    name: string
    nameGl: string
    lat: number
    lon: number
    url: string | null
    source: string
    mock: boolean
  }

  const webcams = webcamsRaw as Webcam[]

  const markers: maplibreglTypes.Marker[] = []
  const popups: maplibreglTypes.Popup[] = []

  function buildWebcamEl(webcam: Webcam): HTMLButtonElement {
    const el = document.createElement('button')
    el.setAttribute('aria-label', webcam.nameGl ?? webcam.name)
    el.style.cssText = `
      background: rgba(255,255,255,0.92);
      border: 1.5px solid #d4d4d4;
      border-radius: 999px;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.45);
      cursor: pointer;
      padding: 0;
      transition: transform 0.15s, border-color 0.15s;
    `
    // Camera SVG icon
    el.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
           stroke="#5A5A5A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M23 7l-7 5 7 5V7z"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    `
    return el
  }

  function buildPopupHTML(webcam: Webcam): string {
    const title = webcam.nameGl ?? webcam.name
    const mockLabel = webcam.mock ? ' <span style="color:#9A9A9A;">(demo)</span>' : ''
    const t = get(_)
    const linkHTML = webcam.url
      ? `<a href="${webcam.url}" target="_blank" rel="noopener noreferrer"
            style="display:block;margin-top:6px;font-size:11px;color:#185FA5;text-decoration:underline;">
            ${t('webcam.open')}
          </a>`
      : `<span style="display:block;margin-top:6px;font-size:11px;color:#9A9A9A;">${t('webcam.unavailable')}</span>`

    return `
      <div style="font-family:system-ui,sans-serif;min-width:160px;max-width:220px;">
        <p style="font-size:13px;font-weight:500;color:#1A1A1A;margin:0 0 2px;">${title}${mockLabel}</p>
        <p style="font-size:11px;color:#9A9A9A;margin:0;">${t('webcam.source', { values: { source: webcam.source } })}</p>
        ${linkHTML}
      </div>
    `
  }

  function addMarkers() {
    for (const webcam of webcams) {
      const el = buildWebcamEl(webcam)

      const popup = new maplibregl.Popup({
        offset: 20,
        closeButton: true,
        maxWidth: '240px',
      }).setHTML(buildPopupHTML(webcam))

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([webcam.lon, webcam.lat])
        .setPopup(popup)
        .addTo(map)

      markers.push(marker)
      popups.push(popup)
    }
  }

  // Add markers immediately when component mounts
  addMarkers()

  onDestroy(() => {
    for (const marker of markers) marker.remove()
    for (const popup of popups) popup.remove()
    markers.length = 0
    popups.length = 0
  })
</script>
