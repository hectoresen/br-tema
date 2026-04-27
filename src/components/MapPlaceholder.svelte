<!--
  MapPlaceholder — static SVG shown while MapLibre GL initialises.
  Ensures LCP ≤ 2.5 s by giving users immediate visual feedback.

  Projection (equirectangular):
    x = (lon + 9.35) / 2.65 * 300   (viewBox width  300)
    y = (43.85 − lat) / 2.15 * 200  (viewBox height 200)
  Bounding box: lon −9.35 … −6.70, lat 41.70 … 43.85
-->
<script lang="ts">
  import { _ } from 'svelte-i18n'

  // Province centre points (SVG coordinates) for label placement
  const LABEL_CENTRES = {
    corunha:    { x: 74,  y: 70  },
    lugo:       { x: 220, y: 85  },
    ourense:    { x: 210, y: 160 },
    pontevedra: { x: 85,  y: 144 },
  } as const
</script>

<div
  class="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-950"
  role="img"
  aria-label={$_('map.loading')}
>
  <div class="w-full h-full relative">
    <!-- Pulsing background to signal loading -->
    <div class="absolute inset-0 flex items-center justify-center">
      <p class="text-neutral-400 dark:text-neutral-500 text-xs tracking-widest uppercase animate-pulse select-none">
        {$_('map.loading')}
      </p>
    </div>

    <svg
      viewBox="0 0 300 200"
      xmlns="http://www.w3.org/2000/svg"
      class="w-full h-full"
      aria-hidden="true"
    >
      <!-- ── Province fills ── -->

      <!-- A Coruña (NW) -->
      <path
        d="M189,6 L164,7 L116,27 L136,31 L133,40 L118,41 L58,47 L46,58 L21,69 L6,74 L29,119 L114,94 L160,88 L159,52 Z"
        fill="rgba(209,213,219,0.7)"
        stroke="#9ca3af"
        stroke-width="0.8"
      />

      <!-- Lugo (NE) -->
      <path
        d="M194,9 L226,17 L237,28 L262,28 L245,43 L271,67 L286,66 L266,77 L281,81 L287,91 L261,108 L266,112 L243,142 L232,132 L196,136 L161,123 L169,106 L153,93 L163,84 L159,52 Z"
        fill="rgba(209,213,219,0.7)"
        stroke="#9ca3af"
        stroke-width="0.8"
      />

      <!-- Ourense (SE) -->
      <path
        d="M162,119 L196,136 L232,132 L243,142 L257,125 L275,124 L286,126 L284,134 L296,142 L262,165 L270,170 L265,177 L246,174 L240,184 L218,190 L187,181 L167,186 L164,179 L134,189 L128,180 L143,168 L132,165 L135,149 L123,149 L111,127 Z"
        fill="rgba(209,213,219,0.7)"
        stroke="#9ca3af"
        stroke-width="0.8"
      />

      <!-- Pontevedra (SW) -->
      <path
        d="M132,92 L156,93 L155,100 L169,106 L161,118 L162,119 L111,127 L134,156 L81,168 L54,186 L51,162 L84,140 L54,150 L79,132 L58,137 L47,127 L60,130 L58,119 L72,106 Z"
        fill="rgba(209,213,219,0.7)"
        stroke="#9ca3af"
        stroke-width="0.8"
      />

      <!-- ── Province labels ── -->
      {#each Object.entries(LABEL_CENTRES) as [id, pos]}
        <text
          x={pos.x}
          y={pos.y}
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="9"
          font-family="system-ui, sans-serif"
          fill="#6b7280"
          letter-spacing="0.5"
        >
          {$_(`province.${id}`)}
        </text>
      {/each}

      <!-- ── Animated skeleton pulse dots at province centres ── -->
      {#each Object.values(LABEL_CENTRES) as pos}
        <circle
          cx={pos.x}
          cy={pos.y - 14}
          r="4"
          fill="#3b82f6"
          opacity="0.5"
          class="animate-ping"
        />
      {/each}
    </svg>
  </div>
</div>
