## 1. InvestigaciÃ³n y decisiones tÃ©cnicas (hacer PRIMERO)

- [ ] 1.1 Investigar endpoints de AEMET OpenData: predicciÃ³n municipal, avisos Meteoalerta; documentar en `docs/api-research.md`
- [ ] 1.2 Validar acceso a MeteoSIX (MeteoGalicia) y documentar endpoints disponibles en `docs/api-research.md`
- [ ] 1.3 Mapear campos de AEMET y MeteoSIX al modelo `DayForecast` interno; documentar gaps
- [ ] 1.4 Evaluar RainViewer API: obtener timestamps de animaciÃ³n, verificar lÃ­mites del tier gratuito, documentar endpoint
- [x] 1.5 **Resuelto**: Vercel — Edge Function para proxy AEMET en el mismo repo, SPA desplegada automáticamente desde Git, tier gratuito suficiente. Configurar `vercel.json` con rewrite `/api/*` en el bloque 7.
- [x] 1.6 **Resuelto**: Panel reactivo sobre el mapa (SPA sin router). selectedConcello store controla visibilidad. Stack: Vite + Svelte puro sin SvelteKit.

## 2. Proyecto base

- [ ] 2.1 Inicializar proyecto con Vite + Svelte + TypeScript (`npm create vite@latest`) — SPA sin router; la vista de detalle de concello es un panel reactivo a `selectedConcello`
- [ ] 2.2 Configurar TailwindCSS con design tokens (colores, spacing, tipografÃ­a) en `tailwind.config.ts`
- [ ] 2.3 Instalar dependencias: `maplibre-gl`, `svelte-i18n`, tipos necesarios
- [ ] 2.4 Configurar estructura de carpetas: `src/components`, `src/stores`, `src/providers`, `src/data`, `src/types`, `src/icons`, `src/i18n`, `src/config`
- [ ] 2.5 Definir el modelo de datos interno `DayForecast` (con slots `morning`/`afternoon`/`night`) en `src/types/forecast.ts`
- [ ] 2.6 Definir la interfaz `WeatherProvider` (incluyendo mÃ©todo opcional `getAlerts()`) en `src/providers/types.ts`
- [ ] 2.7 Definir tipos `Alert`, `WeatherIcon`, `TimeSlot`, `Concello`, `Locale` en `src/types/`
- [ ] 2.8 Crear `src/config/map.ts` con `MAP_STYLE_URL` apuntando a OpenFreeMap (free, sin API key) — único punto donde se configura el proveedor de tiles del mapa
- [ ] 2.9 Instalar `vite-bundle-visualizer` como devDependency — ejecutar antes de publicar para verificar que el bundle inicial no supera 150KB gzipped; no incluir MapLibre ni GeoJSON en el chunk principal

## 3. InternacionalizaciÃ³n (i18n)

- [ ] 3.1 Instalar y configurar `svelte-i18n` con detecciÃ³n automÃ¡tica de `navigator.language`
- [ ] 3.2 Crear estructura de claves en `src/i18n/es.json` (EspaÃ±ol â€” idioma base)
- [ ] 3.3 Traducir todas las claves al Gallego en `src/i18n/gl.json`
- [ ] 3.4 Crear archivos vacÃ­os con estructura `src/i18n/en.json` y `src/i18n/pt.json` como plantillas para extensiÃ³n futura
- [ ] 3.5 Crear componente `LanguageSelector.svelte` para la cabecera (ES/GL)
- [ ] 3.6 Verificar que no existe ningÃºn string hardcodeado en ningÃºn componente (auditorÃ­a)

## 4. Datos estÃ¡ticos y geoespaciales

- [ ] 4.1 Obtener GeoJSON de las 4 provincias de Galicia (IGN o Natural Earth) y aÃ±adirlo como `src/data/galicia-provinces.geojson`
- [ ] 4.2 Simplificar/optimizar el GeoJSON de provincias para rendimiento web
- [ ] 4.3 Obtener GeoJSON de los concellos de Galicia y aÃ±adirlo como `src/data/galicia-concellos.geojson` (lazy-load, no incluido en bundle inicial)
- [ ] 4.4 Crear `src/data/webcams.json` con lista inicial de webcams pÃºblicas (DGT, Meteogalicia); marcar entradas sin URL verificada con `"mock": true`
- [ ] 4.5 Crear `src/data/concellos.json` con lista de los ~313 concellos gallegos (nombre, id, lat, lon, provinciaId) para el buscador
- [ ] 4.6 Crear `src/data/mock-alerts.json` con avisos meteorolÃ³gicos mock para usar cuando el proveedor no soporte `getAlerts()`

