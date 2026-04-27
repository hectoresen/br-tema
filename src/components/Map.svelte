<script lang="ts">
  /**
   * Map.svelte — MapLibre GL map of Galicia.
   *
   * Tasks covered: 9.1 init · 9.2 province layers · 9.3 icon markers ·
   *                9.4 hover tooltip · 9.5 select province · 9.6 select concello ·
   *                9.7 visual highlight · 9.8 mapLevel flag · 9.9 responsive
   */
  import { onMount, onDestroy, tick } from 'svelte'
  import { get } from 'svelte/store'
  import maplibregl from 'maplibre-gl'
  import 'maplibre-gl/dist/maplibre-gl.css'
  import { _ } from 'svelte-i18n'

  import { MAP_STYLE_URL, GALICIA_CENTER, GALICIA_ZOOM } from '../config/map'
  import { PROVINCE_CENTRES } from '../config/provinces'
  import {
    selectedProvince,
    selectedConcello,
    selectedDay,
    selectedTimeSlot,
    concellosGeoJSONLoaded,
    DAYS_AHEAD,
  } from '../stores/index'
  import { forecastData } from '../stores/forecast'
  import { getWeatherIcon } from '../icons/get-weather-icon'
  import { ICON_SVGS } from '../icons/icon-strings'
  import type { SlotForecast, TimeSlot } from '../types/forecast'
  import type { WeatherIconId } from '../types/weather-icon'
  import MapPlaceholder from './MapPlaceholder.svelte'
  import provincesGeoJSON from '../data/galicia-provinces.geojson'

  // ── Config ──────────────────────────────────────────────────────────────────

  /** Controls which interactive level is active: province clicks or concello clicks */
  export let mapLevel: 'province' | 'concello' = 'province'

  const PROVINCE_IDS = ['corunha', 'lugo', 'ourense', 'pontevedra'] as const
  type ProvinceId = (typeof PROVINCE_IDS)[number]

  // ── State ────────────────────────────────────────────────────────────────────

  let mapEl: HTMLDivElement
  let map: maplibregl.Map | null = null
  let mapReady = false

  // Marker DOM elements — updated imperatively when store values change
  const markerEls: Partial<Record<ProvinceId, HTMLDivElement>> = {}

  // Hover tooltip
  let tooltipVisible = false
  let tooltipX = 0
  let tooltipY = 0
  let tooltipProvinceId: string | null = null

  // ── Forecast helpers ─────────────────────────────────────────────────────────

  function getProvinceSlot(
    provinceId: string,
    dayIdx: number,
    slot: TimeSlot
  ): SlotForecast | null {
    const forecast = forecastData.getProvince(provinceId, DAYS_AHEAD)
    if (!forecast || forecast.length === 0) return null
    const day = forecast[Math.min(dayIdx, forecast.length - 1)]
    return day ? (day[slot] ?? null) : null
  }

  // ── Marker helpers ────────────────────────────────────────────────────────────

  function buildMarkerEl(provinceId: ProvinceId): HTMLDivElement {
    const el = document.createElement('div')
    el.style.cssText = 'cursor:pointer;'
    updateMarkerEl(el, provinceId)
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      const next = get(selectedProvince) === provinceId ? null : provinceId
      selectedProvince.set(next)
    })
    return el
  }

  function updateMarkerEl(el: HTMLDivElement, provinceId: string) {
    const day = get(selectedDay)
    const slot = get(selectedTimeSlot)
    const slotData = getProvinceSlot(provinceId, day, slot)
    const iconId: WeatherIconId = slotData ? getWeatherIcon(slotData) : 'cloudy'
    const isSelected = get(selectedProvince) === provinceId

    const bg = isSelected ? 'rgba(29,78,216,0.92)' : 'rgba(10,10,10,0.85)'
    const border = isSelected ? '#3b82f6' : '#404040'
    const color = isSelected ? '#93c5fd' : '#e5e5e5'
    const tempText = slotData ? `${Math.round(slotData.temperature.max)}°` : ''

    // Extract just the inner SVG content (strip outer <svg> tag) and embed at size 26
    const svgInner = ICON_SVGS[iconId]
      .replace(/<svg[^>]*>/, '')
      .replace('</svg>', '')

    el.innerHTML = `
      <div style="
        display:flex;flex-direction:column;align-items:center;gap:1px;
        background:${bg};
        border:2px solid ${border};
        border-radius:999px;
        width:44px;height:44px;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 8px rgba(0,0,0,0.6);
        color:${color};
        transition:transform 0.15s,border-color 0.15s;
        position:relative;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" width="26" height="26">
          ${svgInner}
        </svg>
        ${tempText ? `<span style="position:absolute;bottom:-16px;left:50%;transform:translateX(-50%);font-size:10px;font-family:system-ui,sans-serif;color:#a3a3a3;white-space:nowrap;">${tempText}</span>` : ''}
      </div>
    `
  }

  function updateAllMarkers() {
    for (const id of PROVINCE_IDS) {
      const el = markerEls[id]
      if (el) updateMarkerEl(el, id)
    }
  }

  function addProvinceMarkers() {
    if (!map) return
    for (const id of PROVINCE_IDS) {
      const centre = PROVINCE_CENTRES[id]
      const el = buildMarkerEl(id)
      markerEls[id] = el
      new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([centre.lon, centre.lat])
        .addTo(map)
    }
  }

  // ── Province layer paint ─────────────────────────────────────────────────────

  function updateProvincePaint() {
    if (!map || !mapReady) return
    const selId = get(selectedProvince) ?? '____'
    map.setPaintProperty('provinces-fill', 'fill-color', [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      'rgba(64,64,64,0.7)',
      ['==', ['get', 'id'], selId],
      'rgba(29,78,216,0.28)',
      'rgba(23,23,23,0.25)',
    ])
    map.setPaintProperty('provinces-fill', 'fill-opacity', 1)
  }

  // ── Map initialisation ────────────────────────────────────────────────────────

  let hoveredProvinceId: string | null = null

  onMount(async () => {
    // Ensure the container div has its CSS layout computed before
    // MapLibre reads its size (avoids 0-height canvas on first paint)
    await tick()

    map = new maplibregl.Map({
      container: mapEl,
      style: MAP_STYLE_URL,
      center: GALICIA_CENTER,
      zoom: GALICIA_ZOOM,
      attributionControl: false,
    })

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    )
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right'
    )

    map.on('load', () => {
      if (!map) return

      // Re-compute canvas size in case the container was laid out after Map init
      map.resize()

      // ── Province source ──────────────────────────────────────────────────
      map.addSource('provinces', {
        type: 'geojson',
        data: provincesGeoJSON,
        promoteId: 'id', // use properties.id as feature ID for feature-state
      })

      // Fill layer (task 9.2, 9.7)
      map.addLayer({
        id: 'provinces-fill',
        type: 'fill',
        source: 'provinces',
        paint: {
          'fill-color': 'rgba(23,23,23,0.25)',
          'fill-opacity': 1,
        },
      })

      // Border layer (task 9.2)
      map.addLayer({
        id: 'provinces-line',
        type: 'line',
        source: 'provinces',
        paint: {
          'line-color': '#525252',
          'line-width': 1.5,
        },
      })

      // ── Hover interaction (task 9.4) ─────────────────────────────────────
      map.on('mousemove', 'provinces-fill', (e) => {
        if (!map || !e.features || e.features.length === 0) return
        const id = e.features[0].properties?.id as string

        if (hoveredProvinceId && hoveredProvinceId !== id) {
          map.setFeatureState(
            { source: 'provinces', id: hoveredProvinceId },
            { hover: false }
          )
        }
        hoveredProvinceId = id
        map.setFeatureState({ source: 'provinces', id }, { hover: true })
        map.getCanvas().style.cursor = 'pointer'

        tooltipVisible = true
        tooltipX = e.point.x
        tooltipY = e.point.y
        tooltipProvinceId = id
      })

      map.on('mouseleave', 'provinces-fill', () => {
        if (!map) return
        if (hoveredProvinceId) {
          map.setFeatureState(
            { source: 'provinces', id: hoveredProvinceId },
            { hover: false }
          )
          hoveredProvinceId = null
        }
        map.getCanvas().style.cursor = ''
        tooltipVisible = false
        tooltipProvinceId = null
      })

      // ── Province click (task 9.5) ─────────────────────────────────────────
      map.on('click', 'provinces-fill', (e) => {
        if (!e.features || e.features.length === 0) return
        const id = e.features[0].properties?.id as string
        const current = get(selectedProvince)
        selectedProvince.set(current === id ? null : id)
      })

      // ── Province icon markers (task 9.3) ──────────────────────────────────
      addProvinceMarkers()

      updateProvincePaint()

      // ── Lazily load concello GeoJSON ──────────────────────────────────────
      loadConcellosLayer()

      // Hide the placeholder only once tiles are actually rendered.
      // 'idle' fires when no camera animation, no pending loads, no fades.
      map.once('idle', () => {
        mapReady = true
      })
    })
  })

  onDestroy(() => {
    map?.remove()
    map = null
    mapReady = false
  })

  // ── Concello layer (task 9.6) ─────────────────────────────────────────────────

  async function loadConcellosLayer() {
    try {
      const { default: concellosData } = await import(
        '../data/galicia-concellos.geojson'
      )
      if (!map) return

      map.addSource('concellos', {
        type: 'geojson',
        data: concellosData,
        promoteId: 'id',
      })

      // Add concello layers below the province layers so province borders stay on top
      map.addLayer(
        {
          id: 'concellos-fill',
          type: 'fill',
          source: 'concellos',
          layout: { visibility: 'none' },
          paint: {
            'fill-color': 'rgba(23,23,23,0.15)',
            'fill-opacity': 1,
          },
        },
        'provinces-fill'
      )

      map.addLayer(
        {
          id: 'concellos-line',
          type: 'line',
          source: 'concellos',
          layout: { visibility: 'none' },
          paint: {
            'line-color': '#404040',
            'line-width': 0.5,
          },
        },
        'provinces-fill'
      )

      map.on('click', 'concellos-fill', (e) => {
        if (!e.features || e.features.length === 0) return
        const id = e.features[0].properties?.id as string
        selectedConcello.set(id)
      })

      concellosGeoJSONLoaded.set(true)
    } catch (err) {
      console.error('[Map] Failed to load concellos GeoJSON:', err)
    }
  }

  // ── Reactive updates ──────────────────────────────────────────────────────────

  // Re-render markers when forecast data or selected day/slot/province changes
  $: {
    $forecastData
    $selectedDay
    $selectedTimeSlot
    $selectedProvince
    if (mapReady) {
      updateAllMarkers()
      updateProvincePaint()
    }
  }

  // Toggle concello layer visibility when mapLevel or load state changes (task 9.8)
  $: {
    const vis =
      mapLevel === 'concello' && $concellosGeoJSONLoaded ? 'visible' : 'none'
    if (mapReady && map) {
      if (map.getLayer('concellos-fill')) {
        map.setLayoutProperty('concellos-fill', 'visibility', vis)
        map.setLayoutProperty('concellos-line', 'visibility', vis)
      }
    }
  }

  // ── Derived tooltip data ─────────────────────────────────────────────────────

  $: tooltipSlot = tooltipProvinceId
    ? getProvinceSlot(tooltipProvinceId, $selectedDay, $selectedTimeSlot)
    : null

  $: tooltipIconId = tooltipSlot
    ? getWeatherIcon(tooltipSlot)
    : ('cloudy' as WeatherIconId)
