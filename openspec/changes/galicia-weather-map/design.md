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
| 2 | **MeteoSIX (MeteoGalicia)** | Galicia (concellos) | Máxima precisión local, `cloud_area_fraction` directo, idioma gallego nativo | API key obtenida ✅ | Necesita proxy (para proteger clave) |
| 3 | **Open-Meteo** | Mundial | Datos horarios sin API key | No requiere | Sí (CORS abierto) |

AEMET es la fuente oficial española con avisos meteoalerta por CC.AA. y municipio. MeteoSIX v5 (MeteoGalicia) es la fuente de referencia para Galicia con cobertura hasta concello, datos horarios WRF, y soporte nativo de gallego (`lang=gl`). MeteoSIX también proporciona `cloud_area_fraction` como porcentaje directo, eliminando la limitación de AEMET. Open-Meteo actúa como fallback funcional global.

**CORS para AEMET**: AEMET OpenData usa CORS restrictivo. Se añadirá un thin proxy (Cloudflare Worker o Vercel Edge Function ~10 líneas) que reenvía la request añadiendo la API key. El proxy es el único componente serverless del proyecto.

**CORS para MeteoSIX**: La API v5 requiere `API_KEY` en la URL. La clave no debe exponerse en el cliente. Se añadirá un proxy análogo al de AEMET en `/api/meteosix/` (Vercel Edge Function). Ver Decision 21 para arquitectura del adaptador MeteoSIX.

**Tarea de investigación**: ✅ Completada. Ver `docs/api-research.md` para la documentación completa de AEMET y MeteoSIX v5.

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

### 19. Licencias de terceros y atribución obligatoria

**Decisión**: Un proyecto publicado que usa fuentes de datos y tiles de terceros tiene obligaciones legales de atribución. Esta decisión documenta qué requiere cada dependencia y cómo se implementa en la UI.

**Tabla de dependencias y condiciones:**

| Recurso | Proveedor | Licencia | Atribución obligatoria | Restricciones |
|---|---|---|---|---|
| Tiles mapa base | OpenFreeMap | ODbL | Sí, en el mapa | Solo uso no comercial sin acuerdo |
| Datos OSM subyacentes | OpenStreetMap | ODbL | `© OpenStreetMap contributors` | Obligatorio en cualquier derivado |
| Radar / satélite animado | RainViewer | Propietaria (free tier) | Sí, en la capa activa | No redistribuir tiles directamente |
| Previsión meteorológica | Open-Meteo | CC BY 4.0 | Sí, visible en la UI | Mencionar fuente en datos mostrados |
| Previsión meteorológica | AEMET OpenData | Reutilización con condiciones | Sí, `Agencia Estatal de Meteorología` | **No uso comercial sin autorización expresa** |
| GeoJSON provincias | IGN España | Reutilización libre | Sí, `© IGN España` | Mantener atribución en derivados |
| GeoJSON concellos | IGN / fuente pública | Pendiente confirmar (tarea 4.3) | Documentar al obtener el archivo | — |

**Implementación en la UI:**

Componente `Attribution.svelte` fijo en la esquina inferior derecha del mapa (estándar MapLibre). Contenido mínimo siempre visible:

```
© OpenStreetMap contributors · OpenFreeMap · AEMET · Open-Meteo
```

Cuando la capa satélite está activa, añadir dinámicamente `· RainViewer`. La atribución es reactiva al store `activeLayer`.

**Licencia del proyecto:**

MIT para el código fuente. Los datos meteorológicos y GeoJSON no forman parte del código y tienen sus propias licencias. `LICENSE` en la raíz cubre solo el código. El `README.md` debe incluir una sección _Fuentes de datos y atribución_ con la tabla anterior y URLs de licencia.

**Límite de uso comercial:**

AEMET OpenData prohíbe el uso comercial sin autorización expresa. Cualquier modelo de monetización futuro (donaciones con contraprestación, publicidad, API de pago) requiere revisar los términos de AEMET antes de activarlo.

