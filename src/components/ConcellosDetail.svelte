<script lang="ts">
  import { onMount } from 'svelte'
  import { _, locale } from 'svelte-i18n'
  import { forecastData, selectedConcello, selectedDay, selectedTimeSlot } from '../stores'
  import WeatherIcon from './WeatherIcon.svelte'
  import { getWeatherIcon } from '../icons/get-weather-icon'
  import concellosRaw from '../data/concellos.json'
  import type { DayForecast, TimeSlot } from '../types/forecast'

  const concellosData = concellosRaw as Array<{
    id: string
    name: string
    nameGl: string
    provinceId: string
    lat: number
    lon: number
  }>

  $: concelloId = $selectedConcello
  $: cacheKey = concelloId ? `concello:${concelloId}:4` : ''
  $: days = (concelloId ? ($forecastData.data.get(cacheKey) ?? []) : []) as DayForecast[]
  $: isLoading = cacheKey ? $forecastData.loading.has(cacheKey) : false
  $: hasError = cacheKey ? !!$forecastData.errors.get(cacheKey) : false
  $: currentConcello = concellosData.find((c) => c.id === concelloId)

  onMount(() => {
    if (concelloId) forecastData.loadConcello(concelloId)
  })

  // Load whenever selectedConcello changes
  $: {
    const id = $selectedConcello
    if (id) forecastData.loadConcello(id)
  }

  function getDayLabel(index: number, dateStr: string): string {
    if (index === 0) return $_('forecast.today')
    if (index === 1) return $_('forecast.tomorrow')
    return new Intl.DateTimeFormat($locale ?? 'gl-ES', { weekday: 'short' }).format(
      new Date(dateStr + 'T12:00:00'),
    )
  }

  function getDayMax(day: DayForecast): number {
    return Math.max(day.morning.temperature.max, day.afternoon.temperature.max, day.night.temperature.max)
  }

  function getDayMin(day: DayForecast): number {
    return Math.min(day.morning.temperature.min, day.afternoon.temperature.min, day.night.temperature.min)
  }

  const SLOTS: TimeSlot[] = ['morning', 'afternoon', 'night']

  function slotAbbr(slot: TimeSlot): string {
    // First 3 chars of the translated slot name, uppercased
    const full = $_(`forecast.slots.${slot}`)
    return full.slice(0, 3).toUpperCase()
  }
</script>

<!--
  Task 16 — Full concello detail panel.
  Shows a 4-day × 3-slot grid with icon + rain% per cell, max/min in column header.
  Rendered inside Sidebar when $selectedConcello !== null.
-->
<div class="flex flex-col" style="background:#FFFFFF; min-height:100%;">

  <!-- Header: back button + concello name + province -->
  <div
    class="flex items-center gap-2 px-3 py-3 flex-shrink-0"
    style="border-bottom:0.5px solid #E8E5DF;"
  >
    <button
      class="flex items-center gap-1 flex-shrink-0"
      style="font-size:12px; color:#5A5A5A; padding:2px 0;"
      on:click={() => selectedConcello.set(null)}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M9 11L5 7l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      {$_('concello.back')}
    </button>
    <div class="flex-1 min-w-0 text-right">
      <span class="font-medium truncate block" style="font-size:13px; color:#1A1A1A;">
        {currentConcello?.nameGl ?? currentConcello?.name ?? concelloId}
      </span>
      {#if currentConcello?.provinceId}
        <span class="block" style="font-size:10px; color:#9A9A9A;">
          {$_(`province.${currentConcello.provinceId}`)}
        </span>
      {/if}
    </div>
  </div>

  <!-- Grid body -->
  <div class="flex-1 overflow-y-auto px-3 py-3">
    {#if isLoading && days.length === 0}
      <!-- Skeleton: header + 4×3 grid placeholder -->
      <div class="grid" style="grid-template-columns:36px repeat(4,1fr); gap:0;">
        <div></div>
        {#each [0,1,2,3] as _}
          <div class="flex flex-col items-center gap-1 py-1 pb-2">
            <div class="rounded" style="width:24px;height:8px;background:#E8E5DF;"></div>
            <div class="rounded" style="width:20px;height:9px;background:#E8E5DF;"></div>
            <div class="rounded" style="width:16px;height:8px;background:#E8E5DF;"></div>
          </div>
        {/each}
        {#each [0,1,2] as _s}
          <div class="flex items-center py-1.5">
            <div class="rounded" style="width:20px;height:8px;background:#E8E5DF;"></div>
          </div>
          {#each [0,1,2,3] as _d}
            <div class="flex flex-col items-center gap-1 py-1.5">
              <div class="rounded-full" style="width:18px;height:18px;background:#E8E5DF;"></div>
              <div class="rounded" style="width:14px;height:8px;background:#E8E5DF;"></div>
            </div>
          {/each}
        {/each}
      </div>
    {:else if hasError && days.length === 0}
      <div class="py-6 text-center" style="font-size:11px; color:#9A9A9A;">{$_('app.error.generic')}</div>
    {:else if days.length > 0}
      <!--
        5-column grid: [slot-label] + [4 days]
        Column widths: 36px label + 4 × equal
      -->
      <div
        class="grid"
        style="grid-template-columns:36px repeat(4,1fr); gap:0;"
      >
        <!-- ── Day header row ── -->
        <div></div>
        {#each days.slice(0, 4) as day, i}
          {@const isToday = i === 0}
          {@const isActive = i === $selectedDay}
          <div
            class="flex flex-col items-center py-1 pb-2"
            style:background-color={isToday ? '#F0F5F2' : isActive ? '#F7FAF8' : 'transparent'}
            style:border-radius={isToday || isActive ? '6px 6px 0 0' : '0'}
          >
            <span class="uppercase" style="font-size:10px; color:#5A5A5A; letter-spacing:0.03em; white-space:nowrap;">
              {getDayLabel(i, day.date)}
            </span>
            <span class="font-medium" style="font-size:11px; color:#C4862A;">{Math.round(getDayMax(day))}°</span>
            <span style="font-size:10px; color:#185FA5;">{Math.round(getDayMin(day))}°</span>
          </div>
        {/each}

        <!-- ── Slot rows ── -->
        {#each SLOTS as slot}
          <!-- Slot label -->
          <div class="flex items-center" style="padding:6px 0 6px 2px;">
            <span style="font-size:10px; color:#9A9A9A; white-space:nowrap;">{slotAbbr(slot)}</span>
          </div>
          <!-- Day cells -->
          {#each days.slice(0, 4) as day, i}
            {@const isToday = i === 0}
            {@const isActive = i === $selectedDay}
            {@const isActiveSlot = slot === $selectedTimeSlot}
            {@const slotData = day[slot]}
            {@const iconId = getWeatherIcon(slotData)}
            <div
              class="flex flex-col items-center gap-0.5 py-1.5"
              style:background-color={isToday ? '#F0F5F2' : isActive ? '#F7FAF8' : 'transparent'}
              style:outline={isActive && isActiveSlot ? '1.5px solid #3D5A3E' : 'none'}
              style:outline-offset="-1.5px"
              style:border-radius="3px"
            >
              <WeatherIcon id={iconId} size={18} />
              <span style="font-size:10px; color:#185FA5;">{slotData.precipitation.probability}%</span>
            </div>
          {/each}
        {/each}
      </div>
    {/if}
  </div>
</div>
