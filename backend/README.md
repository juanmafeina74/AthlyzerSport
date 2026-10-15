# Backend AthLyzer Sports Train

API NestJS 12 para la gestión deportiva de AthLyzer Sports Train. Usa Prisma 6 sobre PostgreSQL y expone todas las rutas bajo `/api`.

## Requisitos y configuración

- Node.js y npm.
- PostgreSQL accesible mediante `DATABASE_URL`.
- `backend/.env` basado en `backend/.env.example`.

Variables principales:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/athlyzer"
JWT_SECRET="una-clave-larga-y-aleatoria"
JWT_EXPIRES_IN="8h"
DEMO_ADMIN_PASSWORD="..."
DEMO_USER_PASSWORD="..."
DEMO_PLAYER_PASSWORD="..."
```

Las variables `DEMO_*` solo se usan para usuarios de demostración en entornos no productivos. Nunca se deben publicar valores reales en documentación o control de versiones.

## Comandos

Desde `backend/`:

```bash
npm install
npm run build
npm run start:dev
npm run test
npm run lint
npm run test:e2e
```

`npm run test:e2e` necesita una PostgreSQL real configurada en `DATABASE_URL`; la mayoría de los tests unitarios y de endpoints protegidos usan Prisma mockeado.

## Arranque desde la raíz

El comando recomendado es `npm start` desde la raíz. Antes de iniciar:

1. Libera los puertos 3000 y 5173 mediante `scripts/cleanup-ports.js`.
2. Regenera Prisma con `scripts/reset-prisma-client.js`.
3. Arranca Nest en modo watch y espera a `/api` antes de iniciar Vite.

El regenerador invoca el CLI JavaScript local de Prisma mediante Node. Esta decisión evita bloqueos de `npx` y problemas de quoting en Windows cuando el workspace está bajo una ruta con espacios.

Regeneración manual:

```bash
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate deploy --schema prisma/schema.prisma
```

## Arquitectura

```text
HTTP /api
  -> guards JWT y roles
  -> ValidationPipe global
  -> controller
  -> service de dominio
  -> PrismaService
  -> PostgreSQL
