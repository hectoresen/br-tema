# API Research — Brétema

Documentación de investigación de APIs para la implementación del bloque 1.  
Fecha: 2026-04-26

---

## 1. AEMET OpenData

### Endpoints relevantes

| Propósito | Endpoint |
|---|---|
| Predicción diaria por municipio (7 días) | `GET /api/prediccion/especifica/municipio/diaria/{municipio}` |
| Predicción horaria por municipio (48h) | `GET /api/prediccion/especifica/municipio/horaria/{municipio}` |
| Avisos Meteoalerta (último elaborado) | `GET /api/avisos_cap/ultimoelaborado/area/{area}` |
| Lista completa de municipios | `GET /api/maestro/municipios` |
| Info de municipio específico | `GET /api/maestro/municipio/{municipio}` |

**Base URL**: `https://opendata.aemet.es/opendata`  
**Auth**: API key en header `api_key: <tu_key>` (registro gratuito en opendata.aemet.es)

### ⚠️ SORPRESA 1: PATRÓN DE DOBLE REDIRECCIÓN

**Esta es la peculiaridad más importante de AEMET y diferencia todo el diseño del adaptador.**

La respuesta 200 de CUALQUIER endpoint de datos **no devuelve los datos directamente**. Devuelve un JSON con una URL a seguir:

```json
{
  "descripcion": "exito",
  "estado": 200,
  "datos": "https://opendata.aemet.es/opendata/sh/abc123xyz",
  "metadatos": "https://opendata.aemet.es/opendata/sh/meta123xyz"
}
```

El campo `datos` es una URL firmada con TTL corto (expira en minutos). Hay que hacer una segunda request GET a esa URL para obtener el JSON real con la predicción.

**Consecuencias para el proxy**:
- El proxy de Vercel Edge Function necesita hacer **dos requests** a AEMET, no una:  
  1. Fetch → AEMET endpoint + api_key → obtiene URL de datos  
  2. Fetch → URL de datos → obtiene JSON real  
- La API key solo se necesita en la primera request (la URL firmada ya la incluye implícitamente)
- El proxy no puede ser un simple forward; tiene que implementar el patrón redirect-follow

