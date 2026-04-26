## ADDED Requirements

### Requirement: Acceso a la vista de detalle de concello desde el mapa
El sistema SHALL permitir al usuario navegar a la vista de detalle de un concello haciendo clic sobre su área en el mapa (cuando el GeoJSON de concellos está activo) o sobre un icono de concello. La vista de detalle SHALL mostrarse como una página/ruta propia o como un panel de pantalla completa sobre el mapa en móvil.

#### Scenario: Click en concello desde el mapa
- **WHEN** el usuario hace clic sobre el área de un concello en el mapa
- **THEN** se abre la vista de detalle de ese concello mostrando su previsión completa

#### Scenario: Navegación de vuelta al mapa
- **WHEN** el usuario está en la vista de detalle de un concello
- **THEN** existe un botón/enlace visible para volver al mapa principal

### Requirement: Vista de detalle con previsión de 4 días × 3 franjas
La vista de detalle de un concello SHALL mostrar la previsión completa para hoy y los 3 días siguientes, organizada en columnas de día. Cada columna de día SHALL mostrar las tres franjas horarias: Mañana, Tarde, Noche. Cada franja horaria SHALL incluir: icono de estado del cielo, probabilidad de lluvia (%), velocidad y dirección del viento.

#### Scenario: Vista de las 4 columnas de día
- **WHEN** se carga la vista de detalle de un concello
- **THEN** se muestran 4 columnas (Hoy + 3 días) cada una con 3 filas (Mañana/Tarde/Noche) con icono, lluvia y viento por franja

#### Scenario: Columna del día actual destacada
- **WHEN** la vista de detalle está cargada
- **THEN** la columna del día actual está visualmente diferenciada de las otras 3 columnas

#### Scenario: Temperaturas máxima y mínima por día
- **WHEN** se visualiza la columna de un día
- **THEN** se muestra la temperatura máxima y mínima del día completo en la cabecera de la columna

### Requirement: Datos completos en la cabecera del detalle de concello
La vista de detalle SHALL mostrar en su cabecera: nombre del concello, provincia, temperatura actual (si está disponible), estado actual del cielo, amanecer y ocaso del día actual, y alertas activas si las hay.

#### Scenario: Cabecera con datos del concello
- **WHEN** se carga el detalle de un concello
- **THEN** la cabecera muestra: nombre, provincia, temperatura actual, icono de estado actual, hora de amanecer y ocaso

#### Scenario: Alerta activa en el detalle
- **WHEN** hay una alerta activa para ese concello
- **THEN** la cabecera muestra un badge o banner de alerta con nivel de color (amarillo/naranja/rojo) y descripción breve

### Requirement: Comentario textual de previsión
Si el proveedor meteorológico incluye un resumen textual de la previsión para el concello o zona, la vista de detalle SHALL mostrarlo en una sección "Comentario de previsión". Si no está disponible, esta sección se omite.

#### Scenario: Comentario disponible desde el proveedor
- **WHEN** el proveedor devuelve un texto de resumen para el concello
- **THEN** se muestra debajo de las columnas de días bajo el título `detail.forecast_comment` (clave i18n)

#### Scenario: Comentario no disponible
- **WHEN** el proveedor no devuelve texto de resumen
- **THEN** la sección de comentario no aparece en la vista sin espacios vacíos

### Requirement: Vista de detalle completamente traducida
Todos los textos de la vista de detalle (nombres de franjas, días de la semana, etiquetas de datos, mensajes de error) SHALL usar el sistema i18n. No SHALL haber ningún texto hardcodeado.

#### Scenario: Vista de detalle en Gallego
- **WHEN** el idioma activo es Gallego
- **THEN** las franjas muestran "Mañá", "Tarde", "Noite"; los días de la semana en gallego; todas las etiquetas en gallego
