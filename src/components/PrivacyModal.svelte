<script lang="ts">
  import { _ } from 'svelte-i18n'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher<{ close: void }>()

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') dispatch('close')
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Modal backdrop -->
<div
  class="fixed inset-0 z-50 flex items-end md:items-center justify-center"
  role="dialog"
  aria-modal="true"
  aria-label={$_('privacy.title')}
>
  <!-- Dimmed backdrop -->
  <div
    class="absolute inset-0"
    style="background:rgba(0,0,0,0.45);"
    role="button"
    tabindex="0"
    aria-label={$_('ui.close')}
    on:click={() => dispatch('close')}
    on:keydown={(e) => e.key === 'Enter' && dispatch('close')}
  ></div>

  <!-- Panel -->
  <div
    class="relative w-full md:max-w-lg rounded-t-2xl md:rounded-2xl overflow-y-auto"
    style="background:#FFFFFF; max-height:85vh; padding:24px 20px 32px;"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-medium" style="font-size:15px; color:#1A1A1A;">{$_('privacy.title')}</h2>
      <button
        type="button"
        class="flex items-center justify-center"
        style="width:28px; height:28px; color:#5A5A5A; border-radius:50%; border:0.5px solid #E8E5DF;"
        aria-label={$_('ui.close')}
        on:click={() => dispatch('close')}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <path d="M1 1l10 10M11 1L1 11"/>
        </svg>
      </button>
    </div>

    <!-- Intro -->
    <p class="mb-4" style="font-size:13px; color:#5A5A5A; line-height:1.6;">{$_('privacy.intro')}</p>

    <!-- Data section -->
    <h3 class="font-medium mb-1" style="font-size:13px; color:#1A1A1A;">{$_('privacy.data_heading')}</h3>
    <p class="mb-4" style="font-size:12px; color:#5A5A5A; line-height:1.6;">{$_('privacy.data_body')}</p>

    <!-- Analytics section -->
    <h3 class="font-medium mb-1" style="font-size:13px; color:#1A1A1A;">{$_('privacy.analytics_heading')}</h3>
    <p class="mb-4" style="font-size:12px; color:#5A5A5A; line-height:1.6;">{$_('privacy.analytics_body')}</p>

    <!-- Contact section -->
    <h3 class="font-medium mb-1" style="font-size:13px; color:#1A1A1A;">{$_('privacy.contact_heading')}</h3>
    <p style="font-size:12px; color:#5A5A5A; line-height:1.6;">{$_('privacy.contact_body')}</p>
  </div>
</div>
