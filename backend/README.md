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
- `mediciones-antropometricas`: protocolo ISAK, cálculos y auditoría del evaluador.
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

`GET /api/jugadores/:id` devuelve datos personales, equipos actuales e históricos, lesiones y las cinco mediciones antropométricas más recientes con su evaluador.

La subida de foto usa `multipart/form-data`, campo `foto`, formatos JPEG/PNG/WebP y máximo 5 MB. El archivo se guarda en `uploads/jugadores/`, servido como `/uploads/jugadores/...`; la columna `jugador.foto` solo guarda la ruta. El directorio está excluido de Git. En producción puede sustituirse por almacenamiento de objetos o CDN manteniendo el mismo contrato de URL.

### Plantillas

```text
GET    /api/equipos/:idEquipo/plantilla
GET    /api/equipos/:idEquipo/plantilla/disponibles?search=...
POST   /api/equipos/:idEquipo/plantilla                 admin
POST   /api/equipos/:idEquipo/plantilla/bulk-assign     admin
POST   /api/equipos/:idEquipo/plantilla/bulk-remove     admin
DELETE /api/equipos/:idEquipo/plantilla/:idJugador      admin
```

Las bajas son lógicas: se conserva el histórico y una reasignación reactiva la relación existente.

### Mediciones antropométricas

```text
GET  /api/mediciones-antropometricas/jugador/:idJugador  admin, usuario
POST /api/mediciones-antropometricas                     admin, usuario
```

El `POST` recibe datos brutos del protocolo ISAK. El servicio calcula y persiste sumatoria de seis/ocho pliegues cuando corresponde, porcentaje de grasa mediante Faulkner y componentes Heath-Carter disponibles. `id_evaluador` se obtiene de `request.user.id_usuario`, no del body.

## Prisma y modelo de datos

El esquema está en `prisma/schema.prisma`. Modelos: `rol`, `usuario`, `categoria`, `temporada`, `equipo`, `jugador`, `jugador_equipo`, `lesion`, `medicion_antropometrica` y `posicion`.

La migración `20260922120000_mediciones_antropometricas_isak` sustituye el modelo antropométrico inicial por el protocolo ISAK completo. Si hubiera mediciones antiguas, la migración se detiene para evitar atribuir evaluadores o inventar pliegues inexistentes.

Migraciones actuales:

```text
20260910140914_init
20260910141245_init
20260914110403_auth_roles_users
20260916090000_categorias_equipos
20260922120000_mediciones_antropometricas_isak
```

## Calidad

Validación de referencia a 2026-09-23:

- `npm run build`: correcto.
- `npm run test`: 25 tests correctos en 8 archivos.
- `npm run lint`: correcto.
- `npm run test:e2e`: requiere PostgreSQL real para el e2e histórico; los tests protegidos mockean Prisma.

Las pruebas nuevas cubren cálculos antropométricos, persistencia del evaluador autenticado, rechazo de jugador inexistente y carga de relaciones de la ficha ampliada.

## Pendientes conocidos

- No existe todavía CRUD de lesiones ni relación entre jugador y posición.
- La masa muscular antropométrica no se calcula mientras no se definan una fórmula validada y las variables requeridas.
- No hay refresh tokens ni cookies HttpOnly; el frontend guarda el JWT en `localStorage`.
- No hay `helmet` ni CI configurado.
- Debe revisarse el resultado de `npm audit` antes de un despliegue.
