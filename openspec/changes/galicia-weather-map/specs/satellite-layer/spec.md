## ADDED Requirements

### Requirement: Capa de vista satélite conmutable en el mapa
El sistema SHALL incluir una tercera capa conmutable en el selector del mapa denominada "Satélite". Cuando esta capa está activa, el mapa SHALL mostrar tiles de imágenes de satélite o radar meteorológico sobre Galicia, permitiendo ver la evolución de nubes, precipitación y/o viento. La fuente primaria SHALL ser RainViewer API (radar + satélite animado); la fuente secundaria Eumetsat/Copernicus WMTS (satélite óptico).

#### Scenario: Activar capa satélite
- **WHEN** el usuario hace clic en el botón "Satélite" del selector de capas
- **THEN** el mapa muestra tiles de satélite/radar superpuestos sobre el mapa base de Galicia, ocultando las otras capas meteorológicas activas

#### Scenario: Capa satélite no interfiere con otras capas
- **WHEN** el usuario cambia de la capa satélite a otra capa (p. ej. `general`)
- **THEN** los tiles de satélite se eliminan y se muestra la capa seleccionada

#### Scenario: Indicador de capa activa en el selector
- **WHEN** la capa satélite está activa
- **THEN** el botón "Satélite" está resaltado en el selector y los demás están sin resaltar

### Requirement: Animación de evolución de nubes/precipitación
Cuando la capa satélite está activa, el sistema SHALL mostrar una animación de los últimos frames disponibles de radar/satélite, representando la evolución temporal de las nubes o precipitación sobre Galicia. El usuario SHALL poder iniciar/pausar la animación.

#### Scenario: Animación automática al activar capa satélite
- **WHEN** el usuario activa la capa satélite
- **THEN** la animación de evolución se inicia automáticamente reproduciendo los últimos frames disponibles (mín. 6 frames si la API los provee)

#### Scenario: Control de pausa/reproducción
- **WHEN** hay una animación de satélite en reproducción
- **THEN** existe un control visible (botón play/pausa) para detener o reanudar la animación

#### Scenario: Sin datos de animación disponibles
- **WHEN** RainViewer API no devuelve timestamps o no hay datos para la región
- **THEN** se muestra un frame estático del satélite o un mensaje "Datos de satélite no disponibles" sin romper la interfaz

### Requirement: Degradación graceful si la fuente de satélite falla
Si RainViewer API no está disponible y tampoco hay tiles Eumetsat, el sistema SHALL mostrar un mensaje de error específico para la capa satélite sin afectar al resto de la aplicación.

#### Scenario: API de satélite no disponible
- **WHEN** la petición a RainViewer API falla o devuelve error
- **THEN** la capa satélite muestra el mensaje `map.satellite.unavailable` (clave i18n) y permite al usuario seleccionar otra capa
