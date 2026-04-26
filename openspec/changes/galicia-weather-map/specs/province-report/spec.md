## ADDED Requirements

### Requirement: Informe meteorológico por provincia
El sistema SHALL mostrar un informe meteorológico detallado de una provincia gallega cuando el usuario haga clic sobre ella en el mapa. El informe SHALL incluir: temperatura máxima y mínima, descripción del estado general, probabilidad de precipitación, viento (velocidad y dirección), humedad relativa. El informe corresponderá al día de previsión actualmente seleccionado.

#### Scenario: Clic en una provincia del mapa
- **WHEN** el usuario hace clic sobre el área de una provincia en el mapa
- **THEN** se abre un panel lateral o modal con el informe meteorológico de esa provincia para el día seleccionado

#### Scenario: Informe actualizado al cambiar de día
- **WHEN** el usuario tiene abierto el informe de una provincia y cambia el día de previsión
- **THEN** el informe se actualiza con los datos del nuevo día seleccionado sin cerrar el panel

#### Scenario: Cierre del informe de provincia
- **WHEN** el usuario cierra el panel/modal del informe
- **THEN** el panel desaparece y el mapa queda en primer plano sin ninguna provincia seleccionada

### Requirement: Identificación visual de la provincia seleccionada
El sistema SHALL resaltar visualmente la provincia seleccionada en el mapa mientras su informe está abierto.

#### Scenario: Resaltado de provincia al seleccionarla
- **WHEN** el usuario hace clic en una provincia
- **THEN** el contorno o relleno de esa provincia cambia visualmente para indicar que está seleccionada
