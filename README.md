# AthLyzer Sports Train

Documentacion de estado del proyecto a fecha 2026-10-08. El objetivo de este documento es que cualquier persona del equipo pueda entender que tenemos construido, como se arranca, como esta organizada la aplicacion y que puntos quedan pendientes.

> Para un analisis tecnico mas detallado (arquitectura, inventario funcional modulo a modulo, riesgos priorizados y roadmap), ver [docs/ANALISIS-PROYECTO.md](docs/ANALISIS-PROYECTO.md).

## Resumen Ejecutivo

AthLyzer Sports Train es una aplicacion web con backend NestJS y frontend React + Vite para gestionar informacion deportiva: usuarios, roles, categorías, equipos, jugadores y temporadas.

Estado actual:

- Backend API en NestJS 12 con Prisma y PostgreSQL.
- Frontend en React, Vite, React Router y Tailwind CSS.
- Autenticacion con login, contrasenas hasheadas con bcrypt y JWT.
- Autorizacion backend con `JwtAuthGuard`, decorador `@Roles(...)` y `RolesGuard`.
- Rutas CRUD protegidas por token; las mutaciones estan restringidas a rol `admin`.
- Gestion CRUD de usuarios restringida a administradores.
- Gestion CRUD de categorías deportivas y relación de cada equipo con una categoría.
- Validacion de entrada con DTOs (`class-validator`) y `ValidationPipe` global en todos los endpoints (auth, equipos, jugadores, categorías, usuarios, temporadas).
- Rate limiting con `@nestjs/throttler`: limite global de 100 peticiones/minuto por IP y limite reforzado de 5 intentos/minuto en `POST /api/auth/login`.
- Gestion de plantillas de equipo (asignar/quitar jugadores) mediante una pantalla de tipo "dual listbox" (jugadores disponibles vs. plantilla del equipo), con soporte de selección multiple y acciones en bloque.
- Ficha ampliada de jugador en `/jugadores/:id`, con acceso por doble clic sobre la card, teclado o boton visible.
- Subida de fotografia de jugador para administradores; el archivo se almacena fuera de PostgreSQL y la BD conserva solo su ruta publica.
- Captura antropométrica BASICA o ISAK según la modalidad configurada por equipo, con historial, cálculos ISAK en backend y auditoría del evaluador.
- Seguimiento de lesiones y readaptación: registro con mapa corporal, tablero por fases, altas médicas y resumen de plantilla.
- Tests de integracion (e2e) que cubren JWT/roles y rate limiting en endpoints protegidos: sin token, token invalido, rol no admin, rol admin y bloqueo por exceso de intentos de login, extendidos a equipos, jugadores, categorias, usuarios, temporadas y a los distintos casos de negocio de `auth.login`.
- Frontend con rutas privadas: si no hay usuario logado con token, redirige a `/login`.
- UI unificada alrededor de componentes `Card`, `Button`, `LinkButton`, `FormInput`, `FormSelect` y `FormTextarea`.

## Arquitectura General

El repositorio esta dividido en tres zonas principales:

```text
AthlyzerSport/
	package.json                  # Scripts raiz para arrancar backend + frontend
	README.md                     # Documentacion general del proyecto
	01_Tablas_iniciales.sql       # Script SQL inicial historico
	scripts/                      # Utilidades de arranque y limpieza
	backend/                      # API NestJS + Prisma
	frontend/                     # UI React + Vite + Tailwind
```

Flujo de alto nivel:

```text
Navegador React
	-> fetch http://localhost:3000/api/...
	-> Backend NestJS
	-> Prisma Client
	-> PostgreSQL
```

El frontend se sirve en el puerto `5173`. El backend escucha en el puerto `3000` y expone sus rutas bajo el prefijo global `/api`.

## Requisitos

- Node.js.
- npm.
- Base de datos PostgreSQL accesible desde el backend.
- Variables de entorno configuradas en `backend/.env`.

## Instalacion

Desde la raiz del workspace:

```bash
npm install
npm --prefix ./backend install
npm --prefix ./frontend install
```

Normalmente `npm install` en la raiz instala solo las dependencias del orquestador de arranque. Backend y frontend tienen sus propios `package.json`, por lo que conviene instalar sus dependencias tambien.

## Arranque Rapido

Desde la raiz del workspace:

```bash
npm start
```

El script raiz `npm start` hace lo siguiente:

