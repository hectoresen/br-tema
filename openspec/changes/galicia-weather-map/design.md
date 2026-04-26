## Context

**Nombre de la aplicación: Brétema** *(brétema: niebla/neblina en gallego)*

No existe actualmente ninguna aplicación en este repositorio. Se parte de cero. El objetivo es construir una web estática (sin backend propio) que visualice el tiempo para Galicia de manera interactiva, con soporte a múltiples capas cartográficas, navegación temporal de 4 días y detalle por concello. Mobile-first 100%: el diseño arranca desde pantallas pequeñas y se adapta a desktop. La fuente de datos meteorológicos debe poder sustituirse — se priorizan APIs españolas (AEMET, MeteoSIX) sobre soluciones genéricas.

## Goals / Non-Goals

**Goals:**
- Mapa interactivo de Galicia con capas conmutables (meteorología general, webcams, satélite)
- Navegación de previsión 4 días × 3 franjas horarias (Mañana/Tarde/Noche)
- Vista de detalle completa por concello (click desde el mapa)
- Patrón adaptador para el proveedor meteorológico; prioridad a AEMET y MeteoSIX
- Interfaz minimalista, mobile-first, con sistema de diseño tokenizado
- i18n completo: Español y Gallego en MVP; Inglés y Portugués como extensiones
- Catálogo de iconos SVG sustituible sin cambios en componentes

**Non-Goals:**
- Backend o API propios
- Alertas o notificaciones push
- Datos históricos (más allá de los 4 días de previsión)
- Soporte a otras comunidades autónomas
- Autenticación de usuarios

## Decisions

### 1. Stack: Aplicación web estática con framework ligero

**Decisión**: Vite + TypeScript + un framework ligero (Svelte o React). Se recomienda **Svelte** por su bundle reducido y sintaxis reactiva sin overhead de runtime.

**Alternativas consideradas**:
- Vanilla JS: menor DX, más código boilerplate para reactivity
- Vue 3: buena opción, mayor bundle que Svelte
- React: más ecosistema pero mayor bundle y verbosidad

**Rationale**: Una aplicación con estado (capas activas, día seleccionado, datos cargados) se beneficia de un framework reactivo. Svelte produce bundles muy pequeños, ideal para una SPA estática.

---

### 2. Estrategia de APIs meteorológicas (prioridad española)

**Decisión**: Jerarquía de proveedores a implementar en este orden:

| Prioridad | Proveedor | Cobertura | Detalle | API key | CORS |
|---|---|---|---|---|---|
| 1 | **AEMET OpenData** | España (municipios) | Avisos oficiales, predicción municipal | Gratuita (registro) | Necesita proxy |
| 2 | **MeteoSIX (MeteoGalicia)** | Galicia (concellos) | Máxima precisión local | Acceso pendiente | A verificar |
| 3 | **Open-Meteo** | Mundial | Datos horarios sin API key | No requiere | Sí (CORS abierto) |

AEMET es la fuente oficial española con avisos meteoalerta por CC.AA. y municipio. MeteoSIX es la fuente de referencia para Galicia en detalle de concello. Open-Meteo actúa como fallback funcional.

**CORS para AEMET**: AEMET OpenData usa CORS restrictivo. Se añadirá un thin proxy (Cloudflare Worker o Vercel Edge Function ~10 líneas) que reenvía la request añadiendo la API key. El proxy es el único componente serverless del proyecto.

**Tarea de investigación**: Como primer paso de implementación se investigarán y documentarán los endpoints exactos de AEMET municipio, el modelo de datos de MeteoSIX y se validará qué campos devuelve cada uno frente al modelo `DayForecast` interno.

---

### 3. Diseño: Mobile-first y sistema de tokens

**Decisión**: Diseño mobile-first con TailwindCSS. Layout base para ≤390px (iPhone), breakpoints sm/md/lg para tablet/desktop. Se define un conjunto de design tokens en `tailwind.config.ts`:
- `colors`: paleta neutral + accent (azul meteorológico) + alert colors (yellow/orange/red)
- `spacing`: escala consistente 4px base
- `typography`: fuente sans-serif del sistema + jerarquía clara H1–H4/body/caption

