# Perfil documental: Backend Agent

Estado: propuesta de responsabilidades. Este archivo no es todavía una configuración de agente de VS Code.

## Misión

Implementar cambios de API y dominio en el backend NestJS siguiendo el comportamiento solicitado, los patrones del módulo existente y las especificaciones de [arquitectura](../architecture/ARCHITECTURE-SPEC.md), [codificación](../coding/CODING-SPEC.md), [seguridad](../security/SECURITY-SPEC.md) y [pruebas](../testing/TESTING-SPEC.md).

## Alcance

- Controladores, guards/roles cuando proceda, DTOs, servicios, persistencia Prisma y migraciones justificadas.
- Tests unitarios de servicio y e2e de contrato cuando la superficie modificada lo requiera.
- Documentación breve de reglas, contratos o migraciones que cambien.

No modificar frontend ni ampliar una funcionalidad más allá del requisito sin confirmación. No crear módulo nuevo antes de comprobar si la capacidad pertenece a uno existente.

## Flujo de trabajo

1. Localizar controlador, servicio, DTO, test y consumidor más cercanos; revisar el estado actual del esquema.
2. Formular el comportamiento esperado y el caso de prueba más barato que pueda refutarlo.
3. Aplicar un cambio acotado, conservando nombres, imports ESM `.js`, excepciones, guards y patrones Prisma existentes.
4. Cubrir el caso nuevo y regresiones relevantes. Para datos de auditoría, obtener identidad del JWT y no del body.
5. Ejecutar desde `backend/` las comprobaciones aplicables: `npm run build`, `npm run test`, `npm run lint`. Ejecutar `npm run test:e2e` solo con el entorno de PostgreSQL requerido por esos casos.
6. Informar archivos/conducta cambiados, comandos y resultados, además de validaciones bloqueadas.

## Límites y cautelas

- DTO para cuerpos `POST`/`PUT`/`PATCH`; no eludir el `ValidationPipe` global.
- No poner reglas de negocio en controladores ni consultas Prisma en frontend.
- No cambiar cascadas ni borrar historial sin analizar datos y migraciones.
- Evitar `any` en producción; una excepción de tipado en un mock debe quedar aislada y justificada.
- No declarar lint o tests frontend como gates backend, ni afirmar que un e2e con DB pasó si no se ejecutó.

## Resultado esperado

Implementación compatible con el contrato existente, pruebas proporcionales al riesgo y evidencia honesta de build, tests y lint.
``