## 5. Sistema de iconos meteorolÃ³gicos compuestos

- [ ] 5.1 Crear SVGs base en `src/icons/`: `sunny`, `partly-cloudy`, `cloudy`, `fog`
- [ ] 5.2 Crear SVGs modificadores: `rain-light`, `rain-heavy`, `snow`, `lightning`
- [ ] 5.3 Implementar funciÃ³n `getWeatherIcon(forecast: SlotForecast): WeatherIconId` con la lÃ³gica de umbrales (cloudCover, precipitationProbability, weatherCode)
- [ ] 5.4 Implementar componente `WeatherIcon.svelte` que renderiza el icono compuesto correctamente
- [ ] 5.5 Cubrir todos los casos WMO: soleado, parcialmente nublado, nublado, niebla, lluvia suave, lluvia intensa, nieve + altitud, tormenta
- [ ] 5.6 Crear página `/dev/icons` (ruta solo en modo desarrollo) que renderice todos los estados posibles del icono compuesto con sus inputs de umbral visibles — permite verificación visual sin tocar el mapa

## 6. Adaptador meteorolÃ³gico (Open-Meteo â€” MVP)

- [ ] 6.1 Implementar `OpenMeteoProvider` en `src/providers/open-meteo.ts` — es el **proveedor MVP**; AEMET y MeteoSIX son mejoras post-MVP, no bloqueantes
- [ ] 6.2 Implementar `getProvinceForecast` usando coordenadas centrales de cada provincia
- [ ] 6.3 Implementar `getConcelloForecast` para bÃºsqueda por concello
- [ ] 6.4 Transformar datos horarios de Open-Meteo a slots `morning`/`afternoon`/`night`
- [ ] 6.5 Implementar `getAlerts()` como stub con fallback a `mock-alerts.json`
- [ ] 6.6 Manejar errores de red y devolver estado de error al store
- [ ] 6.7 Registrar `OpenMeteoProvider` como proveedor activo en `src/providers/index.ts`

## 7. Adaptador AEMET OpenData (prioridad post-MVP inmediata)

- [ ] 7.1 Crear thin proxy serverless (`/api/aemet-proxy`) en la plataforma decidida en 1.5
- [ ] 7.2 Implementar `AemetProvider` en `src/providers/aemet.ts` con `getForecast` usando endpoint municipal
- [ ] 7.3 Implementar `getAlerts()` usando AEMET Meteoalerta por CCAA/provincia — ⚠️ **Formato CAP/XML** (posiblemente ZIP+XML, no JSON): evaluar complejidad de parseo antes de implementar; si es costoso, mantener `mock-alerts.json` como fallback y dejar esta tarea para una iteración posterior
- [ ] 7.4 Mapear respuesta AEMET al modelo `DayForecast` (usando `docs/api-research.md`)
- [ ] 7.5 AÃ±adir gestiÃ³n de API key via variable de entorno; fallback a Open-Meteo si no estÃ¡ configurada
- [ ] 7.6 Cambiar el proveedor activo en `src/providers/index.ts` a `AemetProvider`

## 8. Stores de estado global