El catálogo de iconos meteorológicos se gestiona en `src/icons/` como SVGs independientes. Los iconos se referencian por ID semántico (`sunny`, `partly-cloudy`, etc.) nunca por ruta directa desde los componentes. Para sustituir el catálogo basta con reemplazar los SVGs en `src/icons/` sin tocar ningún componente.

**Referencias de estilo**: Meteogalicia (limpio, funcional), El Tiempo ES (datos densos pero legibles), Windy (capa satélite inmersiva).

---

### 4. Internacionalización: svelte-i18n

**Decisión**: **svelte-i18n** (ICU message format). Archivos de mensajes en `src/i18n/`: `es.json`, `gl.json`. Se añadirán `en.json` y `pt.json` en iteraciones posteriores. **Ningún string visible al usuario se hardcodea en componentes**; todos van a los archivos de mensajes.

```
src/i18n/
  es.json   ← Español (MVP obligatorio)
  gl.json   ← Gallego (MVP obligatorio)
  en.json   ← Inglés (extensión futura)
  pt.json   ← Portugués (extensión futura)
```

El selector de idioma (ES/GL) se muestra en la cabecera. El idioma por defecto se detecta desde `navigator.language`.

---

### 5. Librería de mapas: MapLibre GL JS

**Decisión**: **MapLibre GL JS** con tiles de OpenStreetMap o MapTiler.

**Alternativas consideradas**:
- Leaflet: más simple, pero limitado para capas vectoriales y rendimiento con datos raster pesados
- Google Maps: coste y lock-in
- OpenLayers: potente pero API más compleja

**Rationale**: MapLibre permite capas raster (p. ej. tiles WMS de AEMET) y vectoriales (GeoJSON de provincias), con buena performance y licencia libre.

---

### 6. Patrón adaptador para proveedores meteorológicos

**Decisión**: Interfaz `WeatherProvider` con implementaciones intercambiables. La UI solo conoce la interfaz; el proveedor concreto se registra en un único punto de configuración (`src/providers/index.ts`).

```ts
interface WeatherProvider {
  getForecast(lat: number, lon: number, days: number): Promise<DayForecast[]>
  getProvinceForecast(provinceId: string, days: number): Promise<DayForecast[]>
  getConcelloForecast(concelloId: string, days: number): Promise<DayForecast[]>
  getAlerts?(): Promise<Alert[]>
}
```

**Proveedor inicial**: Open-Meteo (libre, sin API key). Siguientes: AEMET OpenData, MeteoSIX.

**Rationale**: Desacopla completamente la fuente de datos de la presentación. Cambiar de proveedor = implementar la interfaz y cambiar una línea en la config.

---

### 7. Datos geoespaciales de Galicia

**Decisión**: GeoJSON de provincias gallegas (A Coruña, Lugo, Ourense, Pontevedra) obtenido de fuentes públicas (IGN, Natural Earth). El GeoJSON se sirve como asset estático. GeoJSON de concellos (~313) se carga lazy en el primer render del mapa (no en bundle inicial, no espera a que el usuario abra el detalle de concello). Con `mapLevel === 'concello'` activo desde el MVP, el GeoJSON de concellos se necesita para renderizar la capa vectorial del mapa — se precarga de forma diferida pero lo antes posible tras la carga inicial de provincias.

**Rationale**: Sin dependencia de servicio externo para la geometría base. Las 4 provincias son un dataset pequeño y estable.

---

### 8. Iconos meteorológicos compuestos

**Decisión**: Iconos SVG compuestos calculados en cliente a partir de tres variables del proveedor: `cloudCover` (porcentaje), `precipitationProbability` y `weatherCode`. Se define un mapa de estados base → icono:

| Estado base | Condición adicional | Resultado |
|---|---|---|
| Soleado | — | ☀️ `sunny` |
| Parcialmente nublado | — | 🌤 `partly-cloudy` |
| Nublado | — | ☁️ `cloudy` |
| Cualquiera + lluvia ≥ 50% | — | Añadir gota al icono base |
| Cualquiera + lluvia ≥ 75% | — | Añadir gotas intensas al icono base |
| Cualquiera + nieve | — | Añadir copo de nieve + altitud mínima esperada |
| Cualquiera + tormenta | — | Añadir rayo al icono base |

Los iconos se renderizan como SVG inline para máxima calidad y personalización de color.

**Alternativas consideradas**:
- Iconos PNG de servicios externos: dependencia de terceros, falta de flexibilidad visual
- Font icon sets (Weather Icons): no permiten composición dinámica

---

### 9. Franja horaria del mapa: Mañana / Tarde / Noche

**Decisión**: El modelo `DayForecast` se desglosa en tres slots horarios: `morning` (06–14h), `afternoon` (14–21h), `night` (21–06h). La barra horizontal de navegación temporal mueve el mapa entre estos tres slots del día activo. Una flecha en el extremo derecho avanza al día siguiente (máx. hoy + 3 días).

**Rationale**: Refleja el patrón de meteogalicia.gal (Mañá/Tarde/Noite) y aporta granularidad sin añadir backend. La API Open-Meteo devuelve datos horarios, con lo que agrupar en 3 slots es trivial.

---

### 10. Capa satélite: RainViewer + Eumetsat WMTS

**Decisión**: La capa satélite usa **RainViewer API** (tier gratuito, radar + satélite animado) como fuente primaria. Como alternativa/complemento para imágenes de satélite estático: tiles WMTS de **Eumetsat/Copernicus** (servicio público europeo). La capa muestra la evolución animada de nubes, precipitación o viento.

**Alternativas consideradas**:
- Windy embed: iframe, no composable con el mapa propio
- OpenWeatherMap tiles: requiere API key de pago para uso significativo

**Rationale**: RainViewer tiene CORS abierto, JSON de timestamps para animación, y tier gratuito suficiente para MVP.

---

### 11. Webcams: fuente de datos estática + extensible

**Decisión**: Lista inicial de webcams como JSON estático (`src/data/webcams.json`) con campos: `id`, `name`, `lat`, `lon`, `url`, `provider`. Extensible a futuro con una API.

**Fuentes iniciales**: DGT (carreteras), Meteogalicia (estaciones), puertos de montaña. Si no hay suficientes fuentes verificadas, se incluirán entradas mock claramente marcadas (`"mock": true`) para el MVP.

**Rationale**: Las webcams públicas tienen URLs estables. Un JSON estático es suficiente para el MVP y evita backend.

---

### 12. Avisos meteorológicos

**Decisión**: Los avisos se obtienen del proveedor a través de un método opcional `getAlerts(): Promise<Alert[]>` en la interfaz `WeatherProvider`. AEMET OpenData provee avisos Meteoalerta por CCAA y provincia — esta es la fuente objetivo. Si el proveedor no implementa este método, se usa un set de alertas mock estáticas para el MVP.

---

### 13. Estado de la aplicación

**Decisión**: Estado global mínimo con Svelte stores:
- `activeLayer`: capa activa del mapa (`general` | `wind` | `precipitation` | `temperature` | `humidity` | `storms` | `webcams` | `satellite`)
- `selectedDay`: índice 0–3 del día de previsión activo
- `selectedTimeSlot`: franja horaria activa (`morning` | `afternoon` | `night`)
- `selectedProvince`: ID de provincia seleccionada (o null)
- `selectedConcello`: ID de concello activo — null en home, poblado en vista detalle
- `searchConcello`: ID de concello para la tarjeta de búsqueda (defecto: Lugo)
- `forecastData`: caché de datos por provincia/concello + día + slot
- `alerts`: lista de `Alert[]`
- `locale`: idioma activo (`es` | `gl`)
- `concellosGeoJSONLoaded`: `boolean` — `false` hasta que el GeoJSON de concellos haya sido descargado y parseado; `Map.svelte` lo pone a `true` al completar la carga lazy. Mientras sea `false`, el mapa no activa la interactividad a nivel concello (clicks, hover, iconos individuales).