**Pendiente de verificar antes de publicar:**
- Confirmar licencia exacta del GeoJSON de concellos al obtenerlo en tarea 4.3
- Leer términos actualizados de RainViewer free tier
- Verificar que OpenFreeMap permite proyectos publicados sin acuerdo comercial en su tier gratuito actual

**Rationale**: La atribución correcta es tanto una obligación legal como una señal de transparencia. Centralizar las condiciones de licencia en esta decisión evita que sean un gap invisible al publicar.

---

### 20. Privacidad de usuarios y cumplimiento RGPD

**Decisión**: Brétema es accesible desde la UE y está sujeta al RGPD. Esta decisión documenta qué datos se tratan y cómo, y establece que no se necesita banner de cookies con la configuración actual.

**Inventario de datos tratados:**

| Dato | Origen | Propósito | Se almacena | Se envía a terceros |
|---|---|---|---|---|
| IP del usuario | Vercel | Logs de servidor | Sí, logs Vercel (automático) | No |
| `navigator.language` | Browser API | Detectar idioma | No — solo en memoria | No |
| Concello/provincia seleccionado | Interacción usuario | Cargar previsión | No | No — solo coordenadas a Open-Meteo/AEMET |
| Eventos de uso anónimos | Plausible | Analytics agregada | Sí, en Plausible | Plausible (sin datos personales) |
| Errores y stack traces | Sentry | Monitorización | Sí, en Sentry | Sentry |

**Por qué no se necesita banner de cookies:**

Plausible no usa cookies ni fingerprinting — es RGPD-compliant sin consentimiento. Sentry en modo básico tampoco usa cookies. Con esta configuración, Brétema no necesita banner de cookies ni CMP (Consent Management Platform).

Lo que invalidaría esta decisión: cualquier integración futura con Google Analytics, Meta Pixel, o cualquier herramienta que use cookies de terceros o fingerprinting.

**Política de privacidad:**

Primer publicación desde la UE requiere una página `/privacidad` (o modal desde el footer) con el contenido mínimo:
- Qué datos se recogen y con qué finalidad
- Que no se usan cookies de seguimiento
- Que los datos de analytics son agregados y anónimos (Plausible)
- Que los errores se registran de forma anónima (Sentry)
- Datos de contacto del responsable del tratamiento (email)
- Que los datos meteorológicos consultados no se almacenan ni asocian al usuario

El texto debe estar disponible en español y gallego — siendo una app con i18n, la política de privacidad es contenido UI y sigue el mismo estándar.

**Sentry — sanitización de datos personales:**

Configurar `beforeSend` para evitar que Sentry capture datos que puedan identificar al usuario:

```typescript
Sentry.init({
  beforeSend(event) {
    if (event.user) delete event.user.ip_address
    return event
  }
})
```

**Responsable del tratamiento:**

El desarrollador es el responsable del tratamiento a efectos del RGPD. El email de contacto para solicitudes ARCO debe estar visible en la política de privacidad. En la práctica, dado que no se almacenan datos personales, estas solicitudes tendrán respuesta trivial.

**Datos de menores:** Brétema no recoge datos de usuarios ni tiene registro — no aplican obligaciones adicionales.

**Fuera de scope:** DPA formal con Vercel y Sentry — para un proyecto personal sin usuarios registrados, el tier gratuito de ambos incluye términos suficientes. Revisar si Brétema escala o incorpora registro de usuarios.

**Rationale**: La ausencia de banner de cookies es una ventaja de UX significativa — se mantiene eligiendo deliberadamente herramientas RGPD-compliant por diseño. La política de privacidad es una obligación legal, no opcional.

---

### 21. Sistema de diseño visual

**Decisión**: Brétema usa verde atlántico como color corporativo — no el azul institucional de apps de tiempo genéricas. El siguiente documento de diseño es la fuente de verdad para todos los tokens visuales, componentes y reglas de layout.