1. Ejecuta `npm run cleanup` para revisar procesos escuchando en los puertos usados por la app.
2. Ejecuta `npm run prisma:reset` para borrar el cliente Prisma generado localmente y regenerarlo.
3. Levanta el backend con `npm --prefix ./backend run start:dev`.
4. Espera a que el backend responda en `http://localhost:3000/api`.
5. Levanta el frontend con `npm --prefix ./frontend run dev`.

`npm run prisma:reset` invoca el CLI JavaScript local de Prisma mediante Node, evitando problemas de `npx` y de rutas Windows con espacios. No debe ejecutarse otra instancia mientras los puertos 3000 o 5173 esten ocupados; `npm run cleanup` intenta liberar ambos puertos.

Scripts raiz disponibles:

```bash
npm run cleanup
npm run prisma:reset
npm run start:backend
npm run start:frontend
npm start
```

## Puertos

- Backend: `http://localhost:3000/api`
- Frontend: `http://localhost:5173`

En desarrollo, el backend permite CORS para Vite desde:

- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://[::1]:5173`
- `http://192.168.x.x:5173`

## Variables de Entorno

El backend carga variables con `@nestjs/config`. El fichero de ejemplo esta en `backend/.env.example`.

Crea `backend/.env` con una configuracion similar:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/athlyzer"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="8h"
DEMO_ADMIN_PASSWORD="replace-with-admin-demo-password"
DEMO_USER_PASSWORD="replace-with-user-demo-password"
DEMO_PLAYER_PASSWORD="replace-with-player-demo-password"
```

Variables principales:

- `DATABASE_URL`: cadena de conexion PostgreSQL usada por Prisma.
- `JWT_SECRET`: clave privada para firmar y verificar JWT. Debe ser larga, aleatoria y distinta por entorno.
- `JWT_EXPIRES_IN`: duracion del token. Valor por defecto: `8h`.
- `DEMO_ADMIN_PASSWORD`: password inicial del usuario demo `admin@athlyzer.local`.
- `DEMO_USER_PASSWORD`: password inicial del usuario demo `usuario@athlyzer.local`.
- `DEMO_PLAYER_PASSWORD`: password inicial del usuario demo `jugador@athlyzer.local`.

Para generar un `JWT_SECRET` aleatorio:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

No se debe subir `backend/.env` a Git.

## Backend

El backend esta en `backend/` y usa:

- NestJS 12.
- Prisma 6.
- PostgreSQL.
- bcrypt para hash de contrasenas.
- `@nestjs/jwt` para emitir y verificar JWT.
- `@nestjs/config` para cargar `.env`.
- `class-validator`, `class-transformer` y `@nestjs/mapped-types` para DTOs y `ValidationPipe` global.
- `@nestjs/throttler` para rate limiting global y por endpoint.
- Vitest para tests.
- Oxlint para lint.

Scripts del backend:

```bash
cd backend
npm run build
npm run start
npm run start:dev
npm run lint
npm run test
npm run test:e2e
```

Estructura principal del backend:

```text
backend/src/
	main.ts                         # Bootstrap Nest, prefijo /api, CORS, ValidationPipe global, seed auth
	app.module.ts                   # Modulo raiz
	auth/                           # Login, JWT, roles y seed de usuarios demo
	categorias/                     # CRUD de categorías deportivas
	common/global-exception.filter.ts
	prisma/prisma.service.ts
	equipos/                        # CRUD equipos + DTOs (create/update)
	jugadores/                      # CRUD jugadores + DTOs (create/update)
	jugador-equipo/                 # Gestion de plantilla: asignar/quitar jugadores de un equipo
	lesiones/                       # Registro y readaptacion de lesiones
	temporadas/                     # CRUD temporadas
	usuarios/                       # CRUD usuarios y consulta de roles