## Risks / Trade-offs

- **CORS con AEMET** → Requiere thin proxy serverless (Cloudflare Worker/Vercel Edge). Es el único componente con compute externo; mínimo mantenimiento.
- **Acceso a MeteoSIX pendiente** → Si el acceso no se concede antes del MVP, Open-Meteo cubre todos los datos necesarios.
- **Calidad de tiles meteorológicos** → Las capas raster (viento, precipitación) dependen de la calidad visual del proveedor de tiles. *(Interpolación Canvas/WebGL fuera de scope del MVP; se acepta degradación visual si los tiles de la fuente son de baja resolución.)*
- **Disponibilidad de webcams** → Las URLs de webcams pueden cambiar. El JSON estático requerirá mantenimiento manual. Entradas mock aceptables para MVP.
- **Avisos meteorológicos sin API** → Si Open-Meteo no provee alertas, se usará un mock estático hasta integrar AEMET Meteoalerta.
- **Rendimiento de MapLibre en móvil** → MapLibre con GeoJSON de concellos (~313 polígonos) y capas raster puede ser pesado en dispositivos bajos. **Riesgo alto, descubrir temprano**: el componente `Map.svelte` con GeoJSON real debe ser lo primero funcional end-to-end antes de construir el resto de la app. Mitigación: simplificar GeoJSON con mapshaper (tolerancia 0.001°), lazy load de concellos, deshabilitar anti-aliasing en MapLibre en móvil si es necesario.
- **GeoJSON de concellos** → El GeoJSON de los ~313 concellos gallegos es pesado (~5 MB sin simplificar). Mitigación: simplificar con turf.js o mapshaper; cargar a petición al acceder al detalle de concello.
- **Satélite animado** → RainViewer tier gratuito tiene límites de requests. Si se supera, degradar a imagen estática.

### 14. Accesibilidad (a11y)

**Decisión**: La accesibilidad completa (foco de teclado en MapLibre, roles ARIA en selector de capas y barra temporal, contraste de badges de alerta) queda **fuera de scope del MVP (v1)**. Se nombra aquí para que no sea un gap invisible.

**Compromisos mínimos que sí aplican en v1**: contraste de color conforme a WCAG AA en textos sobre fondos sólidos (badges, botones, cabecera); atributos `aria-label` en controles sin texto visible (flechas de navegación, botón play/pausa del satélite).

**Backlog v2**: navegación completa por teclado del mapa, anuncios de cambio de estado para lectores de pantalla, foco atrapado en panel de detalle de concello.

---

### 15. Proveedor de tiles del mapa: free-tier primero, desacoplado

**Decisión**: Los tiles base del mapa se obtienen de **OpenFreeMap** (sin API key, sin límite de requests, tiles vectoriales libres) como fuente por defecto en el MVP. La URL del tile provider se configura en un único punto (`src/config/map.ts`) — no se hardcodea en ningún componente.

**Alternativas cuando se quiera mejorar calidad visual**:
- MapTiler (tier gratuito: 100k tiles/mes, estilos personalizados)
- Stadia Maps (tier gratuito: sin límite con atribución)
- Maptiler Cloud / Esri (de pago, para producción con tráfico alto)

Cambiar de proveedor de tiles = cambiar la URL de estilo en `src/config/map.ts`. Ningún componente del mapa importa directamente la URL del tile provider.

**Rationale**: No gastar dinero en APIs de tiles en el MVP. El desacoplamiento garantiza que si un proveedor gratuito cambia sus términos se puede migrar en minutos.

---

### 16. Objetivos de rendimiento y estrategia de optimización

