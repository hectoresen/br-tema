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

## 3. MeteoSIX / MeteoGalicia — API v5

**Estado**: ✅ Acceso confirmado — API key obtenida. Documentación oficial: `docs/MeteosixApi/API_MeteoSIX_v5_gl.pdf` (95 páginas, Setembro 2025)  
**URL**: https://www.meteogalicia.gal  
**Base URL API v5**: `https://servizos.meteogalicia.gal/apiv5/`  
**Versión anterior** (obsoleta para este proyecto): `https://servizos.meteogalicia.gal/mf/roquetes/proxys/`

### 3.1 Autenticación

- Parámetro URL `API_KEY=<clave>` en **todas las peticiones** (case-sensitive, solo este parámetro).
- Clave gratuita, personal, vinculada a email. Las claves v4 son válidas para v5 (no requiere solicitud nueva).
- Peticiones sin API_KEY válida → excepción código `005` o `006`.

### 3.2 Operaciones disponibles

| Operación | Propósito |
|---|---|
| `GET /apiv5/findPlaces` | Buscar localidades/playas en Galicia por nombre |
| `GET /apiv5/getNumericForecastInfo` | Predicción numérica meteorológica y oceanográfica (hasta 7 días) |
| `GET /apiv5/getTidesInfo` | Predicción de mareas en la costa gallega (hasta 30 días, 60 días horizonte) |
| `GET /apiv5/getSolarInfo` | Horas de salida y puesta de sol |

### 3.3 Parámetros comunes a /getNumericForecastInfo, /getTidesInfo, /getSolarInfo

| Parámetro | Obligatorio | Valores | Defecto | Notas |
|---|---|---|---|---|
| `API_KEY` | Sí | Clave API | — | Case-sensitive |
| `locationIds` | Uno de los dos | IDs de /findPlaces, separados por coma | — | Max 20 |
| `coords` | Uno de los dos | `lon,lat;lon,lat;...` | — | Max 20 pares |
| `startTime` | No | `yyyy-MM-ddTHH:mm:ss` | Instante actual | |
| `endTime` | No | `yyyy-MM-ddTHH:mm:ss` | Máx. días según operación | |
| `lang` | No | `gl` / `es` / `en` | `en` | `gl` devuelve textos en gallego |
| `tz` | No | ID de zona horaria (ver anexo) | `Europe/Madrid` | |
| `format` | No | `application/json`, `gml3`, `kml`, `text/html` | `application/json` | |
| `CRS` | No | `EPSG:4326` | `EPSG:4326` | Único soportado |

> **Nota idioma**: usar `lang=gl` para devolver descripciones en gallego nativo — ideal para Brétema.  
> **Nota fechas en respuestas**: formato `yyyy-MM-ddTHH:mm:ss+XX` (con offset UTC). En peticiones: `yyyy-MM-ddTHH:mm:ss` (sin offset).

### 3.4 Operación /findPlaces

Localiza entidades de población y playas de Galicia por texto.

**Parámetros**: `API_KEY` (req.), `location` (req., texto parcial), `types` (`locality` / `beach`)  
**Máximo resultados**: 1000  
**Cobertura**: Solo Galicia

**Uso en Brétema**: Resolver nombres de concello a `locationId` para usar en las demás operaciones, como alternativa a `coords`. La lista estática de concellos (`concellos.json`) puede precargar los IDs.

**Ejemplo**:
```
GET https://servizos.meteogalicia.gal/apiv5/findPlaces?location=ferrol&API_KEY=***
```

### 3.5 Operación /getNumericForecastInfo — Variables disponibles

Esta es la operación principal para Brétema. Devuelve datos **horarios** (en punto) para hasta 7 días.

| Variable | Descripción | Modelo | Unidades defecto | Símbolo (iconURL) |
|---|---|---|---|---|
| `sky_state` | Estado del cielo | WRF | — (categórico) | ✅ |
| `temperature` | Temperatura | WRF | °C (entero) | No |
| `precipitation_amount` | Precipitación acumulada hora anterior | WRF | l/m² | No |
| `wind` | Viento (módulo + dirección) | WRF | km/h + grados | ✅ |
| `relative_humidity` | Humedad relativa | WRF | % | No |
| `cloud_area_fraction` | Cobertura de nubes | WRF | % | No |
| `air_pressure_at_sea_level` | Presión nivel del mar | WRF | hPa (entero) | No |
| `snow_level` | Cota de nieve | WRF | m (entero) | No |
| `sea_water_temperature` | Temperatura del agua | ROMS, MOHID | °C (entero) | No |
| `significative_wave_height` | Altura de ola | WW3, SWAN | m | No |
| `mean_wave_direction` | Dirección del mar | WW3, SWAN | grados | ✅ |
| `relative_peak_period` | Período de ola | WW3, SWAN | s (entero) | No |
| `sea_water_salinity` | Salinidad | ROMS, MOHID | psu | No |