```

## Autenticacion y Seguridad

El login esta implementado en `backend/src/auth/auth.service.ts`.

Flujo actual:

1. El frontend envia `email` y `password` a `POST /api/auth/login`.
2. El backend busca el usuario en la tabla `usuario` por email normalizado en minusculas.
3. Si no existe, devuelve error de credenciales.
4. Si existe pero `activo = false`, devuelve error de usuario inactivo.
5. Compara la password recibida contra `usuario.password_hash` usando `bcrypt.compare`.
6. Si la password es correcta, devuelve datos de usuario y `accessToken`.

Respuesta esperada de login:

```json
{
	"id_usuario": 1,
	"nombre": "Administrador",
	"email": "admin@athlyzer.local",
	"role": "admin",
	"activo": true,
	"accessToken": "jwt..."
}
```

El frontend guarda esa respuesta en `localStorage` bajo la clave `athlyzer_user`.

Las llamadas protegidas envian el token asi:

```http
Authorization: Bearer <accessToken>
```

Piezas de seguridad implementadas:

- `backend/src/auth/jwt-auth.guard.ts`: valida que exista un Bearer token y verifica su firma.
- `backend/src/auth/roles.decorator.ts`: expone `@Roles(...)`.
- `backend/src/auth/roles.guard.ts`: comprueba si el usuario autenticado tiene uno de los roles requeridos.
- `backend/src/auth/auth.types.ts`: tipos compartidos de usuario JWT y roles.
- `backend/src/auth/jwt.config.ts`: centraliza `JWT_SECRET` y `JWT_EXPIRES_IN`.

Importante: la autorizacion real esta en backend. Los enlaces visibles u ocultos del frontend no son una barrera de seguridad suficiente.

## Usuarios, Roles y Passwords

Roles actuales:

- `admin`
- `usuario`
- `jugador`

La tabla `usuario` se valida siempre para login, tanto para usuarios demo como para usuarios reales. Para que un usuario pueda iniciar sesion debe cumplir:

- Existe en tabla `usuario`.
- Tiene `activo = true`.
- Tiene un `password_hash` bcrypt valido.
- Esta asociado a un rol existente en tabla `rol`.

Un hash bcrypt suele tener este formato:

```text
$2b$12$...
```

Para generar manualmente un hash bcrypt:

```bash
cd backend
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('TU_PASSWORD_AQUI', 12).then(console.log)"
```

Ese valor se guarda en `usuario.password_hash`.

Seed de usuarios demo:

- Vive en `backend/src/auth/auth.seed.ts`.
- Se ejecuta al arrancar el backend desde `backend/src/main.ts`.
- En produccion no crea ni actualiza usuarios demo.
- En desarrollo crea/actualiza los usuarios demo solo si existen las variables `DEMO_*`.
- Si detecta un usuario demo existente con password no-bcrypt y no hay variable `DEMO_*`, reemplaza esa password por un hash no utilizable y desactiva el usuario.

Usuarios demo gestionados por el seed:

- `admin@athlyzer.local`
- `usuario@athlyzer.local`
- `jugador@athlyzer.local`

## Autorizacion de Endpoints

Todos los controladores CRUD de equipos, jugadores y temporadas usan:

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
```

Esto implica que para acceder a esas rutas hay que estar autenticado con JWT.

Restriccion actual:

- `GET`: requiere usuario autenticado, cualquier rol.
- `POST`: requiere rol `admin`.
- `PUT`: requiere rol `admin`.
- `DELETE`: requiere rol `admin`.

Ademas, `POST` y `PUT` de equipos y jugadores validan el body contra un DTO (`class-validator`) mediante el `ValidationPipe` global configurado en `main.ts` (`whitelist`, `forbidNonWhitelisted`, `transform`). Un payload con campos faltantes, con tipos incorrectos o con propiedades no declaradas en el DTO devuelve `400 Bad Request` antes de llegar al servicio.

Endpoints principales:

```text
POST   /api/auth/login

GET    /api/categorias          admin
GET    /api/categorias/activas  admin
GET    /api/categorias/:id      admin
POST   /api/categorias          admin
PUT    /api/categorias/:id      admin
DELETE /api/categorias/:id      admin

GET    /api/usuarios          admin
GET    /api/usuarios/roles    admin
GET    /api/usuarios/:id      admin
POST   /api/usuarios          admin
PUT    /api/usuarios/:id      admin
DELETE /api/usuarios/:id      admin

GET    /api/equipos
GET    /api/equipos/:id
POST   /api/equipos        admin
PUT    /api/equipos/:id    admin
DELETE /api/equipos/:id    admin

GET    /api/jugadores
GET    /api/jugadores/:id
POST   /api/jugadores      admin
PUT    /api/jugadores/:id  admin
DELETE /api/jugadores/:id  admin
POST   /api/jugadores/:id/foto admin  # multipart field `foto`, JPEG/PNG/WebP, max. 5 MB

GET    /api/temporadas
GET    /api/temporadas/:id
POST   /api/temporadas        admin
PUT    /api/temporadas/:id    admin
DELETE /api/temporadas/:id    admin

GET    /api/equipos/:idEquipo/plantilla                 # jugadores activos en el equipo
GET    /api/equipos/:idEquipo/plantilla/disponibles     # jugadores libres (filtrable por ?search=)
POST   /api/equipos/:idEquipo/plantilla                 admin  # asigna un jugador { id_jugador, dorsal? }
POST   /api/equipos/:idEquipo/plantilla/bulk-assign     admin  # asigna varios { id_jugadores: number[] }
POST   /api/equipos/:idEquipo/plantilla/bulk-remove     admin  # quita varios { id_jugadores: number[] }
DELETE /api/equipos/:idEquipo/plantilla/:idJugador      admin  # quita un jugador
PATCH  /api/equipos/:idEquipo/plantilla/:idJugador/posicion admin  # asigna o limpia la posición del jugador en el equipo

GET    /api/mediciones-antropometricas/jugador/:idJugador  admin, usuario
POST   /api/mediciones-antropometricas                       admin, usuario

GET    /api/lesiones                    admin, usuario
POST   /api/lesiones                    admin, usuario
PATCH  /api/lesiones/:id/fase           admin, usuario

GET    /api/posiciones                  cualquier usuario autenticado
POST   /api/posiciones                  admin
PUT    /api/posiciones/:id              admin
DELETE /api/posiciones/:id              admin
```

