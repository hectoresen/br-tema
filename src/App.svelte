<script lang="ts">
  import { isLoading, _ } from 'svelte-i18n'
  import LanguageSelector from './components/LanguageSelector.svelte'
  import Map from './components/Map.svelte'

  // Dev-only preview — tree-shaken away in production builds
  const DEV = import.meta.env.DEV
  let showDevIcons = false
</script>

<!-- h-screen layout: fixed header + map fills remaining height (task 9.9) -->
<main class="flex flex-col h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
  {#if $isLoading}
    <p class="p-4 text-sm text-neutral-400">{$_('app.loading')}</p>
  {:else}
    <header class="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-neutral-800">
      <span class="text-sm font-semibold tracking-wide">{$_('app.title')}</span>
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
      <!-- Map fills all remaining viewport height -->
      <div class="flex-1 min-h-0">
        <Map />
      </div>
    {/if}
  {/if}
</main>
