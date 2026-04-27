# Changelog — Brétema

All notable changes to this project will be documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added (FEAT/map-component — Block 9)

- `src/icons/icon-strings.ts` — shared `ICON_SVGS` record with all 8 SVG strings; imported by both `WeatherIcon.svelte` and `Map.svelte` map markers (eliminates duplication)
- `src/components/WeatherIcon.svelte` — refactored to import SVG strings from `icon-strings.ts`
- `src/components/MapPlaceholder.svelte` — static SVG of Galicia's 4 provinces (equirectangular projection, viewBox 300×200); pulsing dots + i18n labels; shown while MapLibre initialises to guarantee LCP ≤ 2.5 s (task 9.0)
- `src/components/Map.svelte` — full MapLibre GL JS 4.x map component:
  - MapLibre init with OpenFreeMap liberty tiles, `GALICIA_CENTER`/`GALICIA_ZOOM` (task 9.1)
  - Province GeoJSON `fill` + `line` layers from `galicia-provinces.geojson`; `promoteId: 'id'` for feature-state (task 9.2)
  - Weather icon HTML markers at each `PROVINCE_CENTRES` coordinate; icons computed from `forecastData` store via `getWeatherIcon()` + `ICON_SVGS`; update reactively on `selectedDay` / `selectedTimeSlot` / `forecastData` changes (task 9.3)
  - Hover: `feature-state` highlight + Svelte overlay tooltip with province name, condition, temp min/max, rain %, wind speed (task 9.4)
  - Click province → `selectedProvince` store (toggle) (task 9.5)
  - Concello layer (fill + line, `visibility: 'none'`) lazily loaded from `galicia-concellos.geojson` via dynamic `import()`; click → `selectedConcello` store; `concellosGeoJSONLoaded.set(true)` on success (task 9.6)
  - Visual highlight: `fill-color` MapLibre expression switches selected province to `rgba(29,78,216,0.28)` (sky-dark) (task 9.7)
  - `export let mapLevel: 'province' | 'concello' = 'province'`; toggles concello layer visibility (task 9.8)
  - Fills parent height (`w-full h-full`); App.svelte uses `flex-1 min-h-0` container (task 9.9)
- `src/App.svelte` — layout changed from `min-h-screen` to `flex flex-col h-screen overflow-hidden`; Map component replaces tagline placeholder; `<header>` uses `flex-shrink-0`
- `vite.config.ts` — `vite-plugin-geojson`: inline Rollup plugin transforms `.geojson` files as JSON modules; `chunkSizeWarningLimit: 6000` for concellos chunk

### Added (FEAT/stores — Block 8)

- `src/stores/ui.ts` — 8 synchronous Svelte stores: `activeLayer` (`MapLayer`), `selectedDay` (0–3), `selectedTimeSlot` (`TimeSlot`), `selectedProvince`, `selectedConcello`, `searchConcello` (default: Lugo `27028000000`), `concellosGeoJSONLoaded`; derived `forecastDates` (today + 3 YYYY-MM-DD, Europe/Madrid)
- `src/stores/forecast.ts` — `forecastData` custom store: in-memory cache by `type:id:days` key, per-key loading/error state, `loadProvince()` / `loadConcello()` async loaders, `getProvince()` / `getConcello()` synchronous accessors
- `src/stores/alerts.ts` — `alerts` custom store: `load()` calls `activeProvider.getAlerts()`, falls back to `mock-alerts.json` on error
- `src/stores/index.ts` — barrel re-export for all stores
- `src/lib/bootstrap.ts` — `bootstrapApp()` fires parallel `loadProvince()` for all 4 provinces + `alerts.load()` at startup
- `src/main.ts` — `bootstrapApp()` called at startup (before App mount)
- `src/stores/ui.test.ts` — 13 tests; `src/stores/forecast.test.ts` — 6 tests; `src/stores/alerts.test.ts` — 3 tests

### Added (FEAT/open-meteo — Block 6)

- `src/config/provinces.ts` — canonical province centre coordinates for `getProvinceForecast()` resolution
- `src/providers/open-meteo.ts` — `OpenMeteoProvider` implementing the full `WeatherProvider` interface:
  - `getForecast(lat, lon, days)` — hourly data fetched from `api.open-meteo.com`, grouped into morning/afternoon/night slots with per-slot min/max/current temperature, precipitation sum+probability, wind avg, humidity avg, cloudCover avg, mode weatherCode
  - `getProvinceForecast(provinceId, days)` — delegates to province centre coords
  - `getConcelloForecast(concelloId, days)` — resolves coords from `concellos.json` (lazy-loaded, cached)
  - `getAlerts()` — stub returning `mock-alerts.json` (Open-Meteo has no alert feed)
  - Network errors, HTTP error codes, and malformed responses all throw descriptive errors
