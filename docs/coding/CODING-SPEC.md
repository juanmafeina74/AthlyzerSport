# AthLyzer Sports Train: especificación de codificación

Estado: documento de referencia previo a la futura configuración de agentes.
Fecha de revisión: 2026-10-06.

## Fuente de verdad y alcance

Seguir primero el patrón del módulo o componente más cercano. Las versiones instaladas y los comandos válidos son los declarados en los `package.json` y lockfiles del directorio correspondiente. Backend usa NestJS 12, TypeScript, Prisma 6, PostgreSQL, Vitest y Oxlint; frontend usa React, TypeScript, Vite y Tailwind. Algunas dependencias frontend declaran `latest`, por lo que esta especificación no fija una versión que el manifiesto no fija.

El TypeScript del backend se ejecuta como ESM y sus imports relativos llevan sufijo `.js`. Mantener esa convención en archivos TypeScript backend.

## Principios

- Resolver el requisito con el cambio más pequeño que mantenga el comportamiento existente.
- Reutilizar helpers, componentes, servicios y tipos cercanos antes de crear duplicados.
- Mantener separadas las responsabilidades de HTTP, reglas de negocio, persistencia y UI.
- No agregar una dependencia o abstracción sin una necesidad concreta.
- Mantener nombres del dominio existente (actualmente español en módulos y modelo) y evitar renombrados amplios no solicitados.

## Backend NestJS

### Controladores y validación

- Los controladores reciben y transforman la entrada HTTP, aplican pipes/parsers de parámetros, invocan servicios y devuelven su resultado.
- No poner reglas de negocio ni consultas Prisma en controladores.
- Los cuerpos de `POST`, `PUT` y `PATCH` deben usar DTOs cuando acepten datos. Definir restricciones con `class-validator`; `class-transformer` y la conversión implícita se configuran globalmente.
- El `ValidationPipe` global activa `whitelist`, `forbidNonWhitelisted`, `transform` y `enableImplicitConversion`. No aceptar payloads sin validar ni duplicar validación manual que ya pertenezca al DTO.
- Usar pipes como `ParseIntPipe` para parámetros numéricos, siguiendo controladores vecinos.
- Los `POST` responden `201` por defecto en Nest salvo que el endpoint declare otro status. Los tests y clientes deben respetar el contrato real.

### Servicios y errores

- Los servicios concentran reglas funcionales y acceso a datos mediante `PrismaService`.
- Usar excepciones HTTP de Nest coherentes con el caso (por ejemplo, recurso inexistente, conflicto o regla de negocio inválida) y conservar el filtro global.
- Verificar errores de persistencia y restricciones únicas en el módulo vecino antes de definir una traducción nueva.
- El servicio debe recibir identidad/permisos desde el contexto autenticado cuando sean datos de auditoría; no confiar en el body.

### Prisma y persistencia

- `backend/prisma/schema.prisma` y las migraciones versionadas son la fuente del modelo.
- Crear una migración para cambios de esquema; revisar su efecto sobre datos existentes, relaciones, índices, unicidad y `onDelete`.
- No introducir borrados físicos donde haya historial requerido. Para jugador-equipo se conserva la fila y se modifica su estado.
- Al actualizar modelos con relaciones y asignar claves foráneas escalares, seguir el patrón Prisma del módulo (puede requerirse `Prisma.<modelo>UncheckedUpdateInput`).
- Evitar SQL crudo; si Prisma no puede expresar una operación necesaria, justificarla y parametrizar todos sus valores.
- No añadir campos de auditoría a todas las tablas por defecto: el esquema actual no implementa auditoría genérica.

### Tipos y nombres

- Mantener el modo `strict` que declara el proyecto y tipar contratos, parámetros y resultados cuando aporte claridad.
- Evitar `any` en código de producción. Preferir `unknown` con narrowing cuando el tipo externo no esté conocido; una excepción en mocks/tests debe quedar acotada y seguir los tests existentes.
- Clases/componentes React: `PascalCase`; variables y funciones: `camelCase`; DTOs: nombres de clase `PascalCase` (`Create...Dto`, `Update...Dto`).
- Conservar nombres de archivos y sufijos del módulo existente, por ejemplo `<feature>.controller.ts`, `<feature>.service.ts` y `<feature>.service.spec.ts`.

## Frontend React

- Reutilizar `Card`, `Button`, `LinkButton`, `FormInput`, `FormSelect` y `FormTextarea` cuando sean adecuados; consultar además [ADR-008](../adr/ADR-008-react-ui-consistency.md).
- Mantener estilos, tokens, navegación y composición coherentes con las pantallas existentes. No modificar estilos globales por una necesidad local.
- Mantener el estado local simple; no duplicar estado derivable.
- Las llamadas API deben reutilizar los servicios y headers de autenticación existentes. Comprobar `response.ok` antes de navegar como si una operación hubiera concluido y presentar errores de forma visible según el patrón de la pantalla vecina.
- En selects controlados alimentados por listas dinámicas, incluir una opción placeholder si el estado inicial puede ser vacío.
- Las comprobaciones de permisos en frontend mejoran la navegación, pero nunca sustituyen los guards backend.
- Mantener accesibilidad de teclado, foco y etiquetas de formularios.

## Calidad de cambio

Cada funcionalidad debe incluir pruebas apropiadas al riesgo y documentación del contrato o regla nueva cuando corresponda. Cada bug debe tener una prueba de regresión cuando el comportamiento pueda probarse automáticamente. No exigir la creación de DTO, componente, migración o documento si el cambio no lo necesita.