```yaml
name: Brétema
version: alpha
description: >
  Sistema de diseño para Brétema, aplicación web de visualización meteorológica
  para Galicia. Verde atlántico como color corporativo. Denso e informativo,
  mobile-first, sin backend propio.

colors:
  green-900: "#1A2E24"
  green-800: "#2D4A3E"
  green-700: "#3D5A3E"
  green-600: "#4A7060"
  green-100: "#9EC4B0"
  green-50:  "#F0F5F2"

  stone-100: "#F5F3EF"
  stone-50:  "#E8E5DF"

  atlantic:  "#B8D4E8"

  amber:     "#C4862A"
  blue:      "#185FA5"

  alert-yellow:      "#F9C74F"
  alert-yellow-bg:   "#FFF8E1"
  alert-yellow-text: "#7A5800"
  alert-orange:      "#F4845F"
  alert-orange-bg:   "#FFF0EB"
  alert-orange-text: "#6B2500"
  alert-red:         "#E63946"
  alert-red-bg:      "#FFF0F0"
  alert-red-text:    "#FFFFFF"

  text-primary:   "#1A1A1A"
  text-secondary: "#5A5A5A"
  text-tertiary:  "#9A9A9A"

  surface:        "#FFFFFF"
  surface-raised: "#F5F3EF"

typography:
  app-name:
    fontFamily: system-ui, sans-serif
    fontSize: 15px
    fontWeight: 500
    letterSpacing: 0.02em

  heading:
    fontFamily: system-ui, sans-serif
    fontSize: 13px
    fontWeight: 500

  body:
    fontFamily: system-ui, sans-serif
    fontSize: 12px
    fontWeight: 400

  label:
    fontFamily: system-ui, sans-serif
    fontSize: 11px
    fontWeight: 400

  caption:
    fontFamily: system-ui, sans-serif
    fontSize: 10px
    fontWeight: 400

  temperature:
    fontFamily: system-ui, sans-serif
    fontSize: 11px
    fontWeight: 500

  attribution:
    fontFamily: system-ui, sans-serif
    fontSize: 10px
    fontWeight: 400

rounded:
  sm: 3px
  md: 4px
  lg: 8px
  xl: 12px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px

components:
  header:
    backgroundColor: "{colors.green-800}"
    textColor: "#E8F0EC"
    height: 44px
    borderBottom: "0.5px solid {colors.green-600}"

  layer-btn:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "4px 10px"
    borderColor: "{colors.stone-50}"

  layer-btn-active:
    backgroundColor: "{colors.green-800}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "4px 10px"

  lang-btn:
    backgroundColor: "transparent"
    textColor: "{colors.green-100}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
    borderColor: "{colors.green-600}"

  lang-btn-active:
    backgroundColor: "transparent"
    textColor: "#E8F0EC"
    rounded: "{rounded.full}"
    padding: "2px 8px"
    borderColor: "{colors.green-100}"

  time-slot:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    padding: "5px 8px"

  time-slot-active:
    backgroundColor: "{colors.green-800}"
    textColor: "#FFFFFF"
    fontWeight: 500

  day-btn:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    padding: "3px 7px"

  day-btn-active:
    backgroundColor: "{colors.green-700}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "3px 7px"

  alert-chip-yellow:
    backgroundColor: "{colors.alert-yellow}"
    textColor: "{colors.alert-yellow-text}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"

  alert-chip-orange:
    backgroundColor: "{colors.alert-orange}"
    textColor: "{colors.alert-orange-text}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"

  alert-chip-red:
    backgroundColor: "{colors.alert-red}"
    textColor: "{colors.alert-red-text}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"

  concello-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "0"
    borderColor: "{colors.stone-50}"

  concello-day-today:
    backgroundColor: "{colors.green-50}"

  stat-card:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.lg}"
    padding: "6px 8px"

  province-icon:
    backgroundColor: "rgba(255,255,255,0.92)"
    size: 36px
    rounded: "{rounded.full}"

  map-date-label:
    backgroundColor: "rgba(30,50,40,0.75)"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "3px 8px"

  search-input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "7px 10px"
    height: 36px
    borderColor: "{colors.stone-50}"
```

#### Overview

Brétema es una aplicación de tiempo para Galicia. El nombre es la palabra gallega para
niebla atlántica — densa, húmeda, cercana. El diseño refleja esa identidad: informativo
y denso como MeteoGalicia, pero con una identidad visual propia arraigada en el
territorio, no en la institución.

