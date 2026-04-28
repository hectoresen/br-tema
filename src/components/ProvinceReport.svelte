<script lang="ts">
  import { onMount } from 'svelte'
  import { _ } from 'svelte-i18n'
  import { forecastData, selectedProvince, selectedDay, selectedTimeSlot } from '../stores'
  import WeatherIcon from './WeatherIcon.svelte'
  import { getWeatherIcon } from '../icons/get-weather-icon'
  import type { DayForecast } from '../types/forecast'

  $: provinceId = $selectedProvince
  $: cacheKey = provinceId ? `province:${provinceId}:4` : ''
  $: days = (provinceId ? ($forecastData.data.get(cacheKey) ?? []) : []) as DayForecast[]
  $: isLoading = cacheKey ? $forecastData.loading.has(cacheKey) : false
  $: hasError = cacheKey ? !!$forecastData.errors.get(cacheKey) : false

  $: currentDay = days[$selectedDay] ?? null
  $: currentSlot = currentDay ? currentDay[$selectedTimeSlot] : null

  onMount(() => {
    if (provinceId) forecastData.loadProvince(provinceId)
  })

  // Load when province changes
  $: {
    const id = $selectedProvince
    if (id) forecastData.loadProvince(id)
  }

  function windDirection(degrees: number): string {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    return dirs[Math.round(degrees / 45) % 8]
  }
</script>

{#if $selectedProvince}
  <div style="padding:12px; border-top:0.5px solid #E8E5DF;">
    <!-- Report header: province name + close -->
    <div class="flex items-center justify-between mb-3">
      <span class="font-medium" style="font-size:13px; color:#1A1A1A;">
        {$_(`province.${$selectedProvince}`)}
      </span>
      <button
        class="leading-none"
        style="font-size:12px; color:#9A9A9A; padding:4px;"
        on:click={() => selectedProvince.set(null)}
        aria-label="Pechar"
      >✕</button>
    </div>

    {#if isLoading && days.length === 0}
      <!-- Skeleton: 2×2 stat grid -->
      <div class="grid grid-cols-2 gap-1.5">
        {#each [0,1,2,3] as _}
          <div class="rounded-lg p-2" style="background:#F5F3EF; min-height:52px;">
            <div class="rounded mb-2" style="width:40px;height:8px;background:#E8E5DF;"></div>
            <div class="rounded" style="width:32px;height:14px;background:#E8E5DF;"></div>
          </div>
        {/each}
      </div>
    {:else if hasError && days.length === 0}
      <div class="py-3 text-center" style="font-size:11px; color:#9A9A9A;">{$_('app.error.generic')}</div>
    {:else if currentSlot}
      <!-- 2×2 stat grid -->
      <div class="grid grid-cols-2 gap-1.5">
        <!-- Temperatura -->
        <div class="flex flex-col gap-0.5 rounded-lg p-2" style="background:#F5F3EF;">
          <span style="font-size:10px; color:#5A5A5A;">{$_('forecast.temperature.label')}</span>
          <div class="flex items-baseline gap-1">
            <span class="font-medium" style="font-size:14px; color:#C4862A;">
              {Math.round(currentSlot.temperature.max)}°
            </span>
            <span style="font-size:12px; color:#185FA5;">
              {Math.round(currentSlot.temperature.min)}°
            </span>
          </div>
          <WeatherIcon id={getWeatherIcon(currentSlot)} size={18} />
        </div>

        <!-- Vento -->
        <div class="flex flex-col gap-0.5 rounded-lg p-2" style="background:#F5F3EF;">
          <span style="font-size:10px; color:#5A5A5A;">{$_('forecast.wind.label')}</span>
          <span class="font-medium" style="font-size:14px; color:#1A1A1A;">
            {Math.round(currentSlot.wind.speed)} <span style="font-size:11px; font-weight:400;">km/h</span>
          </span>
          <span style="font-size:10px; color:#5A5A5A;">
            {windDirection(currentSlot.wind.direction)}
          </span>
        </div>

        <!-- Humidade -->
        <div class="flex flex-col gap-0.5 rounded-lg p-2" style="background:#F5F3EF;">
          <span style="font-size:10px; color:#5A5A5A;">{$_('forecast.humidity.label')}</span>
          <span class="font-medium" style="font-size:14px; color:#1A1A1A;">
            {currentSlot.humidity}<span style="font-size:11px; font-weight:400;">%</span>
          </span>
        </div>

        <!-- Precipitación -->
        <div class="flex flex-col gap-0.5 rounded-lg p-2" style="background:#F5F3EF;">
          <span style="font-size:10px; color:#5A5A5A;">{$_('forecast.precipitation.label')}</span>
          <span class="font-medium" style="font-size:14px; color:#185FA5;">
            {currentSlot.precipitation.probability}<span style="font-size:11px; font-weight:400;">%</span>
          </span>
          <span style="font-size:10px; color:#5A5A5A;">
            {currentSlot.precipitation.value.toFixed(1)} mm
          </span>
        </div>
      </div>
    {/if}
  </div>
{/if}
