<script lang="ts">
  import { isLoading, _ } from 'svelte-i18n'
  import LanguageSelector from './components/LanguageSelector.svelte'

  // Dev-only preview — tree-shaken away in production builds
  const DEV = import.meta.env.DEV
  let showDevIcons = false
</script>

<main class="min-h-screen bg-neutral-950 text-neutral-100">
  {#if $isLoading}
    <p class="p-4 text-sm text-neutral-400">{$_('app.loading')}</p>
  {:else}
    <header class="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
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
      <p class="p-4 text-sm text-neutral-400">{$_('app.tagline')}</p>
    {/if}
  {/if}
</main>