**Implementación sugerida del proxy** (`/api/aemet/[...path]/route.ts`):
```typescript
export async function GET(req: Request) {
  const url = new URL(req.url)
  const aemetPath = url.searchParams.get('path')
  // 1ª request: obtener URL de datos
  const r1 = await fetch(`https://opendata.aemet.es/opendata${aemetPath}`, {
    headers: { 'api_key': process.env.AEMET_API_KEY! }
  })
  const { datos } = await r1.json()
  // 2ª request: obtener datos reales
  const r2 = await fetch(datos)
  const data = await r2.json()
  return Response.json(data)
}
```

### ⚠️ SORPRESA 2: ESTRUCTURA DE DATOS POR PERIODOS (no por franjas)

El JSON de predicción diaria (`/diaria`) **no** devuelve valores únicos por día. Cada variable meteorológica es un array de objetos `{value, periodo}` donde `periodo` es una cadena que indica la ventana temporal dentro del día:

**Periodos posibles** (varían según la variable y el día de alcance):
- `"00-24"` → todo el día (un único valor)  
- `"00-12"` + `"12-24"` → dos valores (mañana / tarde)  
- `"06-12"` + `"12-18"` + `"18-24"` → tres valores de 6h  
- `"00-06"` + `"06-12"` + `"12-18"` + `"18-24"` → cuatro valores de 6h  

**Los periodos disponibles varían según el día de alcance**:
- D+0 (hoy), D+1 (mañana): periodos de 6h o 12h
- D+2 en adelante: solo 24h o 12h

Esto significa que **el mapping a nuestros slots (morning/afternoon/night) requiere interpolación y lógica de fallback** dependiendo de qué periodos estén disponibles para cada día.

**Estructura completa de `prediccion.dia[]`:**

```json
[
  {
    "fecha": "2026-04-26T00:00:00",
    "orto": "07:24",
    "ocaso": "21:11",
    "estadoCielo": [
      {"value": "13", "periodo": "00-06", "descripcion": "Intervalos nubosos"},
      {"value": "14n", "periodo": "06-12", "descripcion": "Nuboso noche"},
      {"value": "25", "periodo": "12-24", "descripcion": "Muy nuboso con lluvia"}
    ],
    "probPrecipitacion": [
      {"value": "5",  "periodo": "00-12"},
      {"value": "70", "periodo": "12-24"}
    ],
    "probNieve": [
      {"value": "0", "periodo": "00-12"},
      {"value": "0", "periodo": "12-24"}
    ],
    "probTormenta": [
      {"value": "10", "periodo": "12-24"}
    ],
    "nieve": [],
    "cotaNieveProv": [
      {"value": "", "periodo": "12-24"}
    ],
    "temperatura": { "maxima": 18, "minima": 11 },
    "sensTermica":  { "maxima": 17, "minima": 10 },
    "humedadRelativa": { "maxima": 95, "minima": 60 },
    "viento": [
      {"direccion": "SO", "velocidad": 30, "periodo": "00-12"},
      {"direccion": "NO", "velocidad": 20, "periodo": "12-24"}
    ],
    "rachaMax": [
      {"value": "55", "periodo": "00-12"}
    ],
    "uvMax": 4
  }
]
```

### ⚠️ SORPRESA 3: `estadoCielo` usa códigos propios de AEMET, no WMO

Los valores de `estadoCielo` son **códigos AEMET** (enteros o enteros+"n" para noche). **No son códigos WMO**. La "n" indica variante nocturna del icono.

| Código | Descripción |
|---|---|
| 11 / 11n | Despejado |
| 12 / 12n | Poco nuboso |
| 13 / 13n | Intervalos nubosos |
| 14 / 14n | Nuboso |
| 15 | Muy nuboso |
| 16 | Cubierto |
| 17 / 17n | Nubes altas |
| 23 / 23n | Intervalos nubosos con lluvia |
| 24 / 24n | Nuboso con lluvia |
| 25 | Muy nuboso con lluvia |
| 26 | Cubierto con lluvia |
| 33 / 33n | Intervalos nubosos con nieve |
| 34 / 34n | Nuboso con nieve |
| 35 | Muy nuboso con nieve |
| 36 | Cubierto con nieve |
| 43 / 43n | Intervalos nubosos con lluvia escasa |
| 44 / 44n | Nuboso con lluvia escasa |
| 45 | Muy nuboso con lluvia escasa |
| 46 | Cubierto con lluvia escasa |
| 51 / 51n | Intervalos nubosos con tormenta |
| 52 / 52n | Nuboso con tormenta |
| 53 | Muy nuboso con tormenta |
| 54 | Cubierto con tormenta |
| 61 / 61n | Intervalos nubosos con tormenta y lluvia escasa |
| 62 / 62n | Nuboso con tormenta y lluvia escasa |
| 63 | Muy nuboso con tormenta y lluvia escasa |
| 64 | Cubierto con tormenta y lluvia escasa |
| 71 / 71n | Intervalos nubosos con nieve escasa |
| 72 / 72n | Nuboso con nieve escasa |
| 73 | Muy nuboso con nieve escasa |
| 74 | Cubierto con nieve escasa |
| 81 | Niebla |
| 82 | Bruma |
| 83 | Calima |

**Mapping a `weatherCode` de nuestro `DayForecast`**: El adaptador AEMET debe transformar este código a un código WMO equivalente (o a un código semántico interno). Se recomienda definir `src/providers/aemet-codes.ts` con la tabla de mapping y usarla en `AemetProvider`.

### ⚠️ SORPRESA 4: No hay `cloudCover` en %

AEMET **no expone un porcentaje de cobertura nubosa**. Solo hay `estadoCielo` (código categórico). El adaptador AEMET no puede rellenar `cloudCover: number` de `DayForecast` directamente.

**Solución**: El campo `cloudCover` en `DayForecast` debe ser `number | undefined`. Cuando el proveedor es AEMET, `cloudCover` = undefined y el componente `WeatherIcon` usa `weatherCode` AEMET como fuente primaria en lugar de la lógica compuesta.

### ⚠️ SORPRESA 5: Avisos en formato CAP (XML en ZIP)

El endpoint `/api/avisos_cap/ultimoelaborado/area/71` devuelve (siguiendo el patrón doble-redirect) una URL que apunta a un archivo **CAP (Common Alerting Protocol) en formato XML**, posiblemente comprimido en ZIP.

- No es JSON
- Hay que parsear XML o ZIP+XML en el proxy
- Para el MVP, si la complejidad es alta, usar el mock de alertas y documentar como trabajo futuro en la tarea 7.3

**Código de área para Galicia**: `71`

### Identificadores de municipio (INE codes)

AEMET usa los códigos del **INE (Instituto Nacional de Estadística)**, formato 5 dígitos: `PPMMM` donde `PP` = código de provincia (2 dígitos) y `MMM` = código de municipio (3 dígitos).

**Provincias gallegas**:
| Provincia | Código AEMET/INE |
|---|---|
| A Coruña | `15` (prefijo) |
| Lugo | `27` (prefijo) |
| Ourense | `32` (prefijo) |
| Pontevedra | `36` (prefijo) |

**Ejemplos de municipios clave**:
| Municipio | Código INE |
|---|---|
| Lugo (capital) | `27028` |
| Santiago de Compostela | `15078` |
| A Coruña | `15030` |
| Ourense | `32054` |
| Pontevedra | `36038` |
| Vigo | `36057` |

Para obtener la lista completa: `GET /api/maestro/municipios` → seguir doble-redirect → array de `{id, nombre, ...}`.

### Límites de uso

- Tier gratuito con API key: sin límites documentados oficialmente
- Rate limiting: responde 429 si se excede. Recomendado: máximo ~1 request/seg
- TTL de la URL firmada en `datos`: ~5-10 minutos (no reutilizable)

---

## 2. Open-Meteo (proveedor MVP)

**URL base**: `https://api.open-meteo.com/v1`  
**Auth**: Sin API key (tier gratuito para uso no comercial)  
**CORS**: Abierto ✅  
**Alcance**: 7 días + 3 días nowcast  

