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
  getAlerts?(): Promise<Alert[]>
}
```

**Proveedor inicial**: Open-Meteo (libre, sin API key). Siguientes: AEMET OpenData, MeteoSIX.

**Rationale**: Desacopla completamente la fuente de datos de la presentación. Cambiar de proveedor = implementar la interfaz y cambiar una línea en la config.

---

### 7. Datos geoespaciales de Galicia

**Decisión**: GeoJSON de provincias gallegas (A Coruña, Lugo, Ourense, Pontevedra) obtenido de fuentes públicas (IGN, Natural Earth). El GeoJSON se sirve como asset estático. GeoJSON de concellos (~313) se carga lazy al entrar en la vista de detalle.

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

## Risks / Trade-offs

- **CORS con AEMET** → Requiere thin proxy serverless (Cloudflare Worker/Vercel Edge). Es el único componente con compute externo; mínimo mantenimiento.
- **Acceso a MeteoSIX pendiente** → Si el acceso no se concede antes del MVP, Open-Meteo cubre todos los datos necesarios.
- **Calidad de tiles meteorológicos** → Las capas raster (viento, precipitación) dependen de la calidad visual del proveedor de tiles. Fallback: interpolación de datos puntuales en Canvas/WebGL.
- **Disponibilidad de webcams** → Las URLs de webcams pueden cambiar. El JSON estático requerirá mantenimiento manual. Entradas mock aceptables para MVP.
- **Avisos meteorológicos sin API** → Si Open-Meteo no provee alertas, se usará un mock estático hasta integrar AEMET Meteoalerta.
- **Rendimiento en móvil** → MapLibre con datos vectoriales puede ser pesado en dispositivos bajos. Mitigación: lazy load de capas, simplificación del GeoJSON.
- **GeoJSON de concellos** → El GeoJSON de los ~313 concellos gallegos es pesado (~5 MB sin simplificar). Mitigación: simplificar con turf.js o mapshaper; cargar a petición al acceder al detalle de concello.
- **Satélite animado** → RainViewer tier gratuito tiene límites de requests. Si se supera, degradar a imagen estática.

## Open Questions

- ¿Se desplegará en Vercel (recomendado para edge proxy AEMET), GitHub Pages u otro?
- ¿Se requiere soporte offline / PWA?
- ¿Las webcams deben mostrar un embed en la UI o solo abrir en nueva pestaña?
- ¿El nivel de concellos en el mapa (iconos individuales por concello) debe activarse desde el MVP o en versión posterior?
- ¿Hay preferencia sobre si el detalle de concello es una ruta/página separada o un panel sobre el home?
