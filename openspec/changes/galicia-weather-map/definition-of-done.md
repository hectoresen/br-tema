# Definition of Done — Brétema (Fase de desarrollo activo)

## Estrategia de ramas

- **`main`** contiene únicamente especificaciones y documentación durante la fase de desarrollo activo. Ningún código de aplicación se mergeará contra `main` en esta fase.
- **`develop`** es la rama de integración. Todo el código de la aplicación vive aquí. El agente nunca empuja directamente sobre `develop`.

---

## Flujo de trabajo por tarea

### 1. Inicio de tarea

El agente crea una rama nueva desde `develop` con nomenclatura semántica:

```
FEAT/<nombre>    → nueva funcionalidad
FIX/<nombre>     → corrección de bug
UPD/<nombre>     → actualización o mejora de algo existente
DELETE/<nombre>  → eliminación de código o recurso
```

**Ejemplos**: `FEAT/meteosix-adapter`, `FIX/wind-slot-mapping`, `UPD/weather-icons`.

### 2. Desarrollo

El agente implementa la tarea sobre esa rama. Los cambios no salen de la rama hasta que se cumplan todos los criterios del punto 3.

### 3. Criterios de finalización

El agente itera hasta que los seis pasos sean verdes. Si cualquiera falla, se continúa en la misma rama sin mergear.

---

#### Paso 1 — Tests unitarios y e2e

- Se crean tests unitarios y e2e para la funcionalidad implementada.
- Los tests no usan `any` ni `unknown` en TypeScript.
- Los tests responden al criterio de la tarea y de la spec, no a la implementación. El test no se adapta al código; es el código quien se adapta al test. Si un test falla, se corrige la implementación, nunca el test.
- Los tests de APIs meteorológicas externas usan mocks; no dependen de servicios reales ni de red.
- Los tests e2e corren contra el servidor local de desarrollo.

#### Paso 2 — Build de frontend

- `npm run build` (o equivalente) termina sin errores ni warnings críticos.

#### Paso 3 — Build / validación de backend

- Las Edge Functions y el proxy serverless compilan y pasan sus tests sin errores.

#### Paso 4 — Linter

- Se ejecuta el linter configurado en el proyecto.
- No quedan errores. Las advertencias de deuda técnica se resuelven o se documentan explícitamente como excepción justificada.
- El indentado y el estilo de código son consistentes con el resto del proyecto.

#### Paso 5 — Documentación

- Se actualiza `README.md` si hay cambios que afectan a instalación, configuración o uso.
- Se añade una entrada en `CHANGELOG.md` describiendo qué se implementó, qué se corrigió o qué se eliminó.

#### Paso 6 — Merge

- Con los cinco pasos anteriores en verde, el agente mergea la rama contra `develop`.
- El merge lo hace el agente directamente (no hay PR en esta fase); la validación humana ocurre sobre `develop`.