**Variables por defecto** (si no se especifica `variables`): `sky_state,temperature,wind,precipitation_amount`

**Variables relevantes para Brétema** (petición recomendada):
```
variables=sky_state,temperature,precipitation_amount,wind,relative_humidity,cloud_area_fraction
```

#### Valores de sky_state (mapeo a weatherCode interno)

| sky_state MeteoSIX | Descripción | WMO equivalente sugerido |
|---|---|---|
| `SUNNY` | Soleado | 0 |
| `HIGH_CLOUDS` | Nubes altas | 1 |
| `PARTLY_CLOUDY` | Parcialmente nublado | 2 |
| `MID_CLOUDS` | Nubes medias | 2 |
| `OVERCAST` | Cubierto | 3 |
| `CLOUDY` | Nublado | 3 |
| `FOG` | Niebla | 45 |
| `FOG_BANK` | Banco de niebla | 45 |
| `MIST` | Neblina | 10 |
| `DRIZZLE` | Llovizna | 51 |
| `WEAK_RAIN` | Lluvia débil | 61 |
| `RAIN` | Lluvia | 63 |
| `SHOWERS` | Chubascos | 80 |
| `WEAK_SHOWERS` | Chubascos débiles | 80 |
| `OVERCAST_AND_SHOWERS` | Cubierto con chubascos | 81 |
| `STORMS` | Tormentas | 95 |
| `STORM_THEN_CLOUDY` | Tormenta y después nublado | 95 |
| `INTERMITENT_SNOW` | Nieve intermitente | 71 |
| `SNOW` | Nieve | 73 |
| `MELTED_SNOW` | Nieve fundida | 67 |
| `RAIN_HAIL` | Lluvia y granizo | 96 |

> ⚠️ Definir `src/providers/meteosix-codes.ts` con esta tabla. El adaptador MeteoSIX usa `sky_state` como fuente primaria del `weatherCode` en `DayForecast`.

#### Parámetros específicos de /getNumericForecastInfo

| Parámetro | Obligatorio | Defecto | Notas |
|---|---|---|---|
| `variables` | No | `sky_state,temperature,wind,precipitation_amount` | Lista separada por comas |
| `models` | No | — | WRF, WW3, SWAN, ROMS, MOHID. Si se especifica, misma longitud que variables |
| `grids` | No | — | Malla específica. Mejor disponible si se omite |
| `units` | No | Ver tabla | Lista por variable |
| `autoAdjustPosition` | No | `true` | Ajuste automático en zonas costeras |

**Rango temporal**: máximo 7 días por petición. La resolución es horaria (horas en punto).

#### Ejemplo de petición Brétema

```
GET https://servizos.meteogalicia.gal/apiv5/getNumericForecastInfo
  ?coords=-8.42,43.37
  &variables=sky_state,temperature,precipitation_amount,wind,relative_humidity,cloud_area_fraction
  &lang=gl
  &format=application/json
  &API_KEY=***
```

#### Estructura de respuesta JSON