**Decisión**: El proyecto publicado debe cumplir estos umbrales medibles en dispositivo móvil real (Moto G4 o similar, red 4G):

| Métrica | Umbral | Contexto |
|---|---|---|
| LCP | ≤ 2.5s | El mapa con provincias debe ser visible antes de este umbral |
| CLS | < 0.1 | Sin saltos de layout al cargar capas o el panel de concello |
| FID / INP | < 200ms | Interacciones del mapa y selector de capas sin bloqueo |

**Estrategias concretas a implementar**:

1. **Placeholder SVG del mapa**: el mapa es el elemento de mayor riesgo para el LCP. Mitigación: renderizar un SVG estático de las 4 provincias gallegas mientras MapLibre inicializa. El usuario ve algo inmediatamente aunque no sea interactivo todavía.

2. **Bundle inicial ≤ 150KB gzipped**: MapLibre pesa ~250KB sin comprimir — asegurarse de no importar nada innecesario en el chunk inicial. Verificar con `vite-bundle-visualizer` antes de publicar.

3. **GeoJSON de concellos nunca en el bundle**: el archivo (~5MB sin simplificar) se carga bajo demanda con un fetch diferido y se cachea en memoria durante la sesión. Objetivo post-simplificación con mapshaper: ≤ 200KB gzipped.

4. **Lighthouse CI en Vercel**: falla el deploy si LCP > 4s en mobile. Red de seguridad para no publicar regresiones de rendimiento sin darse cuenta.

**Rationale**: Los umbrales son medibles y verificables en CI, no aspiraciones. El SVG placeholder desacopla la percepción de carga del tiempo real de inicialización de MapLibre, que es el cuello de botella más probable en móvil.

---

### 17. SEO, metadatos y compartibilidad social

**Decisión**: Brétema es una SPA sin SSR — los crawlers y previsualizadores de redes sociales ven HTML vacío por defecto. Esta decisión documenta qué se resuelve en el MVP y qué queda fuera de scope.

**En scope para el MVP:**

1. **Metadatos estáticos en `index.html`** que describen la aplicación en general:
   ```html
   <meta name="description" content="Previsión del tiempo para Galicia — mapa interactivo por provincia e concello">
   <meta property="og:title" content="Brétema — O tempo en Galicia">
   <meta property="og:description" content="Mapa interactivo do tempo en Galicia. Previsión 4 días por provincia e concello.">
   <meta property="og:image" content="/og-image.png">
   <meta property="og:type" content="website">
   <meta name="twitter:card" content="summary_large_image">
   ```

2. **Imagen OG** (`/og-image.png`, 1200×630px): captura real del mapa con datos, no un logo sobre fondo blanco. Es lo primero que ve alguien cuando comparte la URL en WhatsApp o Twitter.

3. **`<title>` dinámico reactivo a `selectedConcello`**: `Lugo — Brétema` cuando hay concello seleccionado, `Brétema` en la vista general. No requiere SSR — es un `document.title` reactivo al store.

4. **`robots.txt`** que permite indexación. **`sitemap.xml`** mínimo con la URL raíz.

**Fuera de scope del MVP (limitación conocida):**

URLs compartibles por concello con metadatos específicos (`og:title = "Tempo en Lugo hoxe"`) requieren SSR o prerendering por ruta — incompatible con la arquitectura SPA sin router (Decisión 1). Si en el futuro se quiere resolver, la migración a SvelteKit con prerendering estático por concello es el camino natural.

La indexabilidad de la SPA por Google es aceptable: no es una app de contenido donde el SEO sea crítico para el discovery.

**Rationale**: Los metadatos estáticos y la imagen OG son coste mínimo con impacto visible al compartir la URL. El `<title>` dinámico mejora el contexto de pestaña sin ningún trabajo de infraestructura.

---

### 18. Observabilidad: analítica y monitorización de errores

**Decisión**: Un proyecto publicado sin observabilidad falla en silencio. Se instrumenta con dos herramientas, priorizando privacidad y coste cero.

**Analytics: Plausible Analytics**

