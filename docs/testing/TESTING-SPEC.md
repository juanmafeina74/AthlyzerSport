# AthLyzer Sports Train: especificación de pruebas

Estado: documento de referencia previo a la futura configuración de agentes.
Fecha de revisión: 2026-10-06.

## Herramientas y comandos disponibles

Backend (`backend/`):

```text
npm run build
npm run test
npm run lint
npm run test:e2e
```

Usa Nest build, Vitest y Oxlint. `npm run test:e2e` ejecuta la configuración e2e; los tests que levantan el `AppModule` real requieren PostgreSQL disponible y variables de entorno. Los e2e que sustituyen `PrismaService` pueden correr sin esa base de datos.

Frontend (`frontend/`):

```text
npm run build
```

El script de build ejecuta `tsc --noEmit` y `vite build`. A fecha de esta revisión no hay scripts frontend de test ni lint configurados; no declarar esos gates como ejecutados. Si se necesita cobertura automatizada de UI, proponer primero herramienta y alcance como trabajo separado.

## Estrategia

- Probar comportamiento observable y reglas de negocio, no detalles internos que impidan refactorizar.
- Para una regla de servicio, preferir un test unitario con Prisma mock siguiendo los `*.service.spec.ts` cercanos.
- Para contrato HTTP, DTO, guards y status, usar pruebas e2e con Supertest y Prisma mock cuando sea adecuado.
- Reservar base de datos real para casos que validen integración real con Prisma/PostgreSQL; indicar los requisitos de entorno.
- Para cambios visuales o de navegación, ejecutar el build y realizar una comprobación manual en navegador cuando la experiencia no quede validada por build.
- Un bug corregido debe tener test de regresión si el comportamiento es automatizable. Si no lo es, dejar constancia de la verificación manual.

## Cobertura por tipo de cambio

### Backend

- Reglas de negocio: casos válidos, límites, entidades inexistentes, duplicados y restricciones de borrado relevantes.
- DTO/HTTP: campos obligatorios, tipos inválidos, propiedades adicionales, conversión y parámetros inválidos.
- Autorización: ausencia/token inválido, rol permitido y rol insuficiente cuando la ruta está protegida.
- Datos: persistencia/consulta, orden esperado, relaciones e historial si forman parte del contrato.
- Rate limit: verificar `429` cuando se modifica ese control o el comportamiento del endpoint lo requiere.

No exigir que cada endpoint responda todos los códigos `200`, `400`, `401`, `403` y `404`: elegir solo los aplicables al método y a su configuración. En NestJS un `POST` responde `201` por defecto salvo que se declare otro status. Añadir `409` para conflictos solo cuando forme parte del comportamiento esperado.

### Frontend

Comprobar según el alcance: build, render, navegación, formularios, estados de carga/error, interpretación de `response.ok` y restricciones visuales por rol. Las restricciones de UI no sustituyen pruebas de permisos backend.

## Gates de aceptación

- Ejecutar primero la comprobación más pequeña que valide el cambio; después los gates de la capa tocada.
- Para cambios backend, ejecutar `npm run build`, `npm run test` y `npm run lint` desde `backend/` cuando el entorno lo permita.
- Para cambios frontend, ejecutar `npm run build` desde `frontend/`.
- Ejecutar e2e con base de datos solo si está configurada y el cambio lo justifica. Si no puede ejecutarse, informar la limitación en lugar de afirmar que pasó.
- No aceptar una funcionalidad sin evidencia de prueba proporcional al riesgo; no exigir suites o gates que no existen en el proyecto.

## Informe de resultados

Indicar comandos ejecutados, resultado, fallos y requisitos no disponibles (por ejemplo, PostgreSQL o pruebas frontend aún no configuradas). Distinguir build, lint, unit tests, e2e y verificación manual.