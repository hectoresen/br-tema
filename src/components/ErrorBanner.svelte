<script lang="ts">
  import { _ } from 'svelte-i18n'
  import { forecastData } from '../stores/forecast'

  // Show the banner only when there is at least one province-level error
  // (province errors affect the whole map; concello errors are local to the card)
  $: provinceErrors = [...$forecastData.errors.entries()].filter(([key]) =>
    key.startsWith('province:'),
  )
  $: hasError = provinceErrors.length > 0

  let dismissed = false

  // Reset dismissed state when errors clear (so it reappears on next failure)
  $: if (!hasError) dismissed = false
</script>

{#if hasError && !dismissed}
  <div
    class="flex-shrink-0 flex items-center gap-2 px-4 py-2"
    style="background:#FFF0EB; border-bottom:0.5px solid #F4845F;"
    role="alert"
    aria-live="assertive"
  >
    <!-- Warning icon -->
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#F4845F"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class="flex-shrink-0"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>

    <!-- Message -->
    <span class="flex-1 font-medium" style="font-size:11px; color:#6B2500;">
      {$_('app.error.provider')}
    </span>

    <!-- Dismiss -->
    <button
      type="button"
      class="flex-shrink-0 flex items-center justify-center"
      style="width:20px; height:20px; color:#6B2500; opacity:0.6;"
      aria-label={$_('ui.close')}
      on:click={() => (dismissed = true)}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M1 1l10 10M11 1L1 11" />
      </svg>
    </button>
  </div>
{/if}
