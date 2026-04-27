<script lang="ts">
  import WeatherIcon from '../WeatherIcon.svelte'
  import { getWeatherIcon } from '../../icons/get-weather-icon'
  import type { WeatherIconId } from '../../types/weather-icon'
  import type { SlotForecast } from '../../types/forecast'

  type IconCase = {
    id: WeatherIconId
    label: string
    sample: SlotForecast
  }

  const base: Omit<SlotForecast, 'slot'> = {
    weatherCode: 0,
    temperature: { min: 10, max: 20, current: 15 },
    precipitation: { value: 0, probability: 0 },
    wind: { speed: 10, direction: 180 },
    humidity: 60,
    cloudCover: 0,
  }

  const cases: IconCase[] = [
    {
      id: 'sunny',
      label: 'Sunny (cloudCover=10)',
      sample: { ...base, slot: 'morning', cloudCover: 10 },
    },
    {
      id: 'partly-cloudy',
      label: 'Partly cloudy (cloudCover=50)',
      sample: { ...base, slot: 'afternoon', cloudCover: 50 },
    },
    {
      id: 'cloudy',
      label: 'Cloudy (cloudCover=80)',
      sample: { ...base, slot: 'morning', cloudCover: 80 },
    },
    {
      id: 'fog',
      label: 'Fog (code=45)',
      sample: { ...base, slot: 'morning', weatherCode: 45 },
    },
    {
      id: 'rain-light',
      label: 'Rain light (prob=45%)',
      sample: { ...base, slot: 'afternoon', precipitation: { value: 0, probability: 45 } },
    },
    {
      id: 'rain-heavy',
      label: 'Rain heavy (prob=75%, cloudCover=80)',
      sample: {
        ...base,
        slot: 'night',
        cloudCover: 80,
        precipitation: { value: 5, probability: 75 },
      },
    },
    {
      id: 'snow',
      label: 'Snow (code=73)',
      sample: {
        ...base,
        slot: 'night',
        weatherCode: 73,
        temperature: { min: -1, max: 2, current: 0 },
      },
    },
    {
      id: 'thunderstorm',
      label: 'Thunderstorm (code=95)',
      sample: { ...base, slot: 'afternoon', weatherCode: 95 },
    },
  ]

  const sizes = [24, 32, 48, 64]
</script>

<div class="min-h-screen bg-neutral-950 text-neutral-100 p-8">
  <h1 class="text-xl font-bold mb-2 text-sky-400">DEV — Icon Preview</h1>
  <p class="text-sm text-neutral-500 mb-8">Visible only in development mode</p>

  <table class="w-full text-sm border-collapse">
    <thead>
      <tr class="border-b border-neutral-800 text-left text-neutral-400">
        <th class="py-2 pr-4">Label</th>
        <th class="py-2 pr-4">Expected</th>
        <th class="py-2 pr-4">Resolved</th>
        {#each sizes as s}
          <th class="py-2 pr-4 text-center">{s}px</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each cases as c}
        {@const resolved = getWeatherIcon(c.sample)}
        <tr class="border-b border-neutral-800 hover:bg-neutral-900">
          <td class="py-3 pr-4 text-neutral-300">{c.label}</td>
          <td class="py-3 pr-4 font-mono text-xs text-neutral-400">{c.id}</td>
          <td class="py-3 pr-4 font-mono text-xs"
              class:text-emerald-400={resolved === c.id}
              class:text-red-400={resolved !== c.id}>
            {resolved}
            {#if resolved !== c.id} ⚠{/if}
          </td>
          {#each sizes as s}
            <td class="py-3 pr-4">
              <span class="flex justify-center text-neutral-100">
                <WeatherIcon id={c.id} size={s} />
              </span>
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>

  <!-- Colour theme test -->
  <div class="mt-10 grid grid-cols-4 gap-4">
    {#each ['text-neutral-100', 'text-sky-400', 'text-amber-400', 'text-red-400'] as cls}
      <div class="p-4 rounded bg-neutral-800">
        <p class="text-xs text-neutral-500 mb-2">{cls}</p>
        <div class="{cls} flex flex-wrap gap-2">
          {#each cases as c}
            <WeatherIcon id={c.id} size={32} />
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