- [ ] 8.1 Crear store `activeLayer` (`general` | `wind` | `precipitation` | `temperature` | `humidity` | `storms` | `webcams` | `satellite`)
- [ ] 8.2 Crear store `selectedDay` (Ã­ndice 0â€“3, defecto: 0)
- [ ] 8.3 Crear store `selectedTimeSlot` (`morning` | `afternoon` | `night`, defecto: `morning`)
- [ ] 8.4 Crear store `selectedProvince` (ID o null)
- [ ] 8.5 Crear store `selectedConcello` (null en home; poblado en vista detalle)
- [ ] 8.6 Crear store `searchConcello` (defecto: ID de Lugo)
- [ ] 8.7 Crear store `forecastData` (cachÃ© por concello/provincia + dÃ­a + slot)
- [ ] 8.8 Crear store `alerts` (lista `Alert[]`)
- [ ] 8.9 Crear store `locale` (`es` | `gl`, detectado desde `navigator.language`)
- [ ] 8.10 Crear store `concellosGeoJSONLoaded` (`boolean`, defecto `false`) — `Map.svelte` lo pone a `true` al completar la carga lazy del GeoJSON de concellos; bloquea la interactividad a nivel concello hasta que sea `true`
- [ ] 8.12 Implementar carga inicial de datos al arrancar la app: cargar previsión (slot morning, día 0) para las 4 provincias gallegas en paralelo; poblar el store forecastData; mostrar spinner en el mapa hasta que las 4 estén disponibles. No se espera interacción del usuario para iniciar la carga.

## 9. Componente de mapa principal

- [ ] 9.0 Crear componente `MapPlaceholder.svelte` con SVG estático de las 4 provincias gallegas — visible mientras MapLibre inicializa; sustituido por el mapa real en cuanto `map.loaded()` sea `true`. Garantiza LCP ≤ 2.5s independientemente del tiempo de carga de MapLibre.
- [ ] 9.1 Crear componente `Map.svelte` que inicialice MapLibre GL JS con tiles de **OpenFreeMap** (sin API key). ⚠️ **Componente de mayor riesgo técnico — validar rendimiento en móvil (390px) antes de continuar con bloques 10–18.**
- [ ] 9.2 AÃ±adir capa vectorial GeoJSON de provincias sobre el mapa base
- [ ] 9.3 Renderizar icono meteorolÃ³gico compuesto en el centro geogrÃ¡fico de cada provincia
- [ ] 9.4 Implementar tooltip al hacer hover en provincia (temp mÃ­n/mÃ¡x, humedad, viento, lluvia %)
- [ ] 9.5 Implementar click en provincia â†’ actualizar `selectedProvince`
- [ ] 9.6 Implementar click en concello (si GeoJSON de concellos estÃ¡ activo) â†’ navegar a vista detalle
- [ ] 9.7 Implementar resaltado visual de la provincia/concello seleccionado
- [ ] 9.8 Preparar flag de configuraciÃ³n `mapLevel` (`province` | `concello`) para switching
- [ ] 9.9 Hacer el mapa responsive (100% viewport height en mÃ³vil)

## 10. Sistema de capas (selector + capas individuales)

- [ ] 10.1 Crear componente `LayerSelector.svelte` con botones: General, Viento, Temperatura, Humedad, PrecipitaciÃ³n, Tormentas, Webcams, SatÃ©lite
- [ ] 10.2 Conectar selector al store `activeLayer`; resaltar botÃ³n activo; etiquetas via i18n
- [ ] 10.3 Implementar capa `general` (iconos compuestos por provincia)
- [ ] 10.4 Implementar capa `temperature`: colormap por temperatura sobre las provincias (degradado frío→cálido)
- [ ] 10.5 Implementar capa `precipitation`: intensidad de precipitación con colormap azul por provincia
- [ ] 10.6 Implementar capa `humidity`: porcentaje de humedad por provincia con colormap
- [ ] 10.7 Implementar capa `storms`: indicador de tormenta activa por provincia (badge/icono sobre la capa general)
- [ ] 10.8 Implementar capa `wind`: flechas o barbas de viento por provincia indicando velocidad y dirección — nota: puede requerir renderizado vectorial personalizado en MapLibre
- [ ] 10.9 Implementar capa `webcams` (ver tarea 11)
- [ ] 10.10 Implementar capa `satellite` (ver tarea 12)

## 11. Capa de webcams

- [ ] 11.1 Crear componente `WebcamLayer.svelte` con iconos de cÃ¡mara en el mapa
- [ ] 11.2 Implementar popup al clic (nombre + botÃ³n de acceso); abrir URL en nueva pestaÃ±a
- [ ] 11.3 Marcar visualmente entradas mock en el popup (`"(demo)"`)

