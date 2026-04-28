<script lang="ts">
  /**
   * SatelliteLayer.svelte — RainViewer radar tile overlay (Task 12).
   *
   * Fetches the available radar tile timestamps from RainViewer's public API,
   * adds them as raster tile layers in MapLibre, and plays an animation loop.
   *
   * The component is mounted/unmounted by Map.svelte when activeLayer === 'satellite'.
   * It removes all its layers and sources on destroy, leaving no trace in the map.
   */
  import { onDestroy, onMount } from 'svelte'
  import { _ } from 'svelte-i18n'
  import type maplibreglTypes from 'maplibre-gl'

  export let map: maplibreglTypes.Map

  // ── State ─────────────────────────────────────────────────────────────────────

  let frames: number[] = []       // unix timestamps
  let currentFrame = 0
  let playing = true
  let error = false
  let animTimer: ReturnType<typeof setTimeout> | null = null
  const FRAME_INTERVAL_MS = 500

  // RainViewer tile URL template (radar past+nowcast, color 2, smooth, snow)
  function tileUrl(ts: number): string {
    return `https://tilecache.rainviewer.com/v2/radar/${ts}/256/{z}/{x}/{y}/2/1_1.png`
  }

  function sourceId(ts: number): string { return `rainviewer-${ts}` }
  function layerId(ts: number): string  { return `rainviewer-layer-${ts}` }

  // ── RainViewer API ─────────────────────────────────────────────────────────────

  async function loadFrames() {
    try {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json')
      if (!res.ok) throw new Error(`RainViewer HTTP ${res.status}`)
      const data = await res.json() as {
        radar?: { past?: Array<{ time: number }>; nowcast?: Array<{ time: number }> }
      }
      const past = data.radar?.past ?? []
      const nowcast = data.radar?.nowcast ?? []
      frames = [...past, ...nowcast].map((f) => f.time)
    } catch {
      error = true
    }
  }

  // ── Layer management ──────────────────────────────────────────────────────────

  function addAllLayers() {
    for (let i = 0; i < frames.length; i++) {
      const ts = frames[i]
      const id = sourceId(ts)
      const lid = layerId(ts)

      if (!map.getSource(id)) {
        map.addSource(id, {
          type: 'raster',
          tiles: [tileUrl(ts)],
          tileSize: 256,
          attribution: 'RainViewer',
        })
      }

      if (!map.getLayer(lid)) {
        map.addLayer({
          id: lid,
          type: 'raster',
          source: id,
          layout: { visibility: 'none' },
          paint: { 'raster-opacity': 0.7 },
        })
      }
    }
  }

  function showFrame(index: number) {
    if (frames.length === 0) return
    for (let i = 0; i < frames.length; i++) {
      const vis = i === index ? 'visible' : 'none'
      const lid = layerId(frames[i])
      if (map.getLayer(lid)) {
        map.setLayoutProperty(lid, 'visibility', vis)
      }
    }
  }

  function startAnimation() {
    if (frames.length === 0) return
    function step() {
      showFrame(currentFrame)
      currentFrame = (currentFrame + 1) % frames.length
      if (playing) {
        animTimer = setTimeout(step, FRAME_INTERVAL_MS)
      }
    }
    step()
  }

  function stopAnimation() {
    playing = false
    if (animTimer) { clearTimeout(animTimer); animTimer = null }
    // Show last frame when paused
    if (frames.length > 0) {
      const last = frames.length - 1
      showFrame(last)
      currentFrame = last
    }
  }

  function togglePlay() {
    if (playing) {
      stopAnimation()
    } else {
      playing = true
      startAnimation()
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────────

  function removeAllLayers() {
    stopAnimation()
    for (const ts of frames) {
      const lid = layerId(ts)
      const sid = sourceId(ts)
      if (map.getLayer(lid)) map.removeLayer(lid)
      if (map.getSource(sid)) map.removeSource(sid)
    }
    frames = []
  }

  onMount(async () => {
    await loadFrames()
    if (!error && frames.length > 0) {
      addAllLayers()
      startAnimation()
    }
  })

  onDestroy(() => {
    removeAllLayers()
  })
</script>

<!-- Play/pause control overlay — positioned top-left, below header -->
{#if !error}
  <div
    class="absolute z-10"
    style="top:12px; left:12px;"
  >
    <button
      class="flex items-center gap-1.5 rounded-full"
      style="
        background: rgba(255,255,255,0.92);
        border: 1.5px solid #d4d4d4;
        padding: 5px 10px 5px 8px;
        font-size: 11px;
        font-family: system-ui, sans-serif;
        color: #1A1A1A;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
      "
      on:click={togglePlay}
    >
      {#if playing}
        <!-- Pause icon -->
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="2" y="1" width="3" height="10" rx="1" fill="#1A1A1A"/>
          <rect x="7" y="1" width="3" height="10" rx="1" fill="#1A1A1A"/>
        </svg>
        Pausar
      {:else}
        <!-- Play icon -->
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M2 1.5L10 6L2 10.5V1.5Z" fill="#1A1A1A"/>
        </svg>
        Reproducir
      {/if}
    </button>
  </div>
{:else}
  <div
    class="absolute z-10"
    style="top:12px; left:12px;"
  >
    <div
      style="
        background: rgba(255,255,255,0.92);
        border: 1.5px solid #E8E5DF;
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 11px;
        font-family: system-ui, sans-serif;
        color: #9A9A9A;
      "
    >
      {$_('webcam.unavailable')}
    </div>
  </div>
{/if}