Los equipos exponen `protocolo_antropometrico` y `version_protocolo_antropometrico`. Solo `admin` puede configurar la modalidad. Los equipos existentes se migraron como ISAK y los nuevos usan BASICA por defecto. Con pertenencias activas se selecciona explícitamente el equipo; sin ellas se elige el protocolo y el registro queda sin equipo. El historial conserva el protocolo y el equipo de origen.

## Validacion de Datos (DTOs)

Todos los endpoints de creación y actualización usan DTOs tipados con `class-validator` en lugar de `data: any`:

- `backend/src/auth/dto/login.dto.ts`.
- `backend/src/equipos/dto/create-equipo.dto.ts` y `update-equipo.dto.ts`.
- `backend/src/jugadores/dto/create-jugador.dto.ts` y `update-jugador.dto.ts`.
- `backend/src/categorias/dto/create-categoria.dto.ts` y `update-categoria.dto.ts`.
- `backend/src/usuarios/dto/create-usuario.dto.ts` y `update-usuario.dto.ts`.
- `backend/src/temporadas/dto/create-temporada.dto.ts` y `update-temporada.dto.ts`.

Los DTOs de actualización se generan con `PartialType` de `@nestjs/mapped-types` a partir del DTO de creación, de forma que todos los campos son opcionales en `PUT` pero mantienen las mismas reglas de validación si se envían.

El `ValidationPipe` global (`backend/src/main.ts`) aplica a toda la aplicación:

- `whitelist: true`: elimina propiedades no declaradas en el DTO.
- `forbidNonWhitelisted: true`: rechaza la petición con `400` si llegan propiedades no declaradas, en vez de ignorarlas silenciosamente.
- `transform: true`: convierte el payload plano en una instancia de la clase DTO antes de llegar al controlador.

## Rate Limiting

El backend usa `@nestjs/throttler` para mitigar fuerza bruta y abuso:

- Límite global: 100 peticiones/minuto por IP, aplicado con un `ThrottlerGuard` registrado como `APP_GUARD` en `backend/src/app.module.ts`.
- Límite reforzado en `POST /api/auth/login`: 5 intentos/minuto por IP mediante `@Throttle({ default: { limit: 5, ttl: 60_000 } })` en `auth.controller.ts`.
- Al superar el límite, el endpoint responde `429 Too Many Requests`.

## Base de Datos

El modelo Prisma esta en `backend/prisma/schema.prisma`.

Datasource:

- PostgreSQL.
- Conexion mediante `DATABASE_URL`.

Modelos definidos actualmente:

- `rol`: roles de usuario.
- `usuario`: usuarios con email, hash de password, rol y estado activo.
- `categoria`: categorías deportivas con identificador, nombre único y estado activo.
- `temporada`: temporadas deportivas.
- `equipo`: equipos asociados a una temporada y, opcionalmente, a una categoría mediante `id_categoria`.
- `jugador`: jugadores con DNI, nombre, apellidos, fecha de nacimiento, foto y posición preferida opcional.
- `jugador_equipo`: relación histórica jugador-equipo con fechas, dorsal, posición principal opcional y estado activo.
- `lesion`: jugador, fecha de inicio y fin, tipo, zona corporal, gravedad, fase de readaptación, alta médica, observaciones y fecha de alta real.
- `medicion_antropometrica`: modalidades BASICA/ISAK, medidas comunes, resultados derivados nullable según modalidad, equipo de origen opcional, evaluador y marcas de auditoria.
- `posicion`: catálogo para la preferencia del jugador y la posición principal en cada pertenencia.