El color corporativo es el **verde atlántico** (`green-800: #2D4A3E`), no el azul
genérico de las apps de tiempo. Evoca el territorio: bosques de la costa, valles del
Miño, montes de Lugo. Cada decisión de color parte de esta raíz.

El tono visual es **denso e informativo** — todo visible de un vistazo, sin sacrificar
limpieza. La referencia principal es MeteoGalicia en estructura de información, y
Linear/Vercel en ejecución visual. Mobile-first absoluto: el diseño arranca en 390px
y se expande hacia desktop.

#### Colors

La paleta tiene tres familias:

**Verde atlántico** — color corporativo. `green-800` es el tono base para cabecera,
botones activos y elementos de navegación. `green-700` para hover. `green-100` para
texto secundario sobre fondo verde. `green-50` para superficies sutilmente tintadas
(día actual en la tarjeta de concello).

**Stone** — fondo general de la app. No blanco puro sino `stone-100: #F5F3EF`, un
blanco cálido con ligero tinte arena. Evita la frialdad del blanco puro y armoniza con
el verde atlántico. `stone-50` para bordes sobre fondos stone.

**Semánticos** — `amber (#C4862A)` para temperatura máxima, `blue (#185FA5)` para
temperatura mínima y porcentaje de lluvia. Estos dos colores son los únicos que
aparecen en los datos meteorológicos directamente — el usuario aprende su semántica
rápidamente por repetición.

**Alertas** — jerarquía estricta de tres niveles: amarillo → naranja → rojo. Los chips
usan fondo claro + texto oscuro del mismo tono para amarillo y naranja, y fondo rojo +
texto blanco para rojo. Las `*-bg` colors se usan para el fondo de la barra de avisos.

**Océano atlántico** — `atlantic: #B8D4E8` es el color del mar en el mapa.

#### Typography

Sin fuentes externas — exclusivamente `system-ui, sans-serif`. Cero penalización de
LCP por carga de fuentes. Dos pesos únicamente: **400 regular** y **500 medium**. Nunca
600 ni 700 — pesan demasiado contra el fondo stone y el verde atlántico.

Tamaño mínimo absoluto: **10px**. En móvil (≤390px) los tamaños de 10px y 11px suben
a 12px para legibilidad táctil.

Las temperaturas usan siempre `temperature` (11px/500): máxima en `amber`, mínima en
`blue`.

#### Layout

**Desktop:** Grid de dos columnas — mapa (flex: 1) + sidebar (280px fijo). El sidebar
reduce a 240px en tablet (640–1024px).

**Mobile (≤390px):** Columna única. Orden vertical: cabecera → avisos → selector de
capas → mapa → barra temporal → buscador → tarjeta de concello. El panel de provincia
es un drawer slide-up desde abajo (100% width, 60% viewport height). La barra de capas
permite scroll horizontal sin wrap.

Spacing base: 4px. Los gaps entre componentes usan múltiplos de 4: 4, 8, 12, 16, 24px.

#### Elevation & Depth

Brétema es una aplicación plana — sin sombras decorativas. La profundidad se consigue
exclusivamente con:

- Diferencia de fondo: `surface (#FFFFFF)` sobre `surface-raised (#F5F3EF)`
- Bordes `0.5px` en `stone-50` para delimitar cards
- Opacidad en elementos sobre el mapa

La única excepción permitida es el focus ring de inputs:
`box-shadow: 0 0 0 2px {colors.green-100}`.

#### Shapes

- `sm (3px)`: chips de alerta, etiquetas de fecha sobre el mapa
- `md (4px)`: botones de capa, botones de franja temporal, botones de día
- `lg (8px)`: inputs de búsqueda, stat cards del panel de provincia
- `xl (12px)`: cards de concello, panel de provincia
- `full`: selector de idioma (pills), iconos de provincia sobre el mapa

Los separadores entre slots temporales NO tienen border-radius — son bordes
compartidos entre elementos adyacentes.

#### Components

