<script lang="ts">
  import { isLoading, _ } from 'svelte-i18n'
  import LanguageSelector from './components/LanguageSelector.svelte'
</script>

<main class="min-h-screen bg-neutral-950 text-neutral-100">
  {#if $isLoading}
    <p class="p-4 text-sm text-neutral-400">{$_('app.loading')}</p>
  {:else}
    <header class="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
      <span class="text-sm font-semibold tracking-wide">{$_('app.title')}</span>
      <LanguageSelector />
    </header>
    <p class="p-4 text-sm text-neutral-400">{$_('app.tagline')}</p>
  {/if}
</main>