Migraciones Prisma existentes:

```text
backend/prisma/migrations/
	20260910140914_init/
	20260910141245_init/
	20260914110403_auth_roles_users/
	20260916090000_categorias_equipos/
	20260922120000_mediciones_antropometricas_isak/
	20260930120000_lesion_readaptacion/
	20261006160000_protocolos_antropometricos/
	20261008120000_player_positions/
```

## Frontend

El frontend esta en `frontend/` y usa:

- React.
- React DOM.
- React Router DOM.
- Vite.
- Tailwind CSS.
- TypeScript.

Scripts del frontend:

```bash
cd frontend
npm run dev
npm run build
npm run preview
```

Estructura principal:

```text
frontend/src/
	main.tsx
	router.tsx
	AdminPage.tsx
	DashboardPage.tsx
	components/
		auth/LoginPage.tsx
		layout/Header.tsx
		layout/Layout.tsx
		layout/Sidebar.tsx
		services/
		ui/
		equipos/
		jugadores/
		mediciones-antropometricas/
		lesiones/
		temporadas/
```

## Rutas Frontend

El router esta en `frontend/src/router.tsx`.

Comportamiento actual:

- `/` redirige a `/login`.
- `/login` muestra el formulario de inicio de sesion.
- Las rutas privadas usan `RequireAuth`.
- Si no existe `athlyzer_user` en `localStorage` o no tiene `accessToken`, se redirige a `/login`.
- Si `athlyzer_user` tiene JSON corrupto, se borra y se redirige a `/login`.
- Las rutas desconocidas redirigen a `/login` si no hay sesion, o a `/dashboard` si hay sesion.

Rutas actuales:

```text
/login
/
/dashboard
/admin
/categorias
/categorias/crear
/categorias/editar/:id
/categorias/borrar/:id
/posiciones
/usuarios
/usuarios/crear
/usuarios/editar/:id
/usuarios/borrar/:id
/equipos
/equipos/crear
/equipos/editar/:id
/equipos/borrar/:id
/jugadores
/jugadores/crear
/jugadores/editar/:id
/jugadores/borrar/:id
/jugadores/:id
/mediciones-antropometricas/crear
/lesiones
/temporadas
/temporadas/crear
/temporadas/editar/:id
/temporadas/borrar/:id
```

## Servicios Frontend

Los servicios estan en `frontend/src/components/services/`.

- `auth.service.ts`: login, tipo `AuthUser` y helper `authHeaders()`.
- `categorias.service.ts`: llamadas a `/api/categorias` y `/api/categorias/activas`.
- `usuarios.service.ts`: llamadas a `/api/usuarios` y `/api/usuarios/roles`.
- `equipos.service.ts`: llamadas a `/api/equipos`.
- `jugadores.service.ts`: llamadas a `/api/jugadores`, detalle ampliado y subida de foto.
- `posiciones.service.ts`: catálogo CRUD disponible para la selección de posiciones.
- `medicionesAntropometricas.service.ts`: historial y creación de mediciones BASICA/ISAK.
- `lesiones.service.ts`: listado, alta y actualización de fase de lesiones.
- `temporadas.service.ts`: llamadas a `/api/temporadas`.

Los servicios CRUD adjuntan `Authorization: Bearer ...` usando el token guardado en `localStorage`.

## UI y Estilos

Tailwind se configura en `frontend/tailwind.config.js`.

Tokens principales:

- `brand.dark`: sidebar oscuro.
- `brand.light`: fondo general.
- `brand.primary`: azul principal.
- `brand.secondary`: azul secundario `#1e40af`.
- `brand.accent`: azul informativo `#3b82f6`.
- `panel.bg`: fondo de cards.
- `panel.border`: borde de paneles.
- `alert.info`, `alert.warning`, `alert.danger`: fondos de aviso.
- `status.active`, `status.clear`, `status.pending`, `status.info`: estados médicos y de interfaz.

Componentes UI base:

- `Card`: tarjeta blanca con borde, sombra y espaciado.
- `Button`: boton reutilizable con variantes `primary`, `dark`, `light`, `danger`, `blue`, `black`.
- `LinkButton`: enlace con apariencia de boton, usado para navegacion.
- `FormInput`: input con label y estilos consistentes.
- `FormSelect`: select con label y estilos consistentes.
- `FormTextarea`: textarea con label y estilos consistentes.

