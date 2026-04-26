## ADDED Requirements

### Requirement: Mapa interactivo de Galicia
El sistema SHALL mostrar un mapa interactivo centrado en Galicia como vista principal de la aplicación. El mapa SHALL ocupar la mayor parte del viewport y permitir zoom y paneo. Las 4 provincias gallegas SHALL estar delimitadas mediante un GeoJSON superpuesto como capa vectorial.

#### Scenario: Carga inicial del mapa
- **WHEN** el usuario abre la aplicación
- **THEN** el mapa se centra automáticamente sobre Galicia con un nivel de zoom que muestra la comunidad completa

#### Scenario: Interacción básica con el mapa
- **WHEN** el usuario hace scroll o usa los controles de zoom
- **THEN** el mapa responde con zoom/paneo fluido sin recargar la página

#### Scenario: Delimitación de provincias visible
- **WHEN** el mapa está cargado
- **THEN** los límites de las 4 provincias están visibles como líneas superpuestas sobre el mapa base

### Requirement: Iconos meteorológicos compuestos por provincia
El sistema SHALL mostrar en el centro geográfico de cada provincia un icono meteorológico compuesto que represente el estado del tiempo actual según los datos del slot horario activo. El icono base SHALL determinarse por la cobertura de nubes: ≤20% → sol, 20–60% → sol con nubes, >60% → nublado. Sobre el icono base SHALL aplicarse modificadores:
- Si probabilidad de precipitación ≥ 50%: añadir icono de lluvia suave
- Si probabilidad de precipitación ≥ 75%: añadir icono de lluvia intensa
- Si hay nieve prevista: añadir icono de copo de nieve + etiqueta de altitud mínima (ej. "500 m")
- Si hay tormenta (weatherCode indica thunderstorm): añadir icono de rayo

El sistema SHALL estar arquitectónicamente preparado para mostrar iconos a nivel concello en lugar de provincia (activable mediante flag de configuración).

#### Scenario: Día soleado sin lluvia
- **WHEN** cloudCover ≤ 20% y precipitationProbability < 50%
- **THEN** el icono de la provincia muestra un sol

#### Scenario: Día parcialmente nublado sin lluvia significativa
- **WHEN** cloudCover entre 20% y 60% y precipitationProbability < 50%
- **THEN** el icono muestra sol con nube

#### Scenario: Día nublado con lluvia moderada
- **WHEN** cloudCover > 60% y precipitationProbability entre 50% y 74%
- **THEN** el icono muestra nube con gotas de lluvia suave

#### Scenario: Lluvia intensa
- **WHEN** precipitationProbability ≥ 75%
- **THEN** el icono muestra el estado base más gotas de lluvia intensa

#### Scenario: Nieve prevista
- **WHEN** el weatherCode indica nieve y hay altitud mínima de nieve disponible
- **THEN** el icono añade un copo de nieve y una etiqueta con la altitud mínima esperada en metros

#### Scenario: Tormenta
- **WHEN** el weatherCode indica tormenta
- **THEN** el icono muestra nube con rayo independientemente de los demás parámetros

### Requirement: Tooltip con datos meteorológicos al hacer hover en una provincia
Al pasar el cursor sobre el área de una provincia, el sistema SHALL mostrar un tooltip con los siguientes datos del slot horario activo: temperatura mínima y máxima, porcentaje de humedad, velocidad y dirección del viento, porcentaje de probabilidad de lluvia.

#### Scenario: Hover sobre provincia
- **WHEN** el usuario coloca el cursor sobre el área de una provincia en el mapa
- **THEN** aparece un tooltip con: temp mín/máx (ºC), humedad (%), viento (km/h y dirección cardinal), probabilidad de lluvia (%)

#### Scenario: Tooltip se oculta al salir
- **WHEN** el cursor sale del área de la provincia
- **THEN** el tooltip desaparece

### Requirement: Preparación para nivel concello
La arquitectura del mapa SHALL soportar un modo de visualización a nivel concello activable mediante configuración, cargando el GeoJSON de los ~313 concellos gallegos de forma lazy. En el MVP este modo puede estar desactivado por defecto.

#### Scenario: Flag de nivel concello desactivado (MVP)
- **WHEN** la configuración tiene `mapLevel: "province"`
- **THEN** el mapa muestra iconos y tooltips por provincia

#### Scenario: Flag de nivel concello activado (futuro)
- **WHEN** la configuración tiene `mapLevel: "concello"` y el GeoJSON de concellos está cargado
- **THEN** el mapa muestra iconos y tooltips por concello en lugar de por provincia