**Header** — 44px fijo. Verde atlántico `green-800`. Logotipo: punto circular `#7EB89A`
(8px) + texto "Brétema" en `#E8F0EC` (15px/500, tracking 0.02em). Selector de idioma
GL/ES a la derecha — activo: borde `#7EB89A`, texto `#E8F0EC`; inactivo: texto
`green-100`, sin borde visible.

**AlertsBanner** — Altura variable. Fondo `alert-*-bg` según el nivel de aviso más
grave. Sin avisos: fondo `surface-raised`, texto "Sen avisos activos" en terciario. La
barra nunca desaparece (evita CLS).

**LayerSelector** — 8 botones en fila. En móvil: `overflow-x: auto`, sin scrollbar
visible. Orden fijo: Xeral · Vento · Temperatura · Humidade · Precipitación ·
Tormentas · Webcams · Satélite.

**TimeBar** — Fila única: flecha ‹ · slots Mañá/Tarde/Noite · días · flecha ›. Los
slots comparten bordes laterales (no gap). Flecha izquierda deshabilitada en día 0 +
slot Mañá. Flecha derecha deshabilitada en día +3 + slot Noite.

**ConcellosCard** — Card con cabecera y grid de 4 columnas. Columna del día actual con
fondo `concello-day-today`. Punto de alerta (6px) junto al nombre del día si hay aviso.

**ProvinceReport** — Grid 2×2 de `stat-card`. Etiqueta 10px/secundario, valor
14px/500/primario. Sin iconos decorativos.

#### Do's and Don'ts

**Do:**
- Usar `green-800` como único color corporativo activo
- Mostrar siempre la barra de avisos aunque esté vacía
- Actualizar la atribución del mapa reactivamente al cambiar de capa
- Usar `amber` para temp máx y `blue` para temp mín en todos los contextos
- Mantener el orden fijo del LayerSelector

**Don't:**
- No usar sombras decorativas — solo bordes 0.5px para delimitar
- No hardcodear ningún string visible — todo pasa por los archivos i18n
- No usar pesos 600 o 700 en ningún texto
- No añadir border-radius a separadores entre elementos adyacentes
- No usar el azul `atlantic` fuera del contexto del mapa
- No cargar fuentes externas — solo system-ui

---

### 22. Adaptador MeteoSIX v5 — arquitectura y field mapping

**Contexto**: MeteoSIX v5 (MeteoGalicia) tiene API key confirmada y documentación oficial completa (`docs/MeteosixApi/API_MeteoSIX_v5_gl.pdf`). Es el proveedor post-MVP prioritario por encima de AEMET para el contexto gallego.

**Decisión**: Implementar `MeteoSIXProvider` en `src/providers/meteosix.ts` detrás de un Vercel Edge Function proxy en `/api/meteosix/` (protege la API_KEY). El adaptador traduce la respuesta v5 GeoJSON al modelo `DayForecast` interno.

