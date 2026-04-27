<script lang="ts">
  import { _ } from 'svelte-i18n'
  import { alerts } from '../stores/alerts'
  import type { AlertSeverity } from '../types/alert'

  // ── Severity helpers ──────────────────────────────────────────────────────

  // Returns the chip inline style for each severity level (spec: alert-chip-*)
  function chipStyle(severity: AlertSeverity): string {
    if (severity === 'red')    return 'background:#E63946; color:#FFFFFF;'
    if (severity === 'orange') return 'background:#F4845F; color:#6B2500;'
    return                            'background:#F9C74F; color:#7A5800;'
  }

  // The banner background follows the most severe active alert
  function bannerBg(severities: AlertSeverity[]): string {
    if (severities.includes('red'))    return 'background:#FFF0F0; border-bottom:0.5px solid #E63946;'
    if (severities.includes('orange')) return 'background:#FFF0EB; border-bottom:0.5px solid #F4845F;'
    if (severities.includes('yellow')) return 'background:#FFF8E1; border-bottom:0.5px solid #F9C74F;'
    return 'background:#F5F3EF; border-bottom:0.5px solid #E8E5DF;'
  }

  // Deduplicate: one chip per severity level present
  function distinctSeverities(severities: AlertSeverity[]): AlertSeverity[] {
    return (['red', 'orange', 'yellow'] as AlertSeverity[]).filter((s) =>
      severities.includes(s)
    )
  }
</script>

{#if $alerts}
  {@const activeAlerts = $alerts.alerts}
  {@const severities = activeAlerts.map((a) => a.severity)}
  {@const bg = bannerBg(severities)}

  <!-- Always rendered — no alerts shows "Sen avisos activos" (prevents CLS) -->
  <div
    class="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 min-h-[30px]"
    style={bg}
    role="region"
    aria-label={$_('alert.title')}
  >
    {#if activeAlerts.length === 0}
      <!-- Empty state -->
      <span class="text-xs" style="color:#9A9A9A; font-size:11px;">
        {$_('alert.none')}
      </span>
    {:else}
      <!-- Alert icon -->
      <svg
        width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="#F9C74F" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true" class="flex-shrink-0"
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>

      <!-- Summary text -->
      <span class="text-xs font-medium flex-1 truncate" style="color:#7A5800; font-size:11px;">
        {$_('alert.active')}
      </span>

      <!-- One chip per severity level, ordered red → orange → yellow -->
      <div class="flex items-center gap-1 flex-shrink-0">
        {#each distinctSeverities(severities) as severity (severity)}
          <span
            class="px-2 py-0.5 font-medium"
            style="{chipStyle(severity)} font-size:10px; border-radius:3px;"
          >
            {$_(`alert.severity.${severity}`)}
          </span>
        {/each}
      </div>
    {/if}
  </div>
{/if}
