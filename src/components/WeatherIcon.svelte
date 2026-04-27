<script lang="ts">
  import type { WeatherIconId } from '../types/weather-icon'
  import { ICON_SVGS } from '../icons/icon-strings'

  export let id: WeatherIconId
  export let size: number = 48
  /** Accessible label; if empty the SVG is treated as decorative (aria-hidden) */
  export let label: string = ''
</script>

{#if label}
  <span role="img" aria-label={label} style="display:inline-flex;width:{size}px;height:{size}px;color:inherit">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- static, hardcoded SVG strings; no user input reaches this -->
    {@html ICON_SVGS[id]}
  </span>
{:else}
  <span aria-hidden="true" style="display:inline-flex;width:{size}px;height:{size}px;color:inherit">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- static, hardcoded SVG strings; no user input reaches this -->
    {@html ICON_SVGS[id]}
  </span>
{/if}