## 12. Capa satÃ©lite con animaciÃ³n

- [ ] 12.1 Implementar `SatelliteLayer.svelte` que cargue timestamps de animaciÃ³n desde RainViewer API
- [ ] 12.2 AÃ±adir tiles de radar/satÃ©lite como capa raster en MapLibre con los frames disponibles
- [ ] 12.3 Implementar animaciÃ³n de frames (loop automÃ¡tico al activar la capa)
- [ ] 12.4 AÃ±adir control play/pausa visible sobre el mapa
- [ ] 12.5 Implementar degradaciÃ³n graceful si RainViewer no estÃ¡ disponible (mensaje i18n)

## 13. Barra de navegaciÃ³n temporal (franjas + dÃ­as)

- [ ] 13.1 Crear componente `TimeBar.svelte` con botones MaÃ±ana / Tarde / Noche (etiquetas i18n)
- [ ] 13.2 Conectar selecciÃ³n de franja al store `selectedTimeSlot` y actualizar el mapa
- [ ] 13.3 AÃ±adir flecha derecha para avanzar al dÃ­a siguiente (mÃ¡x. hoy + 3)
- [ ] 13.4 AÃ±adir flecha izquierda para retroceder (deshabilitada en dÃ­a actual)
- [ ] 13.5 Mostrar icono de estado y etiqueta del dÃ­a activo en la barra (etiqueta i18n: "Hoy"/"Hoxe", dÃ­as de semana)
- [ ] 13.6 **Auditoría i18n — primera pasada** (bloques 8–13): verificar que ningún componente creado hasta aquí tiene strings hardcodeados; corregir antes de continuar

## 14. Tarjeta de avisos meteorolÃ³gicos

- [ ] 14.1 Crear componente `AlertsBanner.svelte` en la parte superior del mapa
- [ ] 14.2 Renderizar cada alerta con badge de color segÃºn nivel (amarillo/naranja/rojo); etiquetas i18n
- [ ] 14.3 Mostrar estado "Sin avisos activos" (`alerts.none` clave i18n) cuando lista vacÃ­a
- [ ] 14.4 Usar `mock-alerts.json` cuando el proveedor no soporte `getAlerts()`

## 15. Tarjeta de bÃºsqueda por concello

- [ ] 15.1 Crear componente `ConcellosCard.svelte` debajo del mapa
- [ ] 15.2 Implementar buscador con autocompletado (tolerante a acentos/mayÃºsculas) usando `concellos.json`
- [ ] 15.3 Mostrar lista desplegable de sugerencias (mÃ¡x. 8) al escribir â‰¥ 2 caracteres
- [ ] 15.4 Al seleccionar concello, cargar y mostrar su previsiÃ³n de 4 dÃ­as
- [ ] 15.5 Renderizar cada columna con: icono, temp mÃ¡x/mÃ­n, lluvia %, humedad %, viento, badge de alerta si aplica
- [ ] 15.6 Resaltar columna del dÃ­a actual; todas las etiquetas via i18n

## 16. Vista de detalle de concello

- [ ] 16.1 Crear panel `ConcellosDetail.svelte` reactivo al store `selectedConcello` (visible cuando `!== null`); accesible desde click en el mapa o buscador — en móvil: slide-up 100% viewport; en desktop: drawer lateral
- [ ] 16.2 Renderizar cabecera: nombre del concello, provincia, temperatura actual, icono estado, amanecer/ocaso
- [ ] 16.3 Renderizar 4 columnas (Hoy + 3 dÃ­as) Ã— 3 franjas (MaÃ±ana/Tarde/Noche) con icono, lluvia %, viento
- [ ] 16.4 Mostrar temp mÃ¡x/mÃ­n en cabecera de cada columna de dÃ­a; columna de hoy destacada
- [ ] 16.5 Mostrar badge de alerta si hay alertas activas para ese concello/dÃ­a
- [ ] 16.6 Mostrar secciÃ³n de comentario textual si el proveedor lo devuelve; omitir si no
- [ ] 16.7 BotÃ³n de vuelta al mapa visible en mÃ³vil y desktop; todas las etiquetas via i18n

