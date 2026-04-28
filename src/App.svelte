<script lang="ts">
  import { onMount } from 'svelte'
  import LanguageSelector from './components/LanguageSelector.svelte'
  import AlertsBanner from './components/AlertsBanner.svelte'
  import LayerSelector from './components/LayerSelector.svelte'
  import TimeBar from './components/TimeBar.svelte'
  import Map from './components/Map.svelte'
  import { alerts } from './stores/alerts'

  // Dev-only preview — tree-shaken away in production builds
  const DEV = import.meta.env.DEV
  let showDevIcons = false

  onMount(() => {
    alerts.load()
  })
</script>

<!-- App root — stone surface background, single column mobile-first -->
<div class="flex flex-col h-screen bg-bretema-stone-100 overflow-hidden">

  <!-- ── Header ── 44px, green-800, bretema logo + language selector ── -->
  <header
    class="flex-shrink-0 flex items-center justify-between px-4 h-11"
    style="background-color:#2D4A3E; border-bottom:0.5px solid #4A7060;"
  >
    <!-- Logotype: green dot + "Brétema" -->
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

    <!-- Right side: dev toggle + language selector -->
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
    <!-- ── Alerts banner ── always visible, variable height ── -->
    <AlertsBanner />

    <!-- ── Layer selector ── horizontal bar ── -->
    <LayerSelector />

    <!-- ── Map ── fills remaining vertical space ── -->
    <div class="flex-1 min-h-0">
      <Map />
    </div>

    <!-- ── Time bar ── slot + day navigation, always visible ── -->
    <TimeBar />
  {/if}
</div>
