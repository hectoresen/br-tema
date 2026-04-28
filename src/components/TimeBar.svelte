<script lang="ts">
  import { _, locale } from 'svelte-i18n'
  import { selectedDay, selectedTimeSlot, DAYS_AHEAD } from '../stores/ui'
  import type { TimeSlot } from '../types/forecast'

  // Ordered slot sequence
  const SLOTS: TimeSlot[] = ['morning', 'afternoon', 'night']

  // ── Navigation helpers ────────────────────────────────────────────────────

  // Combined linear index: 0 = day0/morning … 11 = day3/night
  $: slotIdx = SLOTS.indexOf($selectedTimeSlot)
  $: combinedIdx = $selectedDay * SLOTS.length + slotIdx

  $: canGoPrev = combinedIdx > 0
  $: canGoNext = combinedIdx < DAYS_AHEAD * SLOTS.length - 1

  function prev(): void {
    if (!canGoPrev) return
    const next = combinedIdx - 1
    selectedDay.set(Math.floor(next / SLOTS.length))
    selectedTimeSlot.set(SLOTS[next % SLOTS.length])
  }

  function next(): void {
    if (!canGoNext) return
    const n = combinedIdx + 1
    selectedDay.set(Math.floor(n / SLOTS.length))
    selectedTimeSlot.set(SLOTS[n % SLOTS.length])
  }

  // ── Day label helpers ────────────────────────────────────────────────────

  // Maps our locale string to a valid BCP 47 tag for Intl
  function bcp47(loc: string | null | undefined): string {
    if (!loc) return 'gl'
    if (loc === 'gl') return 'gl-ES'
    if (loc === 'pt') return 'pt-PT'
    return loc
  }

  // Returns the label for each day pill (0 = today, 1 = tomorrow, 2-3 = weekday abbr)
  function dayLabel(dayOffset: number, loc: string | null | undefined): string {
    if (dayOffset === 0) return $_('forecast.today')
    if (dayOffset === 1) return $_('forecast.tomorrow')
    const d = new Date()
    d.setDate(d.getDate() + dayOffset)
    return new Intl.DateTimeFormat(bcp47(loc), { weekday: 'short' }).format(d)
  }
</script>

<!--
  TimeBar — Block 11
  Single row: [←] [slot buttons] [day pills] [→]
  Spec (Decision 21):
    - Slots share lateral borders (no gap, shared border, rounded only at edges)
    - Day pills: rounded.sm (3px), gap 4px, 10px text
    - Arrows: 28px square, 0.5px border, disabled at boundary states
    - Active slot: green-800 bg + white text
    - Active day: green-700 bg + white text
-->
<div
  class="flex-shrink-0 flex items-center gap-2 px-3 py-2"
  style="background:#FFFFFF; border-top:0.5px solid #E8E5DF;"
  role="navigation"
  aria-label="Navegación temporal"
>

  <!-- ── Left arrow ── -->
  <button
    type="button"
    class="flex items-center justify-center flex-shrink-0 transition-opacity"
    style="width:36px; height:36px; border:0.5px solid #E8E5DF; border-radius:4px; background:transparent; {canGoPrev ? '' : 'opacity:0.3; pointer-events:none;'}"
    aria-label="Anterior"
    disabled={!canGoPrev}
    on:click={prev}
  >
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M7.5 9L4.5 6l3-3"/>
    </svg>
  </button>

  <!-- ── Slot buttons — shared borders, rounded only at outer edges ── -->
  <div class="flex items-stretch flex-shrink-0" style="border:0.5px solid #E8E5DF; border-radius:4px; overflow:hidden;">
    {#each SLOTS as slot, i (slot)}
      <button
        type="button"
        class="font-medium transition-colors whitespace-nowrap"
        style="padding:5px 10px; font-size:11px; border:none; outline:none;
          {i > 0 ? 'border-left:0.5px solid #E8E5DF;' : ''}
          {$selectedTimeSlot === slot
            ? 'background:#2D4A3E; color:#FFFFFF;'
            : 'background:transparent; color:#5A5A5A;'}"
        aria-pressed={$selectedTimeSlot === slot}
        on:click={() => selectedTimeSlot.set(slot)}
      >
        {$_(`forecast.slots.${slot}`)}
      </button>
    {/each}
  </div>

  <!-- ── Day pills ── -->
  <div class="flex items-center gap-1 flex-1 justify-center flex-wrap">
    {#each Array.from({ length: DAYS_AHEAD }, (_, i) => i) as dayOffset (dayOffset)}
      <button
        type="button"
        class="font-medium transition-colors whitespace-nowrap capitalize"
        style="padding:3px 7px; font-size:10px; border-radius:3px; border:none; outline:none;
          {$selectedDay === dayOffset
            ? 'background:#3D5A3E; color:#FFFFFF;'
            : 'background:transparent; color:#5A5A5A;'}"
        aria-pressed={$selectedDay === dayOffset}
        on:click={() => selectedDay.set(dayOffset)}
      >
        {dayLabel(dayOffset, $locale)}
      </button>
    {/each}
  </div>

  <!-- ── Right arrow ── -->
  <button
    type="button"
    class="flex items-center justify-center flex-shrink-0 transition-opacity"
    style="width:36px; height:36px; border:0.5px solid #E8E5DF; border-radius:4px; background:transparent; {canGoNext ? '' : 'opacity:0.3; pointer-events:none;'}"
    aria-label="Seguinte"
    disabled={!canGoNext}
    on:click={next}
  >
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4.5 3L7.5 6l-3 3"/>
    </svg>
  </button>
</div>
