## ADDED Requirements

### Requirement: Barra de navegación temporal con franjas horarias
El sistema SHALL mostrar una barra horizontal debajo del mapa con tres franjas horarias del día activo: **Mañana** (06–14h), **Tarde** (14–21h) y **Noche** (21–06h). Al seleccionar una franja, el mapa SHALL actualizarse mostrando los datos meteorológicos correspondientes a ese slot, sin cambiar el día activo.

#### Scenario: Carga inicial con franja por defecto
- **WHEN** la aplicación se carga
- **THEN** la franja "Mañana" del día actual está seleccionada y el mapa muestra los datos de esa franja

#### Scenario: Cambio de franja horaria
- **WHEN** el usuario hace clic en "Tarde" o "Noche" en la barra
- **THEN** el mapa se actualiza con los datos de esa franja y la franja seleccionada queda resaltada visualmente

### Requirement: Navegación entre días desde la barra temporal
La barra temporal SHALL incluir una flecha en el extremo derecho para avanzar al día siguiente. El usuario SHALL poder navegar hasta 3 días adelante desde el día actual (hoy + 3 días). También SHALL poder retroceder hasta el día actual mediante una flecha izquierda que aparece cuando no está en el día actual.

#### Scenario: Avanzar al día siguiente
- **WHEN** el usuario hace clic en la flecha derecha y el día activo no es el último disponible (hoy + 3)
- **THEN** la barra avanza al día siguiente, la franja vuelve a "Mañana" por defecto y el mapa se actualiza

#### Scenario: Retroceder al día anterior
- **WHEN** el usuario está en un día distinto al actual y hace clic en la flecha izquierda
- **THEN** la barra retrocede un día y el mapa se actualiza

#### Scenario: Límite máximo de días
- **WHEN** el día activo es hoy + 3
- **THEN** la flecha derecha está deshabilitada o no visible

#### Scenario: Límite mínimo (día actual)
- **WHEN** el día activo es el día actual
- **THEN** la flecha izquierda está deshabilitada o no visible

### Requirement: Indicador de estado resumido por día
Cada día en la barra de navegación SHALL mostrar un icono representativo del estado general del tiempo para ese día (sol, nubes, lluvia, nieve, tormenta) para facilitar la selección rápida.

#### Scenario: Icono de tiempo en cada día
- **WHEN** los datos de previsión están cargados
- **THEN** cada tarjeta de día en la barra muestra el icono correspondiente al estado general del tiempo de ese día
