## ADDED Requirements

### Requirement: Conmutación de capas meteorológicas
El sistema SHALL permitir al usuario activar una capa meteorológica a la vez sobre el mapa. Las capas disponibles SHALL ser: `general` (sol/nubes/lluvia/nieve), `wind` (viento), `temperature` (temperatura), `humidity` (humedad), `precipitation` (precipitación), `storms` (tormentas). Solo una capa SHALL estar activa en cada momento. La capa activa SHALL actualizarse al cambiar el día de previsión seleccionado.

#### Scenario: Selección de capa meteorológica
- **WHEN** el usuario hace clic en el botón de una capa (p. ej. "Viento")
- **THEN** la capa de viento se superpone sobre el mapa y las demás capas se desactivan

#### Scenario: Capa activa por defecto
- **WHEN** la aplicación se carga por primera vez
- **THEN** la capa `general` está activa mostrando el estado general del tiempo

#### Scenario: Actualización de capa al cambiar de día
- **WHEN** el usuario navega a otro día de previsión
- **THEN** la capa activa se actualiza con los datos meteorológicos del nuevo día seleccionado

### Requirement: Indicador visual de capa activa
El sistema SHALL mostrar de forma clara qué capa está actualmente activa mediante resaltado visual en el selector de capas.

#### Scenario: Capa resaltada en el selector
- **WHEN** el usuario activa una capa
- **THEN** el botón de esa capa aparece visualmente resaltado (color de acento o borde activo) y los demás sin resaltar