- `src/providers/index.ts` — `activeProvider` export (currently `OpenMeteoProvider`; swap here to change provider)
- `src/providers/open-meteo.test.ts` — 14 unit tests covering slot grouping, URL params, error paths, and alert fallback

### Added (FEAT/weather-icons — Block 5)

- `src/icons/sunny.svg`, `partly-cloudy.svg`, `cloudy.svg`, `fog.svg`, `rain-light.svg`, `rain-heavy.svg`, `snow.svg`, `thunderstorm.svg` — 8 stroke-based SVG icons using `currentColor` for theme compatibility
- `src/icons/get-weather-icon.ts` — `getWeatherIcon(forecast: SlotForecast): WeatherIconId` pure function. Priority chain: thunderstorm → snow → rain-heavy → rain-light → fog → cloudy → partly-cloudy → sunny, mapping WMO codes + precipitation/cloudCover thresholds from `design.md`
- `src/components/WeatherIcon.svelte` — inline SVG component; props: `id: WeatherIconId`, `size?: number`, `label?: string`
- `src/components/dev/IconPreview.svelte` — dev-only icon grid with all 8 icons at 4 sizes, correctness check column, colour theme variants
- `App.svelte` — dev toggle button (tree-shaken in prod) to open icon preview via dynamic import
- `src/icons/get-weather-icon.test.ts` — 17 unit tests covering all icon branches and all 8 reachable states

### Added (FEAT/static-data — Block 4)

- `src/data/galicia-provinces.geojson` — 4 provinces, simplified with RDP (0.05° tolerance, island filtering) → 34.6 KB; script: `scripts/build-provinces-geojson.cjs`
- `src/data/galicia-concellos.geojson` — 313 concellos with polygon boundaries from OSM via Overpass API → 5.2 MB (lazy-loaded); script: `scripts/fetch-concellos-geojson.cjs`
- `src/data/concellos.json` — 313 concellos with id (INE code), name, nameGl, provinceId, lat, lon; sorted by province then name
- `src/data/webcams.json` — 10 webcam entries (all `mock: true`); schema: id, name, nameGl, concelloId, provinceId, lat, lon, url, source
- `src/data/mock-alerts.json` — 5 mock alerts covering all phenomena and severities; used as fallback when provider doesn't support `getAlerts()`
- `@types/geojson` installed as devDependency
- `src/vite-env.d.ts` — TypeScript module declarations for all JSON/GeoJSON data files
- `src/types/concello.ts` — added `nameGl` field, updated `id` to INE code
- `scripts/` — build scripts for provinces GeoJSON and fetching concellos from Overpass (bbox+way geometry approach)

### Added (FEAT/i18n — Block 3)

- `svelte-i18n` configured with `navigator.language` auto-detection in `src/i18n/index.ts`
- `src/i18n/es.json` — Spanish translation (base language, 60+ keys)
- `src/i18n/gl.json` — Galician translation (full parity with ES)
- `src/i18n/en.json` — English stub (full structure, for future extension)
- `src/i18n/pt.json` — Portuguese stub (full structure, for future extension)
- `LanguageSelector.svelte` component — ES/GL toggle in the header, ARIA-compliant
- `App.svelte` updated: uses `$_()` for all strings, header with language selector
- 7 unit tests for `setupI18n` (locale detection, fallback, message registration)

### Added (FEAT/project-setup — Block 2)

- Project scaffold: Vite + Svelte + TypeScript SPA, no router
- TailwindCSS with design tokens (colors, spacing, typography) in `tailwind.config.ts`
- PostCSS configured with autoprefixer
- Dependencies: `maplibre-gl`, `svelte-i18n`, `vitest`, `@playwright/test`, `rollup-plugin-visualizer`
- Folder structure: `src/components`, `stores`, `providers`, `data`, `types`, `icons`, `i18n`, `config`
- Domain types: `DayForecast`, `SlotForecast`, `TimeSlot`, `Alert`, `WeatherIcon`, `Concello`, `Locale`
- `WeatherProvider` interface in `src/providers/types.ts`
- `src/config/map.ts` — single configuration point for map tile provider (OpenFreeMap)
- `.env.example` with `METEOSIX_API_KEY` and `AEMET_API_KEY`
- ESLint configured with `@typescript-eslint` and `eslint-plugin-svelte`
- Vitest unit tests (10 tests across 3 files)
- Playwright e2e smoke test (1 test)
- `svelte.config.js` with `vitePreprocess`

### Notes

- `npm audit` reports 11 moderate vulnerabilities — all are dev-only (esbuild dev server) or Svelte SSR (not applicable to this SPA). Documented in README.md.