Pantallas ya alineadas con este sistema:

- Login.
- Dashboard.
- Administracion.
- Listar, crear, editar y borrar categorías.
- Listar, crear, editar y borrar usuarios.
- Listas de equipos, jugadores y temporadas.
- Crear, editar y borrar equipos.
- Crear, editar y borrar jugadores.
- Ficha ampliada de jugador con doble clic, teclado o boton visible.
- Subida de foto desde la ficha para administradores; JPEG, PNG y WebP hasta 5 MB.
- Crear, editar y borrar temporadas.
- Captura BASICA en dos pasos (contexto y medidas básicas) o ISAK en cuatro pasos; el formulario elige los campos y resultados según equipo y modalidad.
- Tablero de lesiones y readaptación con cuatro fases, alta médica y mapa corporal anterior/posterior.

## Validacion Ejecutada

Validaciones ejecutadas durante la revisión del 2026-10-06:

```bash
cd backend
npm run build
npm run test
npm run lint

cd ../frontend
npm run build
```

Resultado conocido:

- Backend build: correcto.
- Backend tests: correcto, 53 tests pasan en 10 archivos, incluyendo protocolos BASICA/ISAK, cálculos, pertenencias y configuración de equipos.
- Backend lint: correcto.
- Frontend build: correcto.
- Backend e2e protegido: correcto, 51 tests pasan con Prisma mock; no requieren PostgreSQL.

La prueba específica `backend/test/protocolos-antropometricos-migration.e2e-spec.ts` verifica la migración en un esquema PostgreSQL aislado; requiere `DATABASE_URL` y activación explícita con `TEST_PROTOCOL_MIGRATION=1`. No se ejecutó en la revisión indicada. No hay tests automatizados de frontend.

## Gestion de Usuarios

La gestion de usuarios esta disponible desde la pantalla de administracion mediante una card llamada `Usuarios`.

Acceso:

- Solo usuarios autenticados con rol `admin` pueden entrar en `/admin` y `/usuarios` desde el frontend.
- El backend tambien exige rol `admin` en todos los endpoints `/api/usuarios`.

La lista de usuarios muestra:

- Nombre.
- Email.
- Rol.
- Estado.

El estado se muestra con una etiqueta visual:

- `Activo`: verde claro.
- `Inactivo`: rojo claro.

Operaciones disponibles:

- Crear usuario con nombre, email, password, rol y estado.
- Editar usuario con nombre, email, rol y estado.
- Cambiar password desde edicion solo si se informa una nueva password.
- Eliminar usuario.

## Gestion de Categorías

La gestión de categorías está disponible en el menú lateral para administradores, entre `Equipos` y `Jugadores`.

Cada categoría tiene:

- `id_categoria`: identificador autogenerado.
- `nombre`: nombre único de categoría.
- `activo`: estado activo o inactivo.

El listado muestra el ID, nombre y una etiqueta de estado verde claro para categorías activas o rojo claro para inactivas.

Las categorías activas se cargan en el selector de categoría al crear o editar un equipo. La categoría es opcional para un equipo. No es posible eliminar una categoría que esté asignada a uno o más equipos; primero debe reasignarse o quitarse de esos equipos.

De la misma manera, tampoco es posible eliminar una temporada que tenga equipos asociados: `DELETE /api/temporadas/:id` responde con un error `400` indicando que primero hay que eliminar o reasignar sus equipos, evitando que el borrado en cascada a nivel de base de datos (`onDelete: Cascade` en `equipo.id_temporada`) ocurra sin aviso previo desde la API.

## Gestion de Plantillas (Jugadores por Equipo)

Desde el listado de equipos, el botón "Plantilla" abre `/equipos/plantilla/:id`, una pantalla de tipo **dual listbox / transfer list**:

- Columna izquierda: jugadores disponibles (sin relación activa con el equipo), filtrables por nombre, apellidos o DNI mediante un buscador de texto libre.
- Columna derecha: la plantilla actual del equipo (jugadores con relación `jugador_equipo` activa), mostrando su dorsal si tiene uno asignado.
- Cada columna permite selección individual o multiple (Ctrl/Cmd + clic, Mayús + clic), y los botones "Añadir →" / "← Quitar" mueven en bloque los seleccionados de una columna a otra.

