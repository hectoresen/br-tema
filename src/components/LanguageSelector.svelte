<script lang="ts">
  import { locale, _ } from 'svelte-i18n'
  import { MVP_LOCALES, type Locale } from '../types/locale'

  function setLocale(lang: Locale): void {
    locale.set(lang)
  }
</script>

<!-- Pills rendered on top of the green-800 header -->
<div class="flex items-center gap-1" role="group" aria-label={$_('language.label')}>
  {#each MVP_LOCALES as lang (lang)}
    <button
      type="button"
      class="px-2 py-0.5 text-xs font-medium uppercase rounded-full transition-colors"
      style={$locale === lang
        ? 'color:#E8F0EC; border:1px solid #7EB89A;'
        : 'color:#9EC4B0; border:1px solid transparent;'}
      aria-pressed={$locale === lang}
      on:click={() => setLocale(lang)}
    >
      {lang}
    </button>
  {/each}
</div>
