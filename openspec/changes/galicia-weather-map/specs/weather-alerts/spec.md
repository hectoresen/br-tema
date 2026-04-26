## ADDED Requirements

### Requirement: Tarjeta de avisos meteorológicos en cabecera
El sistema SHALL mostrar una tarjeta/banner fijo en la parte superior de la página, justo debajo del header o integrada en él, con los avisos meteorológicos activos para Galicia. Cada aviso SHALL mostrar: tipo (tormenta, nieve, viento fuerte, lluvia intensa, etc.), zona afectada, nivel de alerta (amarillo/naranja/rojo) y descripción breve. Si no hay avisos activos, la tarjeta SHALL mostrar un estado neutro (p. ej. "Sin avisos activos").

#### Scenario: Avisos activos disponibles
- **WHEN** el proveedor meteorológico devuelve uno o más avisos activos
- **THEN** la tarjeta de avisos muestra cada aviso con su tipo, nivel de alerta (color) y zona afectada

#### Scenario: Sin avisos activos
- **WHEN** el proveedor no devuelve avisos o la lista está vacía
- **THEN** la tarjeta muestra el mensaje "Sin avisos activos" en estado neutro sin ocupar espacio excesivo

#### Scenario: Proveedor sin soporte de avisos (MVP)
- **WHEN** el proveedor no implementa el método `getAlerts()`
- **THEN** el sistema usa un set de avisos mock estáticos para poblar la tarjeta sin romper la interfaz

### Requirement: Niveles de alerta visual diferenciados
Cada aviso SHALL estar coloreado visualmente según su nivel: amarillo (precaución), naranja (alerta), rojo (emergencia). El color SHALL seguir la convención estándar de AEMET/Meteogalicia.

#### Scenario: Aviso de nivel amarillo
- **WHEN** un aviso tiene nivel "yellow"
- **THEN** la tarjeta o badge del aviso muestra fondo o borde amarillo

#### Scenario: Aviso de nivel rojo
- **WHEN** un aviso tiene nivel "red"
- **THEN** la tarjeta o badge del aviso muestra fondo o borde rojo destacado sobre los demás
