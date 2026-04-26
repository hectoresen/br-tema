## ADDED Requirements

### Requirement: Sin texto hardcodeado en componentes
El sistema SHALL garantizar que ningún string visible al usuario esté hardcodeado en componentes, templates o lógica de negocio. Todos los textos SHALL referenciarse mediante claves de traducción (p. ej. `$_('map.layers.wind')`).

#### Scenario: Componente renderiza texto traducido
- **WHEN** un componente necesita mostrar una etiqueta, título o mensaje
- **THEN** usa la función de traducción con una clave semántica, no el texto literal

#### Scenario: Auditoría de texto hardcodeado
- **WHEN** se revisa cualquier componente `.svelte`
- **THEN** no existe ningún string en español, gallego u otro idioma directamente en el template o en la lógica del componente

### Requirement: Idiomas obligatorios en MVP: Español y Gallego
El sistema SHALL incluir archivos de mensajes completos para Español (`es.json`) y Gallego (`gl.json`). Todas las claves de traducción definidas en la aplicación SHALL tener valor en ambos idiomas al publicar el MVP.

#### Scenario: Cambio de idioma a Gallego
- **WHEN** el usuario selecciona "Galego" en el selector de idioma
- **THEN** toda la interfaz cambia a Gallego sin recarga de página: etiquetas, tooltips, mensajes de error, nombres de capas, días de la semana, etc.

#### Scenario: Cambio de idioma a Español
- **WHEN** el usuario selecciona "Español" en el selector de idioma
- **THEN** toda la interfaz cambia a Español sin recarga de página

#### Scenario: Clave de traducción faltante
- **WHEN** se accede a una clave que no existe en el archivo de mensajes del idioma activo
- **THEN** el sistema muestra la clave en lugar del texto o usa el idioma de fallback (es), nunca muestra un error visible al usuario

### Requirement: Detección automática del idioma del navegador
El sistema SHALL detectar el idioma preferido del navegador al cargar la aplicación y establecerlo como idioma activo si está disponible (es o gl). Si el idioma del navegador no está disponible, SHALL usar Español como idioma por defecto.

#### Scenario: Navegador configurado en Gallego
- **WHEN** el navegador reporta `navigator.language` como `gl` o `gl-ES`
- **THEN** la aplicación carga en Gallego automáticamente

#### Scenario: Navegador en idioma no soportado
- **WHEN** el navegador reporta un idioma no disponible (p. ej. `fr` o `de`)
- **THEN** la aplicación carga en Español como idioma por defecto

### Requirement: Selector de idioma accesible en la cabecera
El sistema SHALL mostrar un selector de idioma visible y accesible en la cabecera de la aplicación que permita cambiar entre los idiomas disponibles.

#### Scenario: Selector visible en móvil y desktop
- **WHEN** la aplicación está cargada en cualquier dispositivo
- **THEN** el selector de idioma es visible y usable sin necesidad de hacer scroll

### Requirement: Arquitectura extensible para nuevos idiomas
El sistema SHALL estar diseñado para que añadir un nuevo idioma (p. ej. Inglés o Portugués) requiera únicamente: crear el archivo de mensajes (`en.json` o `pt.json`) y registrar el idioma en la configuración de svelte-i18n. No SHALL requerirse cambios en componentes.

#### Scenario: Añadir idioma Inglés en el futuro
- **WHEN** se crea `src/i18n/en.json` con todas las claves traducidas y se registra el locale
- **THEN** el Inglés aparece disponible en el selector de idioma y la UI es completamente funcional en ese idioma