## 17. Informe por provincia (panel)

- [ ] 17.1 Crear componente `ProvinceReport.svelte` (panel lateral o modal)
- [ ] 17.2 Mostrar datos del slot activo para la provincia seleccionada
- [ ] 17.3 Actualizar reactivamente al cambiar `selectedDay` o `selectedTimeSlot`
- [ ] 17.4 Implementar botÃ³n de cierre; etiquetas via i18n

## 18. SEO, metadatos y compartibilidad social

- [ ] 18.1 Añadir metadatos estáticos completos en `index.html`: `<meta name="description">`, `og:title`, `og:description`, `og:image`, `og:type`, `twitter:card`
- [ ] 18.2 Crear imagen OG `/public/og-image.png` (1200×630px) con captura real del mapa con datos cargados
- [ ] 18.3 Implementar `<title>` dinámico reactivo a `selectedConcello`: `"${concello.nombre} — Brétema"` cuando seleccionado, `"Brétema"` en vista general — actualizar con `document.title` en un `$:` reactivo
- [ ] 18.4 Crear `public/robots.txt` que permita indexación; crear `public/sitemap.xml` mínimo con la URL raíz

## 19. Observabilidad

- [ ] 19.1 Instalar Plausible Analytics: añadir script `<script defer data-domain="..." src="https://plausible.io/js/script.js">` en `index.html`; configurar dominio en Plausible dashboard
- [ ] 19.2 Instrumentar evento `layer_change` (nombre de la capa activada) desde `LayerSelector.svelte` via `plausible('layer_change', { props: { layer } })`
- [ ] 19.3 Instrumentar evento `concello_search` (sin el término, solo el evento) desde `ConcellosCard.svelte`
- [ ] 19.4 Instrumentar evento `concello_detail_open` desde `ConcellosDetail.svelte` al abrirse el panel
- [ ] 19.5 Instrumentar evento `provider_fallback` en `src/providers/index.ts` cuando Open-Meteo actúa como fallback de AEMET
- [ ] 19.6 Instalar `@sentry/svelte`; inicializar en entry point (`src/main.ts`) con DSN de Sentry Free tier
- [ ] 19.7 Capturar errores de red en `OpenMeteoProvider` y `AemetProvider` con `Sentry.captureException`
- [ ] 19.8 Capturar errores de parseo de GeoJSON en `Map.svelte` con `Sentry.captureException`
- [ ] 19.9 Añadir logging estructurado al proxy AEMET (`/api/aemet-proxy`): timestamp, endpoint, status request 1, status request 2, latency total
- [ ] 19.10 Crear endpoint `/api/health`: request mínima a AEMET (municipio de Lugo); devuelve `{ status, provider, latency_ms }` o `{ status: "degraded", reason }`

## 20. Pulido UI, mobile-first y calidad

- [ ] 20.1 Revisar cada pantalla en viewport 390px (iPhone); ajustar layout, tamaños de texto y controles táctiles
- [ ] 20.2 Verificar breakpoints sm/md/lg para tablet y desktop
- [ ] 20.3 Añadir estados de carga (skeleton/spinner) en mapa, tarjeta de concello y vista detalle
- [ ] 20.4 Añadir mensaje de error global si el proveedor falla
- [ ] 20.5 **Auditoría i18n — segunda pasada** (bloques 14–17): verificar strings hardcodeados en los componentes creados tras la primera auditoría (13.6)
- [ ] 20.6 Verificar que cambiar el proveedor en `src/providers/index.ts` funciona sin tocar UI
- [ ] 20.7 Ejecutar `vite-bundle-visualizer` y confirmar bundle inicial ≤ 150KB gzipped; MapLibre y GeoJSON de concellos fuera del chunk principal
- [ ] 20.8 Configurar Lighthouse CI en el pipeline de Vercel — umbral de fallo: LCP > 4s en mobile; objetivo real: LCP ≤ 2.5s, CLS < 0.1, INP < 200ms
- [ ] 20.9 Verificar que el SVG placeholder (`MapPlaceholder.svelte`) aparece antes de que MapLibre termine de inicializar — medir LCP real con DevTools en modo móvil throttled (4G)

