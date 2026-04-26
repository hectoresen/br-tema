## ADDED Requirements

### Requirement: Investigación y selección de API meteorológica española
Como primera tarea de implementación, el equipo SHALL investigar y documentar los endpoints disponibles de AEMET OpenData y MeteoSIX (MeteoGalicia) para previsión municipal/concello, validar qué campos devuelven y mapearlos al modelo `DayForecast` interno. El resultado SHALL quedar documentado en `docs/api-research.md` antes de implementar ningún proveedor.

#### Scenario: Documentación de AEMET endpoints
- **WHEN** se completa la investigación de AEMET OpenData
- **THEN** existe `docs/api-research.md` con: URL de endpoint de predicción municipal, estructura de respuesta, campos disponibles y su correspondencia con `DayForecast`

#### Scenario: Validación de MeteoSIX
- **WHEN** se tiene acceso o información pública sobre MeteoSIX
- **THEN** el mismo documento incluye la misma información para MeteoSIX; si el acceso no está disponible, se documenta el estado pendiente

### Requirement: Jerarquía de proveedores meteorológicos
El sistema SHALL implementar los proveedores en orden de prioridad: 1º AEMET OpenData, 2º MeteoSIX/MeteoGalicia, 3º Open-Meteo (fallback). En el MVP, Open-Meteo SHALL ser el proveedor funcional por defecto mientras se integran los proveedores españoles. El adaptador SHALL estar diseñado para que activar un nuevo proveedor requiera únicamente cambiar el registro en `src/providers/index.ts`.

#### Scenario: AEMET como proveedor activo
- **WHEN** AEMET está configurado como proveedor y el thin proxy está disponible
- **THEN** los datos de temperatura, precipitación, viento y estado general provienen de AEMET OpenData sin cambios en la UI

#### Scenario: Fallback a Open-Meteo
- **WHEN** AEMET no está disponible o no está configurado
- **THEN** el sistema usa Open-Meteo automáticamente y muestra los datos sin degradación visible en la interfaz

### Requirement: Thin proxy para AEMET (CORS)
El sistema SHALL incluir un thin proxy serverless (Cloudflare Worker o Vercel Edge Function) que actúe como intermediario para las peticiones a AEMET OpenData, añadiendo la API key y resolviendo las restricciones CORS. El proxy SHALL ser configurable mediante variables de entorno.

#### Scenario: Petición a AEMET a través del proxy
- **WHEN** el frontend hace una petición al proxy con los parámetros de localización
- **THEN** el proxy llama a AEMET con la API key y devuelve la respuesta al frontend

#### Scenario: API key no configurada
- **WHEN** la variable de entorno con la API key de AEMET no está configurada
- **THEN** el sistema registra un error y cae automáticamente al siguiente proveedor en la jerarquía

### Requirement: Interfaz de proveedor meteorológico intercambiable
El sistema SHALL definir una interfaz `WeatherProvider` que todas las implementaciones de proveedores deben cumplir. La UI SHALL depender únicamente de esta interfaz, nunca de una implementación concreta. El proveedor activo SHALL configurarse en un único punto de la aplicación.

#### Scenario: Obtención de previsión para Galicia
- **WHEN** la aplicación necesita datos meteorológicos para mostrar en el mapa
- **THEN** solicita los datos a través de la interfaz `WeatherProvider` sin importar qué proveedor concreto está configurado

#### Scenario: Sustitución del proveedor
- **WHEN** se cambia el proveedor en el fichero de configuración
- **THEN** la aplicación funciona correctamente sin modificaciones en los componentes de UI

### Requirement: Implementación del proveedor Open-Meteo
El sistema SHALL incluir una implementación concreta de `WeatherProvider` que obtenga datos de la API pública de Open-Meteo. Esta implementación SHALL ser el proveedor activo por defecto en el MVP hasta que AEMET esté integrado.

#### Scenario: Solicitud de previsión a Open-Meteo
- **WHEN** la aplicación solicita la previsión de 4 días para un punto de Galicia
- **THEN** el adaptador realiza la llamada a la API de Open-Meteo y transforma la respuesta al modelo de datos interno

#### Scenario: Fallo de la API externa
- **WHEN** la API de Open-Meteo no está disponible o devuelve error
- **THEN** el sistema muestra un mensaje de error al usuario sin romper la interfaz

### Requirement: Modelo de datos de previsión normalizado
El sistema SHALL usar un modelo de datos interno normalizado (`DayForecast`) independiente del proveedor. El adaptador SHALL ser responsable de transformar la respuesta de la API al modelo interno.

#### Scenario: Normalización de datos del proveedor
- **WHEN** el adaptador recibe la respuesta de cualquier proveedor
- **THEN** devuelve un objeto `DayForecast` con los campos: fecha, slots horarios (mañana/tarde/noche), temperatura máx/mín, estado general (WMO code), probabilidad de precipitación, viento (velocidad y dirección), humedad

### Requirement: Definición canónica de franjas horarias y tratamiento de medianoche
Las tres franjas horarias son:
- **Mañana**: 06:00–13:59 del día N
- **Tarde**: 14:00–20:59 del día N
- **Noche**: 21:00–23:59 del día N **+ 00:00–05:59 del día N+1**

La franja Noche cruza la medianoche. `DayForecast` para el día N SHALL incluir las horas de madrugada del día N+1 como parte de su slot `night`. Es decir, cuando se construye `DayForecast[N].night`, el adaptador SHALL leer horas 21–23 de la fecha N y horas 00–05 de la fecha N+1 de la respuesta horaria de la API.

Los valores agregados del slot (temperatura representativa, precipitación, icono) se calculan sobre ese bloque completo de 9 horas (21:00–05:59).

#### Scenario: Construcción del slot noche para un día interior
- **GIVEN** que Open-Meteo devuelve datos horarios para varios días
- **WHEN** el adaptador construye `DayForecast[N].night`
- **THEN** agrega las horas `[N 21:00, N 22:00, N 23:00, N+1 00:00, N+1 01:00, N+1 02:00, N+1 03:00, N+1 04:00, N+1 05:00]`

#### Scenario: Slot noche del último día disponible (degradación graceful)
- **GIVEN** que el último día del forecast es el día con índice 3 (hoy+3)
- **WHEN** el proveedor no dispone de datos para hoy+4 (00:00–05:59)
- **THEN** el adaptador construye `DayForecast[3].night` únicamente con las horas disponibles (21:00–23:59 del día 3) y marca el slot como `partial: true`
- **AND** la UI muestra el icono y datos calculados sobre las horas disponibles sin errores

#### Scenario: Open-Meteo tiene suficiente rango para cubrir la noche del día 3
- **GIVEN** que Open-Meteo devuelve datos con rango de al menos 5 días (valor habitual en su API gratuita)
- **WHEN** el adaptador construye `DayForecast[3].night`
- **THEN** dispone de las horas 00:00–05:59 del día 4 y construye el slot completo sin degradación
