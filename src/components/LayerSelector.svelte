<script lang="ts">
  import { _ } from 'svelte-i18n'
  import { activeLayer, type MapLayer } from '../stores/ui'
  import { trackEvent } from '../lib/analytics'

  // Fixed order per spec (Decision 21) — do not reorder based on state
  const LAYERS: MapLayer[] = [
    'general',
    'wind',
    'temperature',
    'humidity',
    'precipitation',
    'storms',
    'webcams',
    'satellite',
  ]

  function select(layer: MapLayer): void {
    activeLayer.set(layer)
    trackEvent('layer_change', { layer })
  }
</script>

<!--
  LayerSelector — Block 10
  Horizontal row of layer buttons. Scrollable on mobile.
  Active state: green-800 bg + white text (spec: layer-btn-active)
  Inactive: transparent bg, stone-50 border, text-secondary
-->
<nav
  class="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 overflow-x-auto"
  style="background:#FFFFFF; border-bottom:0.5px solid #E8E5DF; scrollbar-width:none; -ms-overflow-style:none;"
  aria-label={$_('map.layers.label')}
>
  {#each LAYERS as layer (layer)}
    {@const isActive = $activeLayer === layer}
    <button
      type="button"
      class="flex-shrink-0 font-medium transition-colors whitespace-nowrap"
      style={isActive
        ? 'background:#2D4A3E; color:#FFFFFF; border-radius:4px; padding:4px 10px; font-size:11px; border:1px solid transparent;'
        : 'background:transparent; color:#5A5A5A; border-radius:4px; padding:4px 10px; font-size:11px; border:1px solid #E8E5DF;'}
      aria-pressed={isActive}
      on:click={() => select(layer)}
    >
      {$_(`map.layers.${layer}`)}
    </button>
  {/each}
</nav>

<style>
  nav::-webkit-scrollbar {
    display: none;
  }
</style>