**Arquitectura del proxy** (`/api/meteosix.ts`):
```typescript
export async function GET(req: Request) {
  const url = new URL(req.url)
  const path = url.searchParams.get('path') ?? '/getNumericForecastInfo'
  const params = url.searchParams
  params.delete('path')
  params.set('API_KEY', process.env.METEOSIX_API_KEY!)
  const upstream = `https://servizos.meteogalicia.gal/apiv5${path}?${params.toString()}`
  const res = await fetch(upstream)
  const data = await res.json()
  return Response.json(data)
}
```
> Un único forward — no hay doble-redirect. Más simple que el proxy AEMET.

**Variables a solicitar por defecto**:
```
sky_state,temperature,precipitation_amount,wind,relative_humidity,cloud_area_fraction
```

**Field mapping** `MeteoSIXProvider → DayForecast`:

| Campo DayForecast | Variable MeteoSIX v5 | Transformación |
|---|---|---|
| `weatherCode` | `sky_state` (hourly) | `METEOSIX_SKY_STATE_MAP[value]` → WMO-like code |
| `temperature.min` | `temperature` | `Math.min(...slotHours)` |
| `temperature.max` | `temperature` | `Math.max(...slotHours)` |
| `temperature.current` | `temperature` | Hora más cercana al instante actual |
| `precipitation.value` | `precipitation_amount` | Suma del slot (l/m²) |
| `precipitationProbability` | *(no directo)* | Heurística por `sky_state`: RAIN/SHOWERS→80%, DRIZZLE→50%, WEAK_RAIN→40%, PARTLY_CLOUDY→15%, SUNNY→5% |
| `wind.speed` | `wind.moduleValue` | Media del slot (km/h) |
| `wind.direction` | `wind.directionValue` | Media del slot (grados) |
| `humidity` | `relative_humidity` | Media del slot (%) |
| `cloudCover` | `cloud_area_fraction` | Media del slot (%) — ✅ sin gap |

**Slot mapping** (datos horarios → morning/afternoon/night):
- `morning`: horas 06–12 en horario local de Galicia
- `afternoon`: horas 12–18 en horario local de Galicia
- `night`: horas 18–06 en horario local de Galicia (día siguiente)

> ⚠️ **Offset dinámico**: Galicia usa CET (UTC+1) en invierno y CEST (UTC+2) en verano. MeteoSIX v5 devuelve timestamps con offset explícito (`+01:00` o `+02:00`). El parsing **debe usar el offset incluido en cada timestamp** — nunca asumir UTC+1 fijo. Usar `new Date(isoString)` en JS/TS (que respeta el offset) y comparar horas locales mediante `getHours()` sobre un objeto Date con timezone de Europa/Madrid, o equivalente. Si se asume UTC+1 fijo, los slots se desplazarán una hora en horario de verano (junio–octubre, que es precisamente el período de mayor uso).

**Idioma**: `lang=gl` en todas las peticiones → textos devueltos en gallego nativo. Ventaja única frente a AEMET.

**Tabla de sky_state → WMO code**: definir en `src/providers/meteosix-codes.ts` (20 entradas, ver `docs/api-research.md` sección 3.5).

**Error handling**:
- Excepción 216 (punto fuera de cobertura) → fallback a Open-Meteo sin error visible al usuario
- Excepción 005/006 (API key) → log en Sentry, fallback a Open-Meteo
- Red timeout → fallback automático

**Rationale**: MeteoSIX v5 supera a Open-Meteo para Galicia: mayor resolución espacial (malla WRF 1km), datos en gallego nativo, `cloud_area_fraction` directo (sin la limitación de AEMET), y un proxy más simple que AEMET (sin doble-redirect). La API key obtenida convierte este adaptador en post-MVP inmediato una vez el MVP Open-Meteo esté estabilizado.

**Open Questions resueltas**:
- ~~¿API key de MeteoSIX disponible?~~ → **Resuelto**: obtenida ✅
- ~~¿CORS abierto o necesita proxy?~~ → **Decisión**: usar proxy por seguridad (no exponer API_KEY en cliente)

---

## Open Questions

- ~~¿Se desplegará en Vercel (recomendado para edge proxy AEMET), GitHub Pages u otro?~~ → **Resuelto**: Vercel (tarea 1.5; Edge Function del proxy convive en el mismo repo)
- ~~¿Se requiere soporte offline / PWA?~~ → **Resuelto**: No — explícitamente en Non-Goals
- ~~¿Las webcams deben mostrar un embed en la UI o solo abrir en nueva pestaña?~~ → **Resuelto**: nueva pestaña (spec `webcam-layer`)
- ~~¿El nivel de concellos en el mapa (iconos individuales por concello) debe activarse desde el MVP o en versión posterior?~~ → **Resuelto**: activo desde el MVP; el GeoJSON de concellos se carga lazy al arrancar la vista del mapa (no en bundle inicial)
- ~~¿Arquitectura de la vista detalle de concello: panel sobre el mapa (SPA sin router) o ruta separada (SvelteKit)?~~ → **Resuelto**: **panel reactivo sobre el mapa** (SPA sin router). El panel es UI reactiva al store `selectedConcello`: visible cuando `!== null`, oculto cuando `null`. En móvil: slide-up 100% viewport; en desktop: drawer lateral. URLs compartibles por concello no son un goal del MVP. Stack: Vite + Svelte puro, sin SvelteKit.
