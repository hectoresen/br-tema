<script lang="ts">
  import { onMount } from 'svelte'
  import LanguageSelector from './components/LanguageSelector.svelte'
  import AlertsBanner from './components/AlertsBanner.svelte'
  import LayerSelector from './components/LayerSelector.svelte'
  import TimeBar from './components/TimeBar.svelte'
  import Map from './components/Map.svelte'
  import Sidebar from './components/Sidebar.svelte'
  import { alerts } from './stores/alerts'

  // Dev-only preview — tree-shaken away in production builds
  const DEV = import.meta.env.DEV
  let showDevIcons = false

  onMount(() => {
    alerts.load()
  })
</script>

<!--
  Root layout
  Mobile:  flex-col, natural scroll — header → alerts → layers → map (min-h) → timebar → sidebar
  Desktop: h-screen, two-column — [layers + map + timebar] | [sidebar 280px]
-->
<div class="flex flex-col bg-bretema-stone-100 min-h-screen md:h-screen md:overflow-hidden">

  <!-- ── Header ── full-width, 44px ── -->
  <header
    class="flex-shrink-0 flex items-center justify-between px-4 h-11"
    style="background-color:#2D4A3E; border-bottom:0.5px solid #4A7060;"
  >
    <div class="flex items-center gap-2">
      <span
        class="inline-block w-2 h-2 rounded-full flex-shrink-0"
        style="background-color:#7EB89A;"
        aria-hidden="true"
      ></span>
      <span
        class="font-medium select-none"
        style="color:#E8F0EC; font-size:15px; letter-spacing:0.02em;"
      >Brétema</span>
    </div>
    <div class="flex items-center gap-3">
      {#if DEV}
        <button
          class="text-xs transition-colors"
          style="color:#9EC4B0;"
          on:click={() => (showDevIcons = !showDevIcons)}
        >
          {showDevIcons ? 'hide icons' : 'icons'}
        </button>
      {/if}
      <LanguageSelector />
    </div>
  </header>

  {#if DEV && showDevIcons}
    {#await import('./components/dev/IconPreview.svelte') then { default: IconPreview }}
      <svelte:component this={IconPreview} />
    {/await}
  {:else}
    <!-- ── Alerts banner ── full-width, always visible ── -->
    <AlertsBanner />

    <!-- ── Body: two-column on desktop, stacked on mobile ── -->
    <div class="flex flex-col md:flex-row md:flex-1 md:min-h-0 md:overflow-hidden">

      <!-- ── Left column: layers + map + timebar ── -->
      <div class="flex flex-col md:flex-1 md:min-h-0">
        <LayerSelector />
        <!-- Map: min height on mobile, flex-1 on desktop -->
        <div class="relative min-h-[56vw] md:flex-1 md:min-h-0">
          <Map />
        </div>
        <TimeBar />
      </div>

      <!-- ── Sidebar: right column on desktop, below on mobile ── -->
      <aside
        class="flex-shrink-0 md:w-[280px] md:overflow-y-auto md:border-l"
        style="border-color:#E8E5DF;"
      >
        <Sidebar />
      </aside>
    </div>
  {/if}
</div>