### Endpoint principal

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=43.01
  &longitude=-7.56
  &hourly=temperature_2m,weathercode,precipitation,precipitation_probability,
          cloudcover,windspeed_10m,winddirection_10m,relativehumidity_2m
  &daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,
         precipitation_probability_max,windspeed_10m_max,winddirection_10m_dominant
  &timezone=Europe/Madrid
  &forecast_days=7
```

### Estructura de respuesta

```json
{
  "latitude": 43.0,
  "longitude": -7.56,
  "timezone": "Europe/Madrid",
  "hourly": {
    "time": ["2026-04-26T00:00", "2026-04-26T01:00", ...],
    "temperature_2m": [12.1, 11.8, ...],
    "weathercode": [3, 3, 61, ...],
    "precipitation": [0.0, 0.0, 0.8, ...],
    "precipitation_probability": [5, 5, 60, ...],
    "cloudcover": [85, 90, 95, ...],
    "windspeed_10m": [15.2, 16.1, ...],
    "winddirection_10m": [220, 225, ...]
  },
  "daily": {
    "time": ["2026-04-26", "2026-04-27", ...],
    "temperature_2m_max": [18.2, 16.5, ...],
    "temperature_2m_min": [11.0, 10.2, ...],
    "weathercode": [61, 3, ...],
    "precipitation_sum": [4.2, 0.1, ...],
    "precipitation_probability_max": [75, 20, ...]
  }
}
```

### Mapping a DayForecast (slots)

Con datos horarios, el mapping a nuestros 3 slots es trivial:
- `morning`: horas 06–13 → `cloudCover` promedio, `weatherCode` dominante, `precipProb` max
- `afternoon`: horas 14–20 → ídem
- `night`: horas 21–23 del día N + horas 00–05 del día N+1 → ídem (ver definición canónica de night en `specs/weather-api-adapter/spec.md`)

### Códigos WMO (weathercode)

Open-Meteo usa estándar WMO:
| Código | Descripción |
|---|---|
| 0 | Cielo despejado |
| 1, 2, 3 | Principalmente despejado / Parcialmente nublado / Nublado |
| 45, 48 | Niebla |
| 51, 53, 55 | Llovizna (leve, moderada, densa) |
| 61, 63, 65 | Lluvia (leve, moderada, intensa) |
| 71, 73, 75 | Nevada |
| 77 | Granizo |
| 80, 81, 82 | Chubascos |
| 95 | Tormenta |
| 96, 99 | Tormenta con granizo |

---

## 3. MeteoSIX / MeteoGalicia

**Estado**: Pendiente de validación de acceso  
**URL**: https://www.meteogalicia.gal  
**API pública conocida**: https://servizos.meteogalicia.gal/mf/roquetes/

### Endpoints conocidos (pendiente confirmar CORS y disponibilidad)

| Propósito | URL |
|---|---|
| Predicción por concello | `https://servizos.meteogalicia.gal/mf/roquetes/proxys/predConcello?coords={lon},{lat}&lang=es&tz=Europe/Madrid` |
| RSS predicción Galicia | `https://www.meteogalicia.gal/web/RSS/rssNacional.action` |

