import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    svelte(),
    visualizer({ filename: 'dist/stats.html', open: false, gzipSize: true }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          maplibre: ['maplibre-gl'],
        },
      },
    },
  },
})