```json
{
  "type": "FeatureCollection",
  "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
  "features": [{
    "type": "Feature",
    "geometry": {"type": "Point", "coordinates": [-8.42, 43.37]},
    "properties": {
      "days": [{
        "timePeriod": {
          "begin": {"timeInstant": "2024-01-01T00:00:00+01"},
          "end":   {"timeInstant": "2024-01-01T23:59:59+01"}
        },
        "variables": [
          {
            "name": "sky_state",
            "model": "WRF", "grid": "1km",
            "geometry": {"type": "Point", "coordinates": [-8.41, 43.37]},
            "values": [
              {"timeInstant": "2024-01-01T01:00:00+01", "modelRun": "2024-01-01T00:00:00+01",
               "value": "SUNNY", "iconURL": "https://..."}
            ]
          },
          {
            "name": "temperature",
            "model": "WRF", "grid": "1km", "units": "degC",
            "geometry": {"type": "Point", "coordinates": [-8.41, 43.37]},
            "values": [
              {"timeInstant": "2024-01-01T01:00:00+01", "modelRun": "...", "value": 12}
            ]
          },
          {
            "name": "wind",
            "model": "WRF", "grid": "1km",
            "moduleUnits": "kmh", "directionUnits": "deg",
            "geometry": {"type": "Point", "coordinates": [-8.41, 43.37]},
            "values": [
              {"timeInstant": "2024-01-01T01:00:00+01", "modelRun": "...",
               "moduleValue": 15.5, "directionValue": 270.0, "iconURL": "https://..."}
            ]
          }
        ]
      }]
    }
  }]
}
```

> **Nota**: si no hay datos para un instante concreto, `value`/`moduleValue`/`directionValue` serán `null`. Si no hay datos para toda la variable dentro de un día, `values` y `geometry` serán `null`.

### 3.6 Mapeo de MeteoSIX v5 → DayForecast interno

| Campo DayForecast | Variable MeteoSIX | Transformación |
|---|---|---|
| `weatherCode` | `sky_state` | Tabla `meteosix-codes.ts` |
| `temperature.min` / `.max` | `temperature` (hourly) | `Math.min/max` sobre valores del slot |
| `temperature.current` | `temperature` | Valor más cercano al instante actual |
| `precipitation.value` | `precipitation_amount` | Suma acumulada en el slot (3 horas) |
| `precipitationProbability` | — | **No disponible directamente** en MeteoSIX; inferible a partir de `sky_state` (RAIN/SHOWERS = ~80%, DRIZZLE = ~50%, etc.). Definir heurística en adaptador |
| `wind.speed` | `wind` → `moduleValue` | Media de valores del slot en km/h |
| `wind.direction` | `wind` → `directionValue` | Valor modal del slot en grados |
| `humidity` | `relative_humidity` | Media de valores del slot |
| `cloudCover` | `cloud_area_fraction` | Media de valores del slot (%) — ✅ **disponible, sin gap** |

> **Ventaja sobre AEMET**: MeteoSIX sí proporciona `cloud_area_fraction` (porcentaje directo), por lo que `cloudCover` en `DayForecast` se rellena completamente sin heurísticas.

### 3.7 Modelos de predicción y resoluciones

| Modelo | Mallas disponibles | Horizonte | Inicio ejecución (UTC) |
|---|---|---|---|
| WRF | 1km, 4km, 12km, 36km | 96h (1km) / 96h+84h resto | 00:00 / 12:00 |
| WW3 | Galicia (0.05°), Ibérica (0.25°), AtlánticoNorte (0.5°) | 109h / 97h | 00:00 / 12:00 |
| SWAN *(v4)* / USWAN *(v5)* | Galicia (variable) | 97h | 00:00 |
| ROMS | Galicia (0.02°) | 97h | 00:00 |
| MOHID | Artabro/Arousa/Vigo (0.003°) | 49h | 00:00 |

> ⚠️ **Discrepancia SWAN/USWAN**: El capítulo 10 del PDF oficial (novedades v5) indica que el modelo SWAN fue reemplazado por **USWAN** en v5. Sin embargo, la tabla de variables del capítulo 6.1 aún lista `SWAN` como modelo para `significative_wave_height`, `mean_wave_direction` y `relative_peak_period`. Esta inconsistencia existe en la documentación oficial (septiembre 2025). **Para Brétema no es relevante** (solo usamos variables WRF atmosféricas), pero si en el futuro se añaden datos de oleaje, verificar el nombre correcto antes de implementar.

> **Para Brétema (predicción atmosférica)**: usar WRF, omitir el parámetro `grids`. La API selecciona automáticamente la mejor malla disponible. **Comportamiento esperado de disponibilidad de la malla 1km**: esta malla solo tiene ejecución a las 00:00 UTC y finaliza ~07:30 UTC. Si el usuario consulta por la tarde y la malla 1km del día siguiente aún no está disponible, la API retornará datos de la mejor malla disponible (típicamente 4km). Este es el comportamiento correcto y esperado — no es un error ni un gap. La omisión de `grids` garantiza que siempre se obtienen los mejores datos disponibles en cada momento.

