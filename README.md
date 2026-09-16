# AthLyzer Sports Train

Documentacion de estado del proyecto a fecha 2026-09-15. El objetivo de este documento es que cualquier persona del equipo pueda entender que tenemos construido, como se arranca, como esta organizada la aplicacion y que puntos quedan pendientes.

## Resumen Ejecutivo

AthLyzer Sports Train es una aplicacion web con backend NestJS y frontend React + Vite para gestionar informacion deportiva: usuarios, roles, equipos, jugadores y temporadas.

Estado actual:

- Backend API en NestJS 12 con Prisma y PostgreSQL.
- Frontend en React, Vite, React Router y Tailwind CSS.
- Autenticacion con login, contrasenas hasheadas con bcrypt y JWT.
- Autorizacion backend con `JwtAuthGuard`, decorador `@Roles(...)` y `RolesGuard`.
- Rutas CRUD protegidas por token; las mutaciones estan restringidas a rol `admin`.
- Gestion CRUD de usuarios restringida a administradores.
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
	main.ts                         # Bootstrap Nest, prefijo /api, CORS, seed auth
	app.module.ts                   # Modulo raiz
	auth/                           # Login, JWT, roles y seed de usuarios demo
	common/global-exception.filter.ts
	prisma/prisma.service.ts
	equipos/                        # CRUD equipos
	jugadores/                      # CRUD jugadores
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

Endpoints principales:

```text
POST   /api/auth/login

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

GET    /api/temporadas
GET    /api/temporadas/:id
POST   /api/temporadas        admin
PUT    /api/temporadas/:id    admin
DELETE /api/temporadas/:id    admin
```

## Base de Datos

El modelo Prisma esta en `backend/prisma/schema.prisma`.

Datasource:

- PostgreSQL.
- Conexion mediante `DATABASE_URL`.

Modelos definidos actualmente:

- `rol`: roles de usuario.
- `usuario`: usuarios con email, hash de password, rol y estado activo.
- `temporada`: temporadas deportivas.
- `equipo`: equipos asociados a una temporada.
- `jugador`: jugadores con DNI, nombre, apellidos, fecha de nacimiento y foto.
- `jugador_equipo`: relacion jugador-equipo con fechas, dorsal y estado activo.
- `lesion`: lesiones de jugadores.
- `medicion_antropometrica`: mediciones fisicas por jugador.
- `posicion`: posiciones deportivas.

Migraciones Prisma existentes:

```text
backend/prisma/migrations/
	20260910140914_init/
	20260910141245_init/
	20260914110403_auth_roles_users/
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
/temporadas
/temporadas/crear
/temporadas/editar/:id
/temporadas/borrar/:id
```

## Servicios Frontend

Los servicios estan en `frontend/src/components/services/`.

- `auth.service.ts`: login, tipo `AuthUser` y helper `authHeaders()`.
- `usuarios.service.ts`: llamadas a `/api/usuarios` y `/api/usuarios/roles`.
- `equipos.service.ts`: llamadas a `/api/equipos`.
- `jugadores.service.ts`: llamadas a `/api/jugadores`.
- `temporadas.service.ts`: llamadas a `/api/temporadas`.

Los servicios CRUD adjuntan `Authorization: Bearer ...` usando el token guardado en `localStorage`.

## UI y Estilos

Tailwind se configura en `frontend/tailwind.config.js`.

Tokens principales:

- `brand.dark`: sidebar oscuro.
- `brand.light`: fondo general.
- `brand.primary`: azul principal.
- `brand.secondary`: negro/gris muy oscuro.
- `brand.accent`: azul claro.
- `panel.bg`: fondo de cards.
- `panel.border`: borde de paneles.
- `alert.info`, `alert.warning`, `alert.danger`: fondos de aviso.

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
- Listar, crear, editar y borrar usuarios.
- Listas de equipos, jugadores y temporadas.
- Crear, editar y borrar equipos.
- Crear, editar y borrar jugadores.
- Crear, editar y borrar temporadas.

## Validacion Ejecutada

Validaciones que han pasado en el estado actual del proyecto:

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
- Backend tests: correcto, 2 tests pasan.
- Backend lint: correcto.
- Frontend build: correcto.

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

Aviso no bloqueante observado: Vitest muestra una recomendacion relacionada con `vite-tsconfig-paths`, indicando que Vite ya soporta resolucion nativa de paths mediante `resolve.tsconfigPaths`.

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
- Falta endurecer validacion DTO en backend; varios controladores reciben `data: any`.
- Falta ampliar tests para autenticacion, autorizacion y flujos CRUD protegidos.
- npm reporto vulnerabilidades tras instalar dependencias; conviene revisar con `npm audit` por carpeta.
- Las rutas de administracion en frontend no comprueban rol por si solas; la proteccion fuerte esta en backend.
- Los botones de planes en administracion apuntan actualmente a `/dashboard`; las funcionalidades de planes aun no estan implementadas.

## Siguiente Paso Recomendado

El siguiente bloque tecnico recomendable es reforzar validaciones backend:

- Crear DTOs para login y CRUD.
- Activar `ValidationPipe` global.
- Sustituir `data: any` por tipos/DTOs concretos.
- Anadir tests de autorizacion: sin token, token invalido, rol no admin y rol admin.
