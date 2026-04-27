<script lang="ts">
  import { isLoading, _ } from 'svelte-i18n'
  import LanguageSelector from './components/LanguageSelector.svelte'
  import Map from './components/Map.svelte'

  // Dev-only preview — tree-shaken away in production builds
  const DEV = import.meta.env.DEV
  let showDevIcons = false
</script>

<!-- h-screen layout: fixed header + map fills remaining height (task 9.9) -->
<!-- The Map component must NEVER be conditionally mounted based on $isLoading —
     a locale change sets isLoading=true briefly, which would destroy the MapLibre
     canvas and leave the page black on remount. -->
<main class="flex flex-col h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
  <header class="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-neutral-800">
    <span class="text-sm font-semibold tracking-wide">
      {$isLoading ? 'Brétema' : $_('app.title')}
    </span>
    <div class="flex items-center gap-3">
      {#if DEV}
        <button
          class="text-xs text-neutral-500 hover:text-sky-400 transition-colors"
          on:click={() => (showDevIcons = !showDevIcons)}
        >
          {showDevIcons ? 'hide icons' : 'dev: icons'}
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
    <!-- Map always mounted — never destroyed by i18n loading state -->
    <div class="flex-1 min-h-0">
      <Map />
    </div>
  {/if}
</main>
