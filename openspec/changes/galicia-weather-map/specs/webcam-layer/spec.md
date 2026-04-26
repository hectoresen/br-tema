## ADDED Requirements

### Requirement: Capa de webcams públicas en el mapa
El sistema SHALL incluir una capa conmutable de webcams públicas. Cuando la capa `webcams` está activa, el mapa SHALL mostrar iconos de videocámara en las coordenadas de cada webcam registrada. Las webcams deben proceder de fuentes públicas (DGT, Meteogalicia, ayuntamientos u otras entidades).

#### Scenario: Activar capa de webcams
- **WHEN** el usuario activa la capa "Webcams"
- **THEN** aparecen iconos de videocámara sobre el mapa en las ubicaciones de las webcams registradas

#### Scenario: Sin interferencia con otras capas
- **WHEN** la capa de webcams está activa junto con una capa meteorológica
- **THEN** los iconos de webcam son visibles sobre la capa meteorológica sin ocultarla

### Requirement: Acceso a una webcam desde el mapa
El sistema SHALL permitir al usuario acceder al stream o imagen de una webcam haciendo clic sobre su icono en el mapa.

#### Scenario: Clic en icono de webcam
- **WHEN** el usuario hace clic en un icono de webcam
- **THEN** se muestra el nombre de la webcam y un enlace/miniatura para acceder a la imagen o stream en vivo

#### Scenario: Apertura del stream
- **WHEN** el usuario confirma acceder a la webcam
- **THEN** el sistema abre la URL del stream o imagen en una nueva pestaña del navegador
