# AthLyzer Sports Train: especificación de arquitectura

Estado: documento de referencia previo a la futura configuración de agentes.
Fecha de revisión: 2026-10-08.

## Topología actual

```text
Navegador
	React + Vite
			| fetch + Authorization: Bearer <JWT>
			v
	NestJS /api
			| guards, DTOs y servicios
			v
	Prisma Client
			v
	PostgreSQL
```

El backend sirve también los archivos de `uploads/` bajo `/uploads/`. El frontend usa actualmente una URL local de API en sus servicios; la configuración por entorno está pendiente y no debe darse por existente.

## Flujo backend

1. El `ThrottlerGuard` global limita peticiones.
2. Los guards declarados en el controlador validan JWT y, cuando corresponde, roles.
3. El `ValidationPipe` global transforma y valida DTOs, elimina campos no permitidos y rechaza propiedades desconocidas.
4. El controlador adapta la petición HTTP y delega la operación.
5. El servicio aplica reglas de negocio y usa `PrismaService`.
6. PostgreSQL aplica persistencia y restricciones relacionales. El filtro global normaliza errores HTTP.

Controladores y DTOs son la frontera HTTP; los servicios son propietarios de las reglas de negocio. No introducir una capa repository, CQRS u otra arquitectura alternativa salvo que un problema concreto y una decisión aprobada lo justifiquen.

## Módulos backend actuales

Registrados en `backend/src/app.module.ts`: `auth`, `usuarios`, `categorias`, `equipos`, `jugadores`, `jugador-equipo`, `posiciones`, `temporadas`, `lesiones` y `mediciones-antropometricas`.

`posicion` dispone de catálogo API, relación opcional como preferencia del jugador y relación opcional con cada pertenencia jugador-equipo. La UI permite mantener el catálogo desde Administración, editar la preferencia en el jugador y asignar la posición principal desde la plantilla. Lesiones dispone de consulta, alta y cambio de fase; no asumir operaciones de CRUD no implementadas.

## Convención de módulos

Antes de crear o reorganizar un módulo, inspeccionar un módulo vecino y mantener el patrón existente:

```text
backend/src/<feature>/
	<feature>.module.ts
	<feature>.controller.ts
	<feature>.service.ts
	dto/
	<feature>.service.spec.ts
```

No todos los módulos requieren exactamente los mismos DTOs o pruebas. Registrar el módulo nuevo en `AppModule` cuando corresponda y conservar imports relativos con sufijo `.js`, según el modo ESM usado por el backend.

## Frontend

La aplicación usa React, React Router, Vite y Tailwind. Las rutas, guards visuales, componentes compartidos y servicios API se encuentran en `frontend/src/`. La UI organiza la experiencia, pero no es una frontera de autorización. Las llamadas protegidas deben seguir usando el servicio y los headers de autenticación existentes.

Para cambios visuales, consultar [ADR-008](../adr/ADR-008-react-ui-consistency.md) y los componentes base existentes antes de crear variantes.

## API y datos

- El prefijo global actual es `/api`; seguir rutas y respuestas REST consistentes con los controladores vecinos.
- `schema.prisma` es la fuente del modelo persistente y `backend/prisma/migrations/` conserva su evolución.
- Un cambio de esquema requiere migración Prisma revisable. No editar el cliente generado como sustituto del esquema/migración.
- Revisar relaciones, índices, unicidad, valores opcionales y acciones `onDelete`. Una cascada puede borrar datos históricos; mantener las protecciones de negocio existentes.
- Las pertenencias jugador-equipo usan baja lógica e historial. No sustituir por borrado físico sin requisito y decisión explícitos.
- No existe auditoría genérica ni partición multi-club. No asumirlas como capacidades arquitectónicas ya disponibles.

## Decisiones operativas relevantes

- La configuración de `ValidationPipe`, el filtro de excepciones, el prefijo, CORS de desarrollo y los recursos estáticos se establecen en `backend/src/main.ts`.
- El throttling global se registra en `AppModule`; el login tiene un límite más estricto en su endpoint.
- El almacenamiento de fotografías es local al backend. Para despliegue con varias réplicas hace falta una decisión de almacenamiento compartido.
- Los resultados ISAK se calculan en backend al registrar la medición; BASICA no calcula resultados derivados. El protocolo y el equipo de origen se persisten en la medición y no se reinterpretan ni recalculan al cambiar la configuración del equipo.

## Regla de evolución

Las decisiones transversales (modelo, auth, contrato API, almacenamiento o infraestructura) deben explicitar impacto y alternativa. Para cambios locales basta con seguir la implementación vecina; no exigir diagramas o rediseños amplios por defecto.