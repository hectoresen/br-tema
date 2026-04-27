# Changelog — Brétema

All notable changes to this project will be documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

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
