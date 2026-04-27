<script lang="ts">
  import { locale, _ } from 'svelte-i18n'
  import { MVP_LOCALES, type Locale } from '../types/locale'

  function setLocale(lang: Locale): void {
    locale.set(lang)
  }
</script>

<div class="flex items-center gap-1" role="group" aria-label={$_('language.label')}>
  {#each MVP_LOCALES as lang (lang)}
    <button
      type="button"
      class="px-2 py-1 text-xs font-medium uppercase rounded transition-colors
        {$locale === lang
          ? 'bg-sky-600 text-white'
          : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'}"
      aria-pressed={$locale === lang}
      on:click={() => setLocale(lang)}
    >
      {lang}
    </button>
  {/each}
</div>
