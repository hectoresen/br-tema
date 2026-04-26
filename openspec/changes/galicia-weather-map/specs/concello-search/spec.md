## ADDED Requirements

### Requirement: Tarjeta de previsión con buscador de concellos
El sistema SHALL mostrar una tarjeta fija debajo del mapa con un buscador de concellos gallegos y la previsión detallada del concello seleccionado para hoy y los 3 días siguientes. El concello por defecto SHALL ser Lugo. Cada día en la tarjeta SHALL mostrar: icono del estado general, temperatura máxima y mínima, probabilidad de lluvia, porcentaje de humedad, velocidad y dirección del viento, y alertas activas del día.

#### Scenario: Carga inicial con concello por defecto
- **WHEN** la aplicación se carga
- **THEN** la tarjeta muestra la previsión de Lugo para hoy y los 3 días siguientes

#### Scenario: Vista de un día en la tarjeta
- **WHEN** la tarjeta está visible
- **THEN** cada columna de día muestra: icono de tiempo, temp máx/mín (ºC), lluvia (%), humedad (%), viento (km/h + dirección) y un indicador de alertas si las hay

#### Scenario: Día actual resaltado
- **WHEN** la tarjeta muestra los 4 días
- **THEN** la columna de hoy está visualmente destacada respecto a los otros 3 días

### Requirement: Búsqueda de concello por nombre
El buscador SHALL permitir al usuario escribir el nombre de un concello gallego y seleccionarlo de una lista de sugerencias. Al seleccionar un concello, la tarjeta SHALL actualizarse con la previsión de ese concello. La búsqueda SHALL ser tolerante a acentos y mayúsculas.

#### Scenario: Búsqueda con coincidencias
- **WHEN** el usuario escribe al menos 2 caracteres en el buscador
- **THEN** aparece una lista desplegable con concellos que coincidan (máx. 8 resultados)

#### Scenario: Selección de concello de la lista
- **WHEN** el usuario selecciona un concello de las sugerencias
- **THEN** la tarjeta se actualiza con la previsión de ese concello y el buscador muestra el nombre seleccionado

#### Scenario: Sin resultados
- **WHEN** la búsqueda no encuentra ningún concello
- **THEN** la lista muestra "Sin resultados" sin romper la interfaz

#### Scenario: Búsqueda tolerante a acentos
- **WHEN** el usuario escribe "coruña" sin acento
- **THEN** aparece "A Coruña" entre los resultados

### Requirement: Alertas del día en la tarjeta de concello
Si el concello seleccionado tiene alertas meteorológicas activas en alguno de los 4 días mostrados, la tarjeta SHALL mostrarlo con un indicador visual en la columna del día correspondiente.

#### Scenario: Día con alerta activa
- **WHEN** hay una alerta activa para el concello en un día concreto
- **THEN** la columna de ese día muestra un icono o badge de alerta con el nivel de color correspondiente (amarillo/naranja/rojo)

#### Scenario: Día sin alertas
- **WHEN** no hay alertas activas para ese día
- **THEN** la columna no muestra ningún indicador de alerta
