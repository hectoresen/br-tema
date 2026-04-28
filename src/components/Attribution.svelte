<script lang="ts">
  import { activeLayer } from '../stores'
</script>

<!--
  Task 20.1-20.2 — data-source attribution overlay.
  Positioned at bottom-left of the map wrapper so it doesn't overlap
  with MapLibre's own attribution control at bottom-right.
  Reactive to activeLayer: appends "· RainViewer" when satellite is active.
-->
<div
  class="absolute pointer-events-none z-10"
  style="bottom:6px; left:6px;"
>
  <span
    style="
      font-size:10px;
      font-family:system-ui,sans-serif;
      color:rgba(26,26,26,0.65);
      background:rgba(255,255,255,0.78);
      border-radius:3px;
      padding:2px 5px;
    "
  >
    Open-Meteo{$activeLayer === 'satellite' ? ' · RainViewer' : ''}
  </span>
</div>