### Estructura esperada (pendiente verificación)

MeteoGalicia expone predicción en formato JSON con campos similares a AEMET pero con nombres en gallego. La verificación debe:
1. Confirmar que el endpoint devuelve CORS headers libres
2. Documentar campos disponibles: temperatura, precipitación, estado_cielo, viento
3. Verificar si hay API key requerida o acceso libre

**Acción necesaria**: Hacer una request de prueba manual al endpoint de predicción por concello y documentar la respuesta completa aquí.

---

## 4. RainViewer API (capa satélite/radar)

**URL base**: `https://api.rainviewer.com`  
**Auth**: Sin API key (tier gratuito)  
**CORS**: Abierto ✅  

### Obtener timestamps disponibles

```
GET https://api.rainviewer.com/public/weather-maps.json
```

**Respuesta**:
```json
{
  "version": "2.0",
  "generated": 1745694000,
  "host": "https://tilecache.rainviewer.com",
  "radar": {
    "past": [
      {"time": 1745686800, "path": "/v2/radar/1745686800"},
      ...
    ],
    "nowcast": [
      {"time": 1745697600, "path": "/v2/radar/nowcast_1745697600"},
      ...
    ]
  },
  "satellite": {
    "infrared": [
      {"time": 1745686800, "path": "/v2/satellite/infrared/1745686800"},
      ...
    ]
  }
}
```

### Tiles de radar

```
GET https://tilecache.rainviewer.com/v2/radar/{timestamp}/{size}/{z}/{x}/{y}/{color}/{options}.png
```

- `size`: 256 o 512 (px)
- `color`: 1–8 (paleta de colores; 4 = Meteoalerta-style)
- `options`: `1_1` (smooth + snow)

**Ejemplo para MapLibre**:
```
https://tilecache.rainviewer.com/v2/radar/1745686800/256/{z}/{x}/{y}/4/1_1.png
```

### Animación

La animación se implementa iterando sobre el array `radar.past` (últimas ~12 pasadas de ~10 min) y cambiando el source de tiles en MapLibre. Ver spec `specs/satellite-layer/spec.md` para los requisitos de play/pausa.

### Límites

- Free tier: sin límite documentado para tiles individuales. Respetar rate limiting.
- Si se supera el límite: degradar a imagen estática del último timestamp conocido.

---

## 5. OpenFreeMap (tiles del mapa base)

