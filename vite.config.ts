import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { visualizer } from 'rollup-plugin-visualizer'
import type { Plugin } from 'vite'

/** Treat .geojson files as JSON modules (same as Vite's built-in JSON support) */
const geojsonPlugin: Plugin = {
  name: 'vite-plugin-geojson',
  transform(code, id) {
    if (!id.endsWith('.geojson')) return null
    return { code: `export default ${code}`, map: null }
  },
}

export default defineConfig({
  plugins: [
    svelte(),
    geojsonPlugin,
    visualizer({ filename: 'dist/stats.html', open: false, gzipSize: true }),
  ],
  build: {
    chunkSizeWarningLimit: 6000, // galicia-concellos.geojson is ~5.4 MB (lazy-loaded)
    rollupOptions: {
      output: {
        manualChunks: {
          maplibre: ['maplibre-gl'],
        },
      },
    },
  },
})
