# Brétema

> *brétema* — niebla/neblina en gallego

Aplicación web interactiva de meteorología para Galicia. Mapa con capas conmutables, previsión 4 días × 3 franjas horarias (Mañana/Tarde/Noche) y vista de detalle por concello. Mobile-first.

## Stack

- **Vite + Svelte + TypeScript** — SPA sin router
- **MapLibre GL JS** — mapa interactivo
- **OpenFreeMap** — tiles de mapa (sin API key)
- **Open-Meteo** — proveedor meteorológico MVP (sin API key, CORS abierto)
- **TailwindCSS** — diseño mobile-first con design tokens
- **svelte-i18n** — i18n (Español + Gallego en MVP)
- **Vercel** — despliegue + Edge Functions para proxies de AEMET y MeteoSIX

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
npm run build      # build de producción en dist/
npm run check      # svelte-check (type checking)
npm run lint       # ESLint
npm run test       # tests unitarios (Vitest)
npm run test:e2e   # tests e2e (Playwright, requiere servidor dev corriendo)
```

## Variables de entorno

Copia `.env.example` a `.env` y rellena los valores:

```
METEOSIX_API_KEY=   # API key de MeteoSIX v5 (MeteoGalicia)
AEMET_API_KEY=      # API key de AEMET OpenData
```

> Las variables prefijadas con `VITE_` son accesibles en el cliente. Las demás solo en las Edge Functions de Vercel.

## Arquitectura de proveedores

El proveedor meteorológico activo se configura en `src/providers/index.ts`. La UI depende únicamente de la interfaz `WeatherProvider` — cambiar de proveedor no requiere tocar ningún componente.

| Prioridad | Proveedor | Estado |
|---|---|---|
| 1 | Open-Meteo | ✅ MVP activo |
| 2 | AEMET OpenData | 🔜 post-MVP |
| 3 | MeteoSIX v5 (MeteoGalicia) | 🔜 post-MVP (API key obtenida) |

## Seguridad (npm audit)

Las 11 advertencias `moderate` del audit son excepciones documentadas:
- **esbuild** `GHSA-67mh-4wv8-2f99`: solo afecta al dev server local, no al build de producción
- **Svelte SSR** (4 CVEs): todos son vulnerabilidades de Server-Side Rendering; Brétema es SPA client-side pura, nunca ejecuta SSR

## Atribución

- © OpenStreetMap contributors
- OpenFreeMap (tiles)
- Open-Meteo (datos meteorológicos MVP)
- AEMET OpenData (post-MVP)
- MeteoGalicia / MeteoSIX v5 (post-MVP)