**URL de estilo**: `https://tiles.openfreemap.org/styles/liberty`  
**Auth**: Sin API key  
**CORS**: Abierto ✅  
**Formato**: Vector tiles (PMTiles / Mapbox GL compatible → MapLibre compatible)  

```typescript
// src/config/map.ts
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
```

**Alternativas cuando se quiera mejorar calidad visual** (sin cambiar ningún componente, solo `MAP_STYLE_URL`):
- MapTiler: `https://api.maptiler.com/maps/streets/style.json?key={API_KEY}` (100k tiles/mes gratis)
- Stadia: `https://tiles.stadiamaps.com/styles/alidade_smooth.json` (libre con atribución)

---

## 6. Mapping AEMET → DayForecast

Tabla de correspondencia de campos para el adaptador `AemetProvider`:

| Campo `DayForecast` | Fuente AEMET | Notas |
|---|---|---|
| `date` | `prediccion.dia[].fecha` | Parsear `"YYYY-MM-DDT00:00:00"` |
| `slot.weatherCode` | `estadoCielo[periodo].value` | Necesita mapping de código AEMET → semántico/WMO |
| `slot.tempMax` | `temperatura.maxima` | Solo en slot morning (aplicable a todo el día) |
| `slot.tempMin` | `temperatura.minima` | Solo en slot morning |
| `slot.precipProb` | `probPrecipitacion[periodo].value` | Seleccionar el periodo que cubre el slot |
| `slot.cloudCover` | **N/A** | AEMET no provee %. Dejar `undefined`. |
| `slot.windSpeed` | `viento[periodo].velocidad` | En km/h |
| `slot.windDirection` | `viento[periodo].direccion` | En string cardinal (N, NE, SO...) |
| `slot.humidity` | **N/A** | AEMET solo da `humedadRelativa.maxima/minima` globales del día |
| `slot.snowProb` | `probNieve[periodo].value` | % probabilidad de nieve |

### Lógica de selección de periodo para cada slot

```typescript
function pickPeriod(items: {value: string, periodo: string}[], slot: TimeSlot): string | undefined {
  // Mapeo de slot a rangos de horas que lo cubren
  const ranges: Record<TimeSlot, [number, number][]> = {
    morning:   [[6, 12], [6, 14], [0, 12]],    // en orden de preferencia
    afternoon: [[12, 18], [12, 24], [12, 18]],
    night:     [[18, 24], [0, 6], [12, 24], [0, 24]],
  }
  // Intentar hacer match con cada rango preferido
  for (const [start, end] of ranges[slot]) {
    const key = `${String(start).padStart(2,'0')}-${String(end).padStart(2,'0')}`
    const found = items.find(i => i.periodo === key)
    if (found) return found.value
  }
  // Fallback: coger el único valor disponible ("00-24") o el primero
  return items.find(i => i.periodo === '00-24')?.value ?? items[0]?.value
}
```

---

## 7. Decisiones tomadas en este bloque

- **Proveedor MVP**: Open-Meteo (libre, CORS, sin proxy, datos horarios)
- **AEMET**: Post-MVP. Proxy necesario (doble-redirect). Alta complejidad de mapping.
- **MeteoSIX**: Post-MVP. Pendiente validación de acceso.
- **Tiles mapa base**: OpenFreeMap (sin API key). URL en `src/config/map.ts`.
- **Despliegue**: Vercel. Edge Function del proxy en `api/aemet/` del mismo repo.
- **Avisos MVP**: Mock estático hasta integrar AEMET Meteoalerta CAP.

---

## 8. Pendientes de validación manual

- [ ] Confirmar endpoint y CORS de MeteoSIX `predConcello`
- [ ] Obtener API key de AEMET y hacer request manual para verificar la estructura real del JSON de `datos`
- [ ] Verificar que el archivo CAP de avisos AEMET es parseable sin dependencias pesadas
- [ ] Confirmar que OpenFreeMap cubre Galicia con suficiente detalle a zoom 8–12