</script>

<!-- 9.9 responsive: fill parent height set by App.svelte (h-screen minus header) -->
<div class="relative w-full h-full bg-neutral-950">
  <!-- MapLibre canvas container (task 9.1) -->
  <div bind:this={mapEl} class="absolute inset-0" role="application" aria-label={$_('map.loading')}></div>

  <!-- Placeholder (task 9.0): covers canvas until map.loaded() fires -->
  {#if !mapReady}
    <div class="absolute inset-0 z-10 pointer-events-none">
      <MapPlaceholder />
    </div>
  {/if}

  <!-- Hover tooltip (task 9.4) -->
  {#if tooltipVisible && tooltipProvinceId}
    <div
      class="absolute z-20 pointer-events-none"
      style="left:{tooltipX + 12}px;top:{tooltipY - 12}px"
    >
      <div
        class="bg-neutral-900/95 border border-neutral-700 rounded-lg px-3 py-2 shadow-xl text-xs text-neutral-100 min-w-[140px]"
      >
        <!-- Province name -->
        <p class="font-semibold text-sm mb-1 text-neutral-100">
          {$_(`province.${tooltipProvinceId}`)}
        </p>

        {#if tooltipSlot}
          <!-- Weather condition -->
          <p class="text-neutral-400 mb-1.5">
            {$_(`weather.${tooltipIconId}`)}
          </p>
          <!-- Temperature -->
          <div class="flex items-center justify-between gap-3 mb-0.5">
            <span class="text-neutral-400">{$_('forecast.temperature.label')}</span>
            <span class="text-neutral-200 font-medium">
              {Math.round(tooltipSlot.temperature.min)}° /
              {Math.round(tooltipSlot.temperature.max)}°
            </span>
          </div>
          <!-- Precipitation probability -->
          <div class="flex items-center justify-between gap-3 mb-0.5">
            <span class="text-neutral-400">{$_('forecast.precipitation.label')}</span>
            <span class="text-neutral-200">
              {tooltipSlot.precipitation.probability}%
            </span>
          </div>
          <!-- Wind -->
          <div class="flex items-center justify-between gap-3">
            <span class="text-neutral-400">{$_('forecast.wind.label')}</span>
            <span class="text-neutral-200">
              {$_('forecast.wind.speed', { values: { value: Math.round(tooltipSlot.wind.speed) } })}
            </span>
          </div>
        {:else}
          <p class="text-neutral-500 italic">{$_('app.loading')}</p>
        {/if}
      </div>
    </div>
  {/if}
</div>
