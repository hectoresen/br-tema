<script lang="ts">
  import { onMount } from 'svelte'
  import { _, locale } from 'svelte-i18n'
  import { forecastData, alerts, searchConcello, selectedDay, selectedConcello } from '../stores'
  import WeatherIcon from './WeatherIcon.svelte'
  import { getWeatherIcon } from '../icons/get-weather-icon'
  import type { DayForecast } from '../types/forecast'
  import type { AlertSeverity } from '../types/alert'
  import concellosRaw from '../data/concellos.json'

  const concellosData = concellosRaw as Array<{
    id: string
    name: string
    nameGl: string
    provinceId: string
    lat: number
    lon: number
  }>

  $: cacheKey = `concello:${$searchConcello}:4`
  $: days = ($forecastData.data.get(cacheKey) ?? []) as DayForecast[]
  $: isLoading = $forecastData.loading.has(cacheKey)
  $: hasError = !!$forecastData.errors.get(cacheKey)
  $: currentConcello = concellosData.find((c) => c.id === $searchConcello)

  onMount(() => {
    forecastData.loadConcello($searchConcello)
  })

  // Reload when searchConcello changes
  $: {
    const id = $searchConcello
    if (id) forecastData.loadConcello(id)
  }

  function getDayLabel(index: number, dateStr: string): string {
    if (index === 0) return $_('forecast.today')
    if (index === 1) return $_('forecast.tomorrow')
    return new Intl.DateTimeFormat($locale ?? 'gl-ES', { weekday: 'short' }).format(new Date(dateStr + 'T12:00:00'))
  }

  function getDayMax(day: DayForecast): number {
    return Math.max(day.morning.temperature.max, day.afternoon.temperature.max, day.night.temperature.max)
  }

  function getDayMin(day: DayForecast): number {
    return Math.min(day.morning.temperature.min, day.afternoon.temperature.min, day.night.temperature.min)
  }

  function getDayRainProb(day: DayForecast): number {
    return Math.max(
      day.morning.precipitation.probability,
      day.afternoon.precipitation.probability,
      day.night.precipitation.probability,
    )
  }

  function getAlertSeverityOnDate(dateStr: string): AlertSeverity | null {
    const date = new Date(dateStr + 'T12:00:00')
    const order: AlertSeverity[] = ['red', 'orange', 'yellow']
    for (const sev of order) {
      const found = $alerts.alerts.find((a) => {
        const start = new Date(a.startTime)
        const end = new Date(a.endTime)
        return a.severity === sev && date >= start && date <= end
      })
      if (found) return sev
    }
    return null
  }

  const ALERT_DOT_COLOR: Record<AlertSeverity, string> = {
    red: '#E63946',
    orange: '#F4845F',
    yellow: '#F9C74F',
  }
</script>

<div style="padding:12px 12px 8px;">
  <!-- Card header: concello name + "ver detalle" trigger -->
  <div class="flex items-center justify-between mb-2" style="min-height:20px;">
    <span class="font-medium truncate" style="font-size:13px; color:#1A1A1A;">
      {currentConcello?.nameGl ?? currentConcello?.name ?? $searchConcello}
    </span>
    <button
      class="flex-shrink-0 ml-2"
      style="font-size:11px; color:#3D5A3E; padding:2px 0;"
      on:click={() => selectedConcello.set($searchConcello)}
    >
      ›
    </button>
  </div>

  <!-- Loading / error / data states -->
  {#if isLoading && days.length === 0}
    <!-- Skeleton: 4-column placeholder -->
    <div class="grid grid-cols-4 overflow-hidden rounded-xl" style="border:0.5px solid #E8E5DF;">
      {#each [0,1,2,3] as i}
        <div
          class="flex flex-col items-center gap-1.5 py-2 px-1"
          style:border-right={i < 3 ? '0.5px solid #E8E5DF' : 'none'}
        >
          <div class="rounded" style="width:28px;height:9px;background:#E8E5DF;"></div>
          <div class="rounded-full" style="width:20px;height:20px;background:#E8E5DF;"></div>
          <div class="rounded" style="width:22px;height:9px;background:#E8E5DF;"></div>
          <div class="rounded" style="width:22px;height:9px;background:#E8E5DF;"></div>
          <div class="rounded" style="width:20px;height:8px;background:#E8E5DF;"></div>
        </div>
      {/each}
    </div>
  {:else if hasError && days.length === 0}
    <div class="py-4 text-center" style="font-size:11px; color:#9A9A9A;">{$_('app.error.generic')}</div>
  {:else if days.length > 0}
    <!-- 4-column day grid -->
    <div
      class="grid grid-cols-4 overflow-hidden rounded-xl"
      style="border:0.5px solid #E8E5DF;"
    >
      {#each days.slice(0, 4) as day, i}
        {@const isToday = i === 0}
        {@const isActive = i === $selectedDay}
        {@const alertSev = getAlertSeverityOnDate(day.date)}
        {@const iconId = getWeatherIcon(day.afternoon)}
        {@const maxTemp = getDayMax(day)}
        {@const minTemp = getDayMin(day)}
        {@const rainProb = getDayRainProb(day)}
        <div
          class="flex flex-col items-center gap-1 py-2 px-1"
          style:background-color={isToday ? '#F0F5F2' : isActive ? '#F7FAF8' : 'transparent'}
          style:border-right={i < 3 ? '0.5px solid #E8E5DF' : 'none'}
        >
          <!-- Day label (abbreviated) -->
          <span class="uppercase" style="font-size:10px; color:#5A5A5A; letter-spacing:0.03em; white-space:nowrap;">
            {getDayLabel(i, day.date)}
          </span>

          <!-- Weather icon + optional alert dot -->
          <div class="relative flex items-center justify-center" style="width:22px; height:22px;">
            <WeatherIcon id={iconId} size={20} />
            {#if alertSev}
              <span
                class="absolute rounded-full"
                style="width:6px; height:6px; top:-1px; right:-2px; background-color:{ALERT_DOT_COLOR[alertSev]};"
                aria-hidden="true"
              ></span>
            {/if}
          </div>

          <!-- Max temp (amber) -->
          <span class="font-medium" style="font-size:11px; color:#C4862A;">{Math.round(maxTemp)}°</span>

          <!-- Min temp (blue) -->
          <span class="font-medium" style="font-size:11px; color:#185FA5;">{Math.round(minTemp)}°</span>

          <!-- Rain probability (blue) -->
          <span style="font-size:10px; color:#185FA5;">{rainProb}%</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