```

Módulos principales:

- `auth`: login, JWT, roles y seed de usuarios demo.
- `categorias`: categorías deportivas.
- `equipos`: equipos por temporada y categoría.
- `jugadores`: CRUD, ficha ampliada y fotografía.
- `jugador-equipo`: asignación y baja lógica de jugadores en plantillas.
- `posiciones`: catálogo de posiciones, posición preferida del jugador y posición asignada por pertenencia.
- `mediciones-antropometricas`: modalidades BASICA/ISAK, cálculos y auditoría del evaluador.
- `temporadas`: temporadas deportivas.
- `usuarios`: administración de usuarios y roles.
- `common`: filtro global de errores de Prisma.

## Seguridad y validación

Los endpoints protegidos usan `JwtAuthGuard` y `RolesGuard`. El `ValidationPipe` global aplica `whitelist`, `forbidNonWhitelisted`, `transform` y conversión implícita de tipos.

- Lecturas generales requieren JWT.
- Mutaciones CRUD de equipos, jugadores y temporadas requieren `admin`.
- Categorías y usuarios requieren `admin` para lectura y escritura.
- Mediciones antropométricas permiten `admin` y `usuario`.
- Subir o reemplazar la foto de un jugador requiere `admin`.
- Throttling global: 100 peticiones por minuto; login: 5 intentos por minuto.

## API principal

### Autenticación

```text
POST /api/auth/login
```

Devuelve `id_usuario`, nombre, email, rol, estado y `accessToken`. Las llamadas protegidas deben enviar `Authorization: Bearer <token>`.

### Jugadores

```text
GET    /api/jugadores
GET    /api/jugadores/:id
POST   /api/jugadores                 admin
PUT    /api/jugadores/:id             admin
DELETE /api/jugadores/:id             admin
POST   /api/jugadores/:id/foto        admin
```

`GET /api/jugadores/:id` devuelve datos personales, posición preferida, equipos actuales e históricos con sus posiciones asignadas, lesiones y las cinco mediciones antropométricas más recientes con su evaluador.

La subida de foto usa `multipart/form-data`, campo `foto`, formatos JPEG/PNG/WebP y máximo 5 MB. El archivo se guarda en `uploads/jugadores/`, servido como `/uploads/jugadores/...`; la columna `jugador.foto` solo guarda la ruta. El directorio está excluido de Git. En producción puede sustituirse por almacenamiento de objetos o CDN manteniendo el mismo contrato de URL.

### Plantillas

```text
GET    /api/equipos/:idEquipo/plantilla
GET    /api/equipos/:idEquipo/plantilla/disponibles?search=...
POST   /api/equipos/:idEquipo/plantilla                 admin
POST   /api/equipos/:idEquipo/plantilla/bulk-assign     admin
POST   /api/equipos/:idEquipo/plantilla/bulk-remove     admin
DELETE /api/equipos/:idEquipo/plantilla/:idJugador      admin
PATCH  /api/equipos/:idEquipo/plantilla/:idJugador/posicion  admin
```

Las bajas son lógicas: se conserva el histórico y una reasignación reactiva la relación existente. La alta individual acepta `id_posicion` opcional. El `PATCH` de posición recibe `{ "id_posicion": 3 }` o `{ "id_posicion": null }`, y solo modifica pertenencias activas; la respuesta incluye la posición asignada.

### Posiciones

```text
GET    /api/posiciones       cualquier usuario autenticado
POST   /api/posiciones       admin
PUT    /api/posiciones/:id   admin
DELETE /api/posiciones/:id   admin
```

El catálogo no se siembra con posiciones predeterminadas: `admin` crea sus opciones con `nombre` y `abreviatura` opcional. El borrado devuelve `409` si la posición se usa como preferida por un jugador o está asignada en alguna pertenencia. `POST` y `PUT` de jugadores aceptan `id_posicion_preferida` opcional; se puede enviar `null` en `PUT` para quitar la preferencia. Las respuestas de detalle del jugador incluyen `posicion_preferida` y cada entrada de `jugador_equipo` incluye su relación `posicion`.

### Mediciones antropométricas

```text
GET  /api/mediciones-antropometricas/jugador/:idJugador  admin, usuario
POST /api/mediciones-antropometricas                     admin, usuario
```

El `POST` devuelve `201` y recibe medidas brutas. Campos comunes:

- `id_jugador`: entero positivo obligatorio.
- `protocolo`: `BASICA` o `ISAK`, obligatorio.
- `id_equipo`: entero positivo o `null`; puede omitirse solo si el jugador no tiene pertenencias activas.
- `version_protocolo_antropometrico`: entero positivo obligatorio con equipo; no se admite sin equipo.
- `fecha`: ISO 8601 opcional; por defecto, instante del registro.
- `peso_kg`, `talla_cm`: números obligatorios, mínimo `0.1` y máximo dos decimales.
- `perimetro_cintura`: número opcional con las mismas restricciones; `observaciones`: texto opcional.

En `BASICA` no se admiten talla sentado, pliegues, otros perímetros ni diámetros. Todos los resultados derivados (sumatorias, grasa, músculo, somatotipo y somatocarta) permanecen en `null`.

En `ISAK` se exigen `pliegue_tricipital`, `pliegue_subescapular`, `pliegue_supraespinal`, `pliegue_abdominal`, `pliegue_muslo` y `pliegue_pantorrilla`, con mínimo `0.1` y máximo dos decimales. El resto de medidas ISAK conserva su carácter opcional. El servicio calcula sumatorias de seis/ocho pliegues cuando corresponde, porcentaje de grasa mediante Faulkner y componentes Heath-Carter disponibles. No calcula masa muscular.

`id_evaluador` se obtiene del JWT. El cliente no puede enviar evaluador ni resultados derivados.

Ejemplo BASICA con equipo seleccionado:

```json
{
  "id_jugador": 4,
  "id_equipo": 2,
  "protocolo": "BASICA",
  "version_protocolo_antropometrico": 1,
  "fecha": "2026-10-06T10:00:00Z",
  "peso_kg": 74.5,
  "talla_cm": 178,
  "perimetro_cintura": 80
}
```

Sin equipos activos, se omiten `id_equipo` y la versión; el evaluador elige explícitamente el protocolo. No se permite registrar como "sin equipo" una fecha cubierta por una pertenencia ya finalizada.

Con equipo, el servidor exige pertenencia activa y que sus fechas cubran el día de medición (día UTC; límites inclusivos). No se admiten registros de pertenencias finalizadas ni fechas anteriores al inicio de la pertenencia activa. Si hay varias pertenencias activas, el cliente debe seleccionar una: el servidor nunca elige la primera.

Errores aplicables: `400` para medidas/contexto/pertenencia inválidos; `404` para jugador o equipo inexistentes; `409` para modalidad/versión desactualizadas o conflicto concurrente; `401`/`403` según autenticación y roles. La comprobación y escritura se realizan en una transacción serializable, bloqueando la configuración del equipo durante el registro. Un `409` requiere recargar el contexto antes de reintentar.

Las respuestas de alta e historial incluyen `protocolo`, `id_equipo` nullable y los resultados persistidos. El historial no se recalcula ni cambia al modificar una configuración o pertenencia.

### Configuración antropométrica de equipos

`GET /api/equipos` y `GET /api/equipos/:id` incluyen `protocolo_antropometrico` y `version_protocolo_antropometrico`. El formulario debe guardar ambos valores al abrirse y enviarlos en el registro con equipo.

`POST /api/equipos` y `PUT /api/equipos/:id` admiten `protocolo_antropometrico` solo para `admin`. Los equipos nuevos usan `BASICA` por defecto. La versión es administrada por el servidor y se incrementa únicamente al cambiar de modalidad; detecta también cambios ISAK -> BASICA -> ISAK durante la captura.

`DELETE /api/equipos/:id` conserva el permiso `admin`, pero devuelve `409` para cualquier equipo existente: no se permite borrado físico. Las relaciones medición-equipo y equipo-temporada usan `Restrict` para proteger el historial de borrados indirectos. Esto no introduce una desactivación de equipos.

Compatibilidad: el consumidor frontend anterior no envía equipo ni versión y asume resultados ISAK no nulos. Requiere una adaptación separada antes de usar el contrato nuevo con jugadores en plantilla.

## Lesiones y readaptación

Los roles `admin` y `usuario` pueden usar `GET /api/lesiones` (incluye jugador), `POST /api/lesiones` (jugador, fecha de inicio, tipo, zona corporal y observaciones opcionales) y `PATCH /api/lesiones/:id/fase` con `{ "fase": "Fase 2" }`. Se aceptan `Fase 1` a `Fase 4` y `Alta Médica`; el alta solo se permite desde `Fase 4` y actualiza también `alta_medica` y `fecha_alta_real`. El frontend ofrece el mapa anatómico y el tablero en `/lesiones`.

## Prisma y modelo de datos

El esquema está en `prisma/schema.prisma`. Modelos: `rol`, `usuario`, `categoria`, `temporada`, `equipo`, `jugador`, `jugador_equipo`, `lesion`, `medicion_antropometrica` y `posicion`. `jugador.id_posicion_preferida` guarda la preferencia individual y `jugador_equipo.id_posicion` la posición principal del jugador en esa pertenencia; ambas referencias son opcionales y restringen el borrado de una posición que siga asignada.

La migración `20260922120000_mediciones_antropometricas_isak` sustituye el modelo antropométrico inicial por el protocolo ISAK completo. Si hubiera mediciones antiguas, la migración se detiene para evitar atribuir evaluadores o inventar pliegues inexistentes.

Migraciones actuales:

```text
20260910140914_init
20260910141245_init
20260914110403_auth_roles_users
20260916090000_categorias_equipos
20260922120000_mediciones_antropometricas_isak
20260930120000_lesion_readaptacion
20261006160000_protocolos_antropometricos
20261008120000_player_positions
```

La migración de protocolos inicializa equipos existentes y mediciones previas como `ISAK`; deja `id_equipo = null` en las mediciones previas, sin deducir un origen ni recalcular resultados. Los seis pliegues pasan a nullable y los equipos creados posteriormente usan `BASICA` por defecto. Aplicar mediante `npm run prisma:migrate` y regenerar el cliente con `npx prisma generate` durante el despliegue coordinado del backend.

## Calidad

Validación de referencia a 2026-09-23:

- `npm run build`: correcto.
- `npm run test`: 25 tests correctos en 8 archivos.
- `npm run lint`: correcto.
- `npm run test:e2e`: requiere PostgreSQL real para el e2e histórico; los tests protegidos mockean Prisma.

Las pruebas nuevas cubren cálculos antropométricos, persistencia del evaluador autenticado, rechazo de jugador inexistente y carga de relaciones de la ficha ampliada.

Para la validación focalizada de modalidades:

```bash
npm run test -- src/mediciones-antropometricas/mediciones-antropometricas.service.spec.ts src/equipos/equipos.service.spec.ts
npm run test:e2e -- test/protected-endpoints.e2e-spec.ts
```

La prueba real de migración es optativa y necesita PostgreSQL accesible y permisos para crear/eliminar un esquema temporal. En PowerShell:

```powershell
$env:TEST_PROTOCOL_MIGRATION = '1'
npm run test:e2e -- test/protocolos-antropometricos-migration.e2e-spec.ts
Remove-Item Env:TEST_PROTOCOL_MIGRATION
```

Aplica las migraciones en un esquema aislado con datos ficticios, verifica la conservación de registros previos y el caso del mismo jugador en dos equipos de modalidades distintas, y elimina únicamente ese esquema al finalizar. No aplica la migración en `public`.

## Pendientes conocidos

- Lesiones solo dispone de registro, listado y cambio de fase; faltan edición y eliminación.
- La masa muscular antropométrica no se calcula mientras no se definan una fórmula validada y las variables requeridas.
- No hay refresh tokens ni cookies HttpOnly; el frontend guarda el JWT en `localStorage`.
- No hay `helmet` ni CI configurado.
- Debe revisarse el resultado de `npm audit` antes de un despliegue.