A nivel de datos, "mover" un jugador no lo borra fisicamente: la tabla `jugador_equipo` usa un patron de borrado logico (`activo`, `fecha_inicio`, `fecha_fin`), por lo que quitar un jugador desactiva su relacion (conservando el historico) y volver a añadirlo reactiva la relacion existente en lugar de duplicarla.

Endpoints usados (ver sección "Autorizacion de Endpoints"): lectura disponible para cualquier rol autenticado; asignar/quitar (individual o en bloque) requiere rol `admin`.

Limitación conocida: el filtro de jugadores disponibles solo es por texto (nombre/apellidos/DNI); no existe relación jugador-categoría.

Aviso no bloqueante observado: Vitest muestra una recomendacion relacionada con `vite-tsconfig-paths`, indicando que Vite ya soporta resolucion nativa de paths mediante `resolve.tsconfigPaths`.

## Ficha Ampliada de Jugador

Desde `/jugadores`, una card se puede abrir con doble clic, con la tecla `Enter` cuando tiene el foco o mediante el boton `Ficha`. La pantalla `/jugadores/:id` muestra en una sola vista:

- Datos personales, DNI, fecha de nacimiento, edad y estado deportivo.
- Equipo o equipos activos, dorsal, categoría y temporada.
- Posición preferida del jugador y posición asignada en cada pertenencia.
- Histórico de equipos con fechas de pertenencia.
- Última medición antropométrica y hasta cuatro mediciones anteriores.
- Lesiones registradas y número de lesiones activas.

El endpoint `GET /api/jugadores/:id` carga estas relaciones en una sola consulta Prisma, ordena equipos y lesiones por fecha y limita a cinco las mediciones más recientes.

La posición preferida se edita en el alta/edición del jugador y aparece en su ficha. La plantilla de cada equipo muestra esa preferencia y permite a `admin` asignar una posición principal distinta para esa pertenencia. El catálogo se crea y mantiene desde `/posiciones`, disponible para `admin`.

### Fotografías

La columna `jugador.foto` almacena una URL o ruta, no el binario de la imagen. La subida se realiza con `POST /api/jugadores/:id/foto` usando `multipart/form-data` y el campo `foto`:

- Solo disponible para administradores.
- Acepta JPEG, PNG y WebP.
- Limite de 5 MB por archivo.
- Los archivos locales se guardan en `backend/uploads/jugadores/`, servido como `/uploads/jugadores/...` y excluido de Git.
- Al sustituir o eliminar un jugador, se intenta eliminar el archivo local anterior.

En producción, el mismo contrato puede conectarse a almacenamiento de objetos o CDN guardando en `jugador.foto` únicamente la URL resultante.

## Lesiones y Readaptación

Los roles `admin` y `usuario` pueden consultar y registrar lesiones, y cambiar su fase de readaptación. La API expone:

```text
GET    /api/lesiones
POST   /api/lesiones
PATCH  /api/lesiones/:id/fase
```

El registro requiere jugador, fecha de inicio, tipo de lesión y zona corporal; las observaciones son opcionales. Cada lesión nueva empieza en `Fase 1`. Se pueden asignar las fases `Fase 1` a `Fase 4`; el alta médica solo se permite desde `Fase 4` y es irreversible desde la API. No hay endpoints para editar el resto de los datos ni eliminar lesiones.

La pantalla `/lesiones` ofrece un mapa corporal con vistas anterior y posterior para seleccionar la zona, columnas para las cuatro fases y cambio de fase mediante selector o arrastre. Las lesiones dadas de alta aparecen en una sección separada. El dashboard resume las lesiones activas de la plantilla del equipo seleccionado y ofrece el acceso al registro. La ficha `/jugadores/:id` muestra el estado de lesiones activas y hasta cuatro registros.

**Alcance de acceso:** `GET /api/lesiones` devuelve el listado global, incluyendo datos del jugador, a cualquier usuario con rol `admin` o `usuario`; la API no filtra por equipo. El dashboard filtra localmente según la plantilla seleccionada, pero eso no restringe las respuestas del backend. La aplicación tampoco tiene aislamiento por club o tenant, por lo que debe considerarse una limitación de privacidad pendiente.

## Mediciones Antropométricas BASICA e ISAK

La ruta `/mediciones-antropometricas/crear` está disponible para roles `admin` y `usuario`. El formulario carga las pertenencias del jugador. Si tiene equipos activos, la persona evaluadora selecciona el equipo y se aplica su modalidad; no se elige automáticamente entre equipos. Si no tiene pertenencias activas, se puede seleccionar una modalidad y registrar sin equipo. La fecha debe ser compatible con el período de pertenencia.

