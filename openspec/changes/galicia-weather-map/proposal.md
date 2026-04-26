## Why

**Nombre de la aplicación: Brétema** *(brétema: niebla/neblina en gallego)*

Galicia carece de una herramienta web moderna y enfocada que visualice el tiempo en su territorio de forma clara, interactiva y con soporte a múltiples fuentes de datos. La dependencia directa a una sola API meteorológica supone un riesgo de disponibilidad y escalabilidad. Se quiere una solución desacoplada, extensible y con una experiencia de usuario minimalista centrada en un mapa interactivo.

## What Changes

- Nueva aplicación web estática enfocada en Galicia con mapa interactivo del tiempo
- Sistema de capas intercambiables sobre el mapa (viento, precipitación, temperatura, humedad, tormentas, estado general)
- Capa adicional de webcams públicas (carreteras, puertos de montaña, playas, etc.) visualizadas como iconos de cámara sobre el mapa
- Navegación entre los 4 días de previsión (día actual + 3 días siguientes); el mapa refleja los datos del día seleccionado
- Informe meteorológico por provincia al hacer clic sobre ella
- Adaptador de API desacoplado: el proveedor meteorológico se puede sustituir sin tocar la UI

## Capabilities

### New Capabilities

- `weather-map`: Mapa interactivo de Galicia con datos meteorológicos superpuestos como capa base
- `weather-layers`: Sistema de capas conmutables sobre el mapa (viento, precipitación, temperatura, humedad, estado general, tormentas)
- `webcam-layer`: Capa de webcams públicas — iconos de cámara geolocalizados enlazando a streams/imágenes en vivo
- `satellite-layer`: Capa de vista satélite con evolución animada de nubes, viento y precipitación usando tiles WMS/WMTS de fuentes públicas (p. ej. RainViewer, Eumetsat/Copernicus)
- `province-report`: Panel lateral o modal con informe detallado al clicar una provincia gallega
- `concello-detail`: Vista de detalle completa de un concello (similar a meteogalicia.gal/predicion/concellos) con 4 días × 3 franjas horarias (Mañana/Tarde/Noche) y datos completos
- `forecast-navigation`: Barra de navegación de 4 días; el estado del mapa y los datos se actualizan al cambiar de día
- `weather-api-adapter`: Interfaz/adaptador que abstrae el proveedor meteorológico; prioridad a APIs españolas (AEMET OpenData, MeteoSIX/MeteoGalicia); Open-Meteo como fallback sin API key
- `weather-alerts`: Tarjeta fija en la parte superior del mapa con avisos meteorológicos relevantes (tormentas, nieve, vientos fuertes, etc.)
- `concello-search`: Tarjeta debajo del mapa con buscador de concellos; muestra previsión detallada de hoy + 3 días para el concello seleccionado (por defecto: Lugo)
- `i18n`: Sistema de internacionalización sin texto hardcodeado; idiomas obligatorios: Español (es) y Gallego (gl); extensible a Inglés (en) y Portugués (pt)

### Modified Capabilities

- `weather-map`: Añadir iconos compuestos por provincia/concello con lógica basada en umbral de lluvia/nieve, tooltip con datos al hover, y preparación para expandir a nivel concello; click en concello abre vista `concello-detail`
- `forecast-navigation`: Reemplazar navegación de días simples por barra temporal con franjas Mañana/Tarde/Noche dentro de cada día + flecha para avanzar/retroceder días
- `weather-layers`: Añadir capa satélite al sistema de conmutación (capa 3 junto a general y webcams)

## Contributing a new weather provider

Añadir un nuevo proveedor meteorológico (p. ej. MeteoSIX, IPMA, OpenWeatherMap) requiere exactamente 4 pasos:

1. **Implementar la interfaz** — crear `src/providers/<nombre>.ts` que implemente `WeatherProvider` (definida en `src/providers/types.ts`). Métodos obligatorios: `getForecast(lat, lon, days)`. Métodos opcionales: `getAlerts(lat, lon)`.
2. **Registrar el proveedor** — en `src/providers/index.ts`, importar la nueva clase y asignarla como proveedor activo. No hay más cambios en la aplicación.
3. **Mapear los campos** — transformar la respuesta de la API al modelo `DayForecast` interno. El mapeo de campos y sus gaps respecto al modelo SHALL documentarse en `docs/api-research.md`. Prestar especial atención a la construcción del slot `night` (ver spec `weather-api-adapter`: cruza medianoche, 21:00–05:59 del día siguiente).
4. **Tests de transformación** — añadir tests unitarios en `src/providers/<nombre>.test.ts` que cubran al menos: respuesta nominal → `DayForecast` correcto, campo faltante → valor por defecto, error de red → estado de error propagado. Los tests deben poder ejecutarse sin acceso a internet (usar fixtures JSON del proveedor como mocks).

El resto de la aplicación (UI, stores, i18n, mapa) no necesita modificaciones.

## Impact

- **Frontend**: Aplicación web nueva (Vite + Svelte + TypeScript); mobile-first 100%; sin backend propio
- **APIs externas (prioridad)**: 1º AEMET OpenData (España, con API key gratuita, avisos, nivel municipio); 2º MeteoSIX/MeteoGalicia (cuando se conceda acceso); 3º Open-Meteo (fallback libre sin API key). La arquitectura adaptador facilita la sustitución.
- **Tiles satélite**: RainViewer API (radar+satélite, tier gratuito) y/o Eumetsat/Copernicus WMTS para capas de evolución de nubes
- **Mapas**: MapLibre GL JS con tiles OpenStreetMap; GeoJSON de provincias (carga inicial) y concellos (lazy)
- **i18n**: svelte-i18n con archivos de mensajes JSON; ES y GL obligatorios en MVP
- **Datos geoespaciales**: GeoJSON de provincias y ~313 concellos de Galicia para interactividad
