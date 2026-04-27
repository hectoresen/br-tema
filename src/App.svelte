<script lang="ts">
  import { onMount } from 'svelte'
  import { _ } from 'svelte-i18n'
  import LanguageSelector from './components/LanguageSelector.svelte'
  import Map from './components/Map.svelte'

  // Dev-only preview — tree-shaken away in production builds
  const DEV = import.meta.env.DEV
  let showDevIcons = false

  // ── Dark mode ────────────────────────────────────────────────────────────────
  let isDark = false

  onMount(() => {
    const stored = localStorage.getItem('bretema-theme')
    isDark = stored !== null
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(isDark)
  })

  function applyTheme(dark: boolean) {
    document.documentElement.classList.toggle('dark', dark)
  }

  function toggleTheme() {
    isDark = !isDark
    localStorage.setItem('bretema-theme', isDark ? 'dark' : 'light')
    applyTheme(isDark)
  }
</script>

<!-- Light by default; 'dark' class on <html> activates dark: variants -->
<main class="flex flex-col h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-hidden">
  <header class="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
    <span class="text-sm font-semibold tracking-wide">{$_('app.title')}</span>
    <div class="flex items-center gap-2">
      {#if DEV}
        <button
          class="text-xs text-neutral-400 hover:text-sky-600 dark:text-neutral-500 dark:hover:text-sky-400 transition-colors"
          on:click={() => (showDevIcons = !showDevIcons)}
        >
          {showDevIcons ? 'hide icons' : 'dev: icons'}
        </button>
      {/if}

      <!-- Dark/light mode toggle -->
      <button
        type="button"
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={isDark ? 'Modo claro' : 'Modo oscuro'}
        class="w-7 h-7 flex items-center justify-center rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        on:click={toggleTheme}
      >
        {#if isDark}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="4"/>
            <line x1="12" y1="2" x2="12" y2="4"/>
            <line x1="12" y1="20" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="4" y2="12"/>
            <line x1="20" y1="12" x2="22" y2="12"/>
            <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/>
            <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>
            <line x1="19.07" y1="4.93" x2="17.66" y2="6.34"/>
            <line x1="6.34" y1="17.66" x2="4.93" y2="19.07"/>
          </svg>
        {:else}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        {/if}
      </button>

      <LanguageSelector />
    </div>
  </header>

  {#if DEV && showDevIcons}
    {#await import('./components/dev/IconPreview.svelte') then { default: IconPreview }}
      <svelte:component this={IconPreview} />
    {/await}
  {:else}
    <div class="flex-1 min-h-0">
      <Map />
    </div>
  {/if}
</main>