Plausible Analytics (cloud o self-hosted, tier gratuito) como única herramienta de analítica. No usa cookies, no requiere banner de consentimiento RGPD, no envía datos a terceros, es GDPR-compliant por diseño, y el script pesa ~1KB.

Eventos a trackear en MVP:

| Evento | Descripción |
|---|---|
| `pageview` | Automático (Plausible) |
| `layer_change` | Qué capas usa la gente — para priorizar trabajo futuro |
| `concello_search` | Búsquedas realizadas (sin el término, solo el evento) |
| `concello_detail_open` | Cuántos usuarios llegan al detalle |
| `provider_fallback` | Cuando Open-Meteo actúa como fallback de AEMET — señal de que el proxy falla |

No se trackea: términos de búsqueda concretos, provincias o concellos seleccionados, ni ningún dato que permita inferir ubicación del usuario.

**Monitorización de errores: Sentry**

Sentry Free tier (5K errores/mes) para el único componente con riesgo de fallo silencioso en producción: el proxy de AEMET. Un 429, un cambio en la estructura del JSON de AEMET, o una URL firmada expirada pueden romper la app sin aviso.

Instrumentar en MVP:
- Errores de red en todos los providers (`OpenMeteoProvider`, `AemetProvider`)
- Errores del proxy Vercel Edge Function (Vercel ya los expone en su dashboard; Sentry añade contexto de stack trace)
- Errores de parseo de GeoJSON (señal de que un asset estático está corrupto o no carga)

El SDK de Sentry para Svelte es tree-shakeable — importar solo en el entry point para no impactar el bundle.

**Observabilidad del proxy AEMET**

El proxy debe loguear en cada request: timestamp, endpoint solicitado, status de la primera request a AEMET, status de la segunda request a la URL firmada, y tiempo total. Vercel guarda logs 1 hora en el tier gratuito — suficiente para debugging reactivo.

Añadir un endpoint `/api/health` que haga una request mínima a AEMET (municipio de Lugo) y devuelva `{ status: "ok", provider: "aemet", latency_ms: N }` o `{ status: "degraded", reason: "..." }`. Permite verificar el estado del proxy sin abrir la app.

**Fuera de scope:**
Alertas automáticas (PagerDuty, email) — revisar Sentry periódicamente es suficiente para un proyecto personal. Métricas RUM en tiempo real — Lighthouse CI en el pipeline cubre esto.

**Rationale**: Plausible da datos de uso reales sin comprometer privacidad ni añadir fricción legal. Sentry cierra el gap de visibilidad del proxy AEMET, que es el único punto de fallo no recuperable automáticamente.

---

## Open Questions

- ~~¿Se desplegará en Vercel (recomendado para edge proxy AEMET), GitHub Pages u otro?~~ → **Resuelto**: Vercel (tarea 1.5; Edge Function del proxy convive en el mismo repo)
- ~~¿Se requiere soporte offline / PWA?~~ → **Resuelto**: No — explícitamente en Non-Goals
- ~~¿Las webcams deben mostrar un embed en la UI o solo abrir en nueva pestaña?~~ → **Resuelto**: nueva pestaña (spec `webcam-layer`)
- ~~¿El nivel de concellos en el mapa (iconos individuales por concello) debe activarse desde el MVP o en versión posterior?~~ → **Resuelto**: activo desde el MVP; el GeoJSON de concellos se carga lazy al arrancar la vista del mapa (no en bundle inicial)
- ~~¿Arquitectura de la vista detalle de concello: panel sobre el mapa (SPA sin router) o ruta separada (SvelteKit)?~~ → **Resuelto**: **panel reactivo sobre el mapa** (SPA sin router). El panel es UI reactiva al store `selectedConcello`: visible cuando `!== null`, oculto cuando `null`. En móvil: slide-up 100% viewport; en desktop: drawer lateral. URLs compartibles por concello no son un goal del MVP. Stack: Vite + Svelte puro, sin SvelteKit.