**BASICA** usa dos pasos: contexto (jugador, fecha, peso y talla) y medidas básicas (cintura y observaciones opcionales). No calcula grasa, músculo, sumatorias ni somatotipo. El frontend muestra IMC como referencia, no como diagnóstico.

**ISAK** conserva cuatro pasos: contexto, pliegues (seis obligatorios y dos opcionales), perímetros/diámetros y revisión con composición corporal, somatotipo Heath-Carter y somatocarta cuando hay datos suficientes. El backend calcula los resultados; la masa muscular permanece sin calcular al no existir fórmula validada y variables suficientes.

La modalidad se configura en la edición de equipo y solo `admin` puede cambiarla. Los equipos nuevos usan BASICA por defecto; los existentes se inicializaron como ISAK. La versión de configuración detecta cambios ocurridos durante una captura y permite responder con conflicto para recargar el contexto. Cada medición guarda el protocolo y equipo de origen, de modo que reconfigurar un equipo no altera el historial. Las mediciones previas se conservan como ISAK sin atribuirles equipo ni recalcularlas.

El evaluador se toma del JWT y nunca del body. Para los detalles de DTO, rutas, validaciones y códigos de error, consultar [backend/README.md](backend/README.md).

## Problemas Resueltos Recientemente

### Passwords en Texto Plano

Antes el login comparaba `usuario.password_hash` directamente contra la password recibida y el seed creaba passwords demo triviales. Ahora:

- Se usa `bcrypt.compare` en login.
- El seed usa `bcrypt.hash`.
- Las passwords demo salen de variables de entorno.
- En produccion no se crean usuarios demo.

### Falta de Autenticacion Persistente

Antes el login devolvia solo datos de usuario. Ahora devuelve un JWT en `accessToken`.

### Falta de Autorizacion Backend

Antes los CRUD no tenian guards. Ahora equipos, jugadores y temporadas requieren JWT, y las mutaciones requieren rol `admin`.

### Redireccion a Login

Antes `/` abria directamente el dashboard y una URL privada podia renderizar sin usuario. Ahora `/` redirige a `/login` y las rutas privadas pasan por `RequireAuth`.

### Estilos UI Inconsistentes

Antes algunas pantallas tenian HTML basico sin estilos. Ahora las listas, ediciones, borrados, login, administracion y dashboard usan componentes UI compartidos.

## Como Probar el Login

1. Configurar `backend/.env` con `DATABASE_URL`, `JWT_SECRET` y, si se quiere usar el admin demo, `DEMO_ADMIN_PASSWORD`.
2. Arrancar la aplicacion:

```bash
npm start
```

3. Abrir:

```text
http://localhost:5173/login
```

4. Iniciar sesion con un usuario que exista en tabla `usuario`, este activo y tenga `password_hash` bcrypt valido.

Si aparece `Failed to fetch`, normalmente indica que el navegador no puede conectar con el backend o que CORS esta bloqueando la llamada. Revisar:

- Backend arrancado en `http://localhost:3000/api`.
- Frontend servido desde una URL permitida por CORS.
- Consola del navegador.
- Terminal del backend.

Si aparece `Credenciales no validas`, el backend ha respondido correctamente y el problema suele estar en email/password/hash.

Si aparece `El usuario esta inactivo`, el usuario existe pero tiene `activo = false`.

## Pendientes y Riesgos Conocidos
- No hay refresh tokens; cuando caduque el JWT, el usuario debe iniciar sesion de nuevo.
- El token se guarda en `localStorage`; es simple para desarrollo, pero para produccion conviene valorar cookies `HttpOnly` seguras o una estrategia mas robusta.
- npm reporto vulnerabilidades tras instalar dependencias; conviene revisar con `npm audit` por carpeta.
- Las rutas de administracion en frontend no comprueban rol por si solas; la proteccion fuerte esta en backend.
- Los botones de planes en administracion apuntan actualmente a `/dashboard`; las funcionalidades de planes aun no estan implementadas.
- No hay cabeceras de seguridad HTTP adicionales (`helmet`) ni limites explicitos de tamano de payload.

## Siguiente Paso Recomendado

El siguiente bloque tecnico recomendable es:

- **Configurar CI** (build + test + lint de backend y build de frontend) en cada PR/push a la rama principal.
- Revisar y resolver las vulnerabilidades reportadas por `npm audit` en backend y frontend.
