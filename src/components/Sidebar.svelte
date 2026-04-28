<script lang="ts">
  import { _ } from 'svelte-i18n'
  import { searchConcello, selectedConcello } from '../stores'
  import ConcellosCard from './ConcellosCard.svelte'
  import ProvinceReport from './ProvinceReport.svelte'
  import ConcellosDetail from './ConcellosDetail.svelte'
  import concellosRaw from '../data/concellos.json'

  const concellosData = concellosRaw as Array<{
    id: string
    name: string
    nameGl: string
  }>

  // Quick access: 7 main Galician cities
  const QUICK_ACCESS = [
    { id: '15030000000', label: 'A Coruña' },
    { id: '15036000000', label: 'Ferrol' },
    { id: '15078000000', label: 'Santiago' },
    { id: '27028000000', label: 'Lugo' },
    { id: '32054000000', label: 'Ourense' },
    { id: '36038000000', label: 'Pontevedra' },
    { id: '36057000000', label: 'Vigo' },
  ]

  let searchText = ''
  let isInputFocused = false

  $: suggestions =
    searchText.length >= 2
      ? concellosData
          .filter((c) =>
            (c.nameGl ?? c.name).toLowerCase().includes(searchText.toLowerCase()),
          )
          .slice(0, 6)
      : []

  function selectConcello(id: string) {
    searchConcello.set(id)
    searchText = ''
    isInputFocused = false
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      searchText = ''
      isInputFocused = false
    }
  }
</script>

<!-- Sidebar wrapper: white background, full height -->
<div class="flex flex-col bg-white" style="min-height:100%;">

  {#if $selectedConcello}
    <!-- Full concello detail view (task 16) -->
    <ConcellosDetail />
  {:else}
    <!-- Search input -->
    <div class="relative px-3 pt-3 pb-2">
    <input
      type="search"
      bind:value={searchText}
      on:focus={() => (isInputFocused = true)}
      on:blur={() => setTimeout(() => (isInputFocused = false), 150)}
      on:keydown={handleKeydown}
      placeholder={$_('concello.search')}
      class="w-full rounded-lg outline-none"
      style="
        border:0.5px solid #E8E5DF;
        background:#F5F3EF;
        padding:7px 10px;
        font-size:12px;
        color:#1A1A1A;
      "
    />
    <!-- Autocomplete dropdown -->
    {#if isInputFocused && suggestions.length > 0}
      <ul
        class="absolute left-3 right-3 rounded-lg overflow-hidden z-10"
        style="top:calc(100% - 4px); border:0.5px solid #E8E5DF; background:#FFFFFF; box-shadow:0 4px 12px rgba(0,0,0,0.08);"
      >
        {#each suggestions as c}
          <li>
            <button
              class="w-full text-left px-3 py-2 hover:bg-bretema-green-50 transition-colors"
              style="font-size:12px; color:#1A1A1A;"
              on:click={() => selectConcello(c.id)}
            >
              {c.nameGl ?? c.name}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <!-- Quick access pills -->
  <div class="flex flex-wrap gap-1 px-3 pb-3">
    {#each QUICK_ACCESS as city}
      {@const isActive = $searchConcello === city.id}
      <button
        class="rounded-full transition-colors"
        style="
          font-size:11px;
          padding:3px 8px;
          border:0.5px solid {isActive ? '#3D5A3E' : '#E8E5DF'};
          background:{isActive ? '#3D5A3E' : 'transparent'};
          color:{isActive ? '#FFFFFF' : '#5A5A5A'};
        "
        on:click={() => selectConcello(city.id)}
      >
        {city.label}
      </button>
    {/each}
  </div>

  <!-- Divider -->
  <div style="height:0.5px; background:#E8E5DF; margin:0 12px;"></div>

  <!-- Concello forecast card -->
  <ConcellosCard />

  <!-- Province report (when a province is selected on the map) -->
  <ProvinceReport />
  {/if}
</div>