### 3.8 CORS y proxy

> ⚠️ **CORS pendiente de verificación directa**. La API requiere `API_KEY` en la URL. Por seguridad, la clave **no debe exponerse en el cliente**. Se planifica un Vercel Edge Function proxy en `/api/meteosix/` análogo al de AEMET. Ver Decision 21 en `design.md`.

El proxy intercepta la petición del cliente, añade la `API_KEY` desde variable de entorno, reenvía a MeteoGalicia y retorna la respuesta. Es una redirección directa (sin doble-redirect como AEMET).

**Nota sobre fallback directo**: La decisión de usar proxy es correcta independientemente de si MeteoSIX v5 tiene CORS abierto (la clave no puede exponerse al cliente). En el hipotético caso de fallo del proxy de Vercel (cold start extremo, límite de invocaciones gratuitas), el fallback correcto es `OpenMeteoProvider` — no un intento de llamada directa al cliente. No bloquea la implementación, pero debe tenerse en cuenta al definir la lógica de fallback en `MeteoSIXProvider`.

### 3.9 Excepciones relevantes

| Código | Descripción |
|---|---|
| 005 | No se encontró el parámetro API_KEY |
| 006 | API_KEY no válida |
| 216 | El punto indicado cae fuera de los límites geográficos con datos |
| 002 | Parámetro desconocido o mal escrito |
| 007 | Idioma no soportado |

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
  // Mapeo de slot a rangos de horas que lo cubren (en orden de preferencia)
  const ranges: Record<TimeSlot, [number, number][]> = {
    morning:   [[6, 12], [0, 12]],
    afternoon: [[12, 18], [12, 24]],
    // Night: preferir la segunda mitad del día o última parte; evitar "00-24" como
    // valor exacto porque lo comparte con todos los slots — si solo hay un único valor
    // diario, se usa como aproximación y se marca como tal.
    night:     [[18, 24], [21, 24]],
  }
  // Intentar hacer match con cada rango preferido
  for (const [start, end] of ranges[slot]) {
    const key = `${String(start).padStart(2,'0')}-${String(end).padStart(2,'0')}`
    const found = items.find(i => i.periodo === key)
    if (found) return found.value
  }
  // Fallback último recurso: único valor diario ("00-24").
  // ⚠️ Este valor cubre todo el día y se usa como aproximación para los tres slots.
  // El componente debe indicar visualmente que la granularidad es baja (p. ej. icono
  // sin distinción de franja) en lugar de presentarlo como dato preciso de noche.
  const daily = items.find(i => i.periodo === '00-24')
  if (daily) return daily.value  // aproximación — documentar en SlotForecast con `approximate: true`
  return items[0]?.value
}
```

---

## 7. Decisiones tomadas en este bloque

- **Proveedor MVP**: Open-Meteo (libre, CORS, sin proxy, datos horarios)
- **AEMET**: Post-MVP. Proxy necesario (doble-redirect). Alta complejidad de mapping.
- **MeteoSIX v5**: Post-MVP prioritario. API key obtenida. Proxy Vercel planificado (`/api/meteosix/`). Ver Decision 21 en `design.md`.
- **Tiles mapa base**: OpenFreeMap (sin API key). URL en `src/config/map.ts`.
- **Despliegue**: Vercel. Edge Function del proxy en `api/aemet/` del mismo repo.
- **Avisos MVP**: Mock estático hasta integrar AEMET Meteoalerta CAP.

---

## 8. Pendientes de validación manual

- [x] ~~Confirmar endpoint y CORS de MeteoSIX `predConcello`~~ → **Resuelto**: API v5 en `/apiv5/`, API key confirmada, endpoint documentado completamente en sección 3
- [x] Obtener API key de AEMET y hacer request manual para verificar la estructura real del JSON de `datos`
- [ ] Verificar que el archivo CAP de avisos AEMET es parseable sin dependencias pesadas
- [ ] Confirmar que OpenFreeMap cubre Galicia con suficiente detalle a zoom 8–12
- [ ] Verificar CORS de MeteoSIX v5 (`servizos.meteogalicia.gal/apiv5/`) con fetch desde el cliente — determinar si el proxy puede omitirse o es necesario para proteger la API_KEY
