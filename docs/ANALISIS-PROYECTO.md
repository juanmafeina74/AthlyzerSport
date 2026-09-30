# Análisis del Proyecto: AthLyzer Sports Train

Fecha de actualización: 2026-09-23.

Este documento es la referencia técnica detallada del estado actual. El [README raíz](../README.md) contiene la guía rápida de instalación y uso; este análisis recoge arquitectura, inventario funcional, modelo de datos, decisiones recientes, riesgos y roadmap.

## Índice

1. Estado actual
2. Arquitectura y flujo de datos
3. Inventario funcional
4. Frontend y rutas
5. Modelo de datos
6. Decisiones recientes
7. Seguridad y operación
8. Calidad y pruebas
9. Riesgos y pendientes
10. Roadmap

## 1. Estado actual

AthLyzer Sports Train es una aplicación web para gestión deportiva con autenticación, equipos, temporadas, jugadores, plantillas y evaluación antropométrica ISAK.

### Implementado

- Backend NestJS 12, Prisma 6 y PostgreSQL.
- Frontend React, Vite, TypeScript, React Router y Tailwind CSS.
- Login con bcrypt y JWT.
- Autorización backend mediante `JwtAuthGuard`, `RolesGuard` y `@Roles`.
- DTOs con `class-validator`, `PartialType` y `ValidationPipe` global.
- CRUD de categorías, equipos, jugadores, temporadas y usuarios.
- Gestión de plantillas jugador-equipo con baja lógica y operaciones en bloque.
- Ficha ampliada de jugador con datos personales, equipos, lesiones y mediciones recientes.
- Doble clic, teclado y botón visible para abrir una ficha desde el listado de jugadores.
- Subida de fotografías para administradores, con almacenamiento local de archivos y ruta persistida en BD.
- Stepper antropométrico ISAK de cuatro pasos con historial, cálculos reactivos y somatocarta.
- API antropométrica con auditoría del evaluador y cálculos derivados persistidos en servidor.
- Throttling global y límite específico para login.

### No implementado todavía

- CRUD y pantallas para lesiones.
- Relación de jugador con posición.
- Cálculo validado de masa muscular con las variables necesarias.
- Tests automatizados de frontend.
- CI/CD y cabeceras HTTP adicionales como Helmet.

## 2. Arquitectura y flujo de datos

```text
React + Vite :5173
  | fetch + Authorization: Bearer JWT
  v
NestJS :3000/api
  | JwtAuthGuard -> RolesGuard -> ValidationPipe
  v
Controllers -> Services -> PrismaService -> PostgreSQL
```

El backend sirve además `/uploads/...` como recursos estáticos. En desarrollo CORS permite los orígenes locales de Vite; en producción debe configurarse explícitamente el origen permitido.

El arranque raíz es:

```text
npm start
  -> cleanup-ports.js
  -> reset-prisma-client.js
  -> backend start:dev
  -> wait-on http://localhost:3000/api
  -> frontend dev :5173
```

`reset-prisma-client.js` ejecuta el CLI JavaScript local de Prisma mediante `process.execPath`. Esto evita el bloqueo observado con `npx` y rutas Windows con espacios.

## 3. Inventario funcional

| Módulo | Backend | Frontend | Roles principales |
|---|---|---|---|
| Auth | Login, bcrypt, JWT, seed demo | Login y persistencia de sesión | Público para login |
| Usuarios | CRUD y roles | Administración | `admin` |
| Categorías | CRUD y protección de borrado | CRUD | `admin` |
| Temporadas | CRUD y validación de fechas | CRUD | Lectura autenticada, mutación `admin` |
| Equipos | CRUD por temporada/categoría | CRUD y navegación a plantilla | Lectura autenticada, mutación `admin` |
| Jugadores | CRUD, detalle relacional y foto | Listado, CRUD y ficha | Lectura autenticada, mutación `admin` |
| Jugador-equipo | Asignación individual/en bloque y baja lógica | Dual listbox | Lectura autenticada, mutación `admin` |
| Antropometría | Crear, historial por jugador y cálculo | Stepper ISAK y somatocarta | `admin`, `usuario` |
| Lesiones | Solo modelo Prisma | Sin pantalla | Pendiente |
| Posiciones | Solo modelo Prisma, sin FK a jugador | Sin pantalla | Pendiente |

### Ficha de jugador

`GET /api/jugadores/:id` devuelve el jugador junto con:

- `jugador_equipo`, incluyendo equipo, categoría y temporada, ordenado por inicio.
- `lesion`, ordenadas por fecha de inicio.
- Cinco `medicion_antropometrica` recientes, incluyendo el nombre del evaluador.

La ruta frontend `/jugadores/:id` presenta datos personales, edad calculada, situación deportiva, historial de equipos, evolución antropométrica, estado médico y acciones de edición, medición y fotografía.

### Fotografía

La fotografía no se almacena como `BYTEA` ni como base64 en PostgreSQL. El endpoint `POST /api/jugadores/:id/foto` recibe `multipart/form-data`:

- Campo: `foto`.
- Roles: `admin`.
- Tipos: JPEG, PNG y WebP.
- Tamaño máximo: 5 MB.
- Ubicación local: `backend/uploads/jugadores/`.
- Valor persistido en `jugador.foto`: `/uploads/jugadores/<uuid>.<ext>`.

El directorio está en `.gitignore`. El servicio elimina la foto local anterior cuando se reemplaza o elimina el jugador. Para producción se recomienda sustituir el almacenamiento local por Blob Storage, S3 o CDN y conservar la misma idea de guardar únicamente una URL.

### Antropometría ISAK

El stepper frontend envía medidas brutas en una única petición `POST /api/mediciones-antropometricas`. El servidor calcula:

- Sumatoria de seis pliegues.
- Sumatoria de ocho pliegues si existen bicipital y cresta ilíaca.
- Porcentaje de grasa mediante la ecuación de Faulkner usada por el proyecto.
- Endomorfia y ectomorfia Heath-Carter.
- Mesomorfia y coordenadas de somatocarta cuando están las medidas requeridas.

El evaluador se obtiene del JWT (`request.user.id_usuario`) y no se acepta desde el cliente. El historial se consulta con `GET /api/mediciones-antropometricas/jugador/:idJugador` y se ordena por fecha descendente.

## 4. Frontend y rutas

Las rutas privadas se renderizan dentro de `Layout`, que contiene sidebar, header y área de trabajo. `RequireAuth` exige token; `RequireAdmin` exige rol `admin`; `RequireEvaluator` permite `admin` y `usuario` para la creación antropométrica.

Rutas relevantes:

```text
/login
/dashboard
/admin
/categorias...
/usuarios...
/equipos...
/equipos/plantilla/:id
/jugadores
/jugadores/:id
/jugadores/crear
/jugadores/editar/:id
/jugadores/borrar/:id
/mediciones-antropometricas/crear
/temporadas...
```

Los servicios frontend usan `authHeaders()` y mantienen actualmente la URL de API `http://localhost:3000/api` en código. Esto sigue siendo una limitación para despliegue fuera del entorno local.

## 5. Modelo de datos

El esquema Prisma contiene:

- `rol` y `usuario`: autenticación, autorización y auditoría.
- `categoria`, `temporada` y `equipo`: organización deportiva.
- `jugador`: identidad deportiva, foto como ruta y relaciones.
- `jugador_equipo`: pertenencia histórica, dorsal y estado activo.
- `lesion`: información médica básica.
- `medicion_antropometrica`: protocolo ISAK y resultados derivados.
- `posicion`: catálogo todavía no relacionado con jugador.

La migración `20260922120000_mediciones_antropometricas_isak` transforma el modelo antropométrico inicial. Se detiene si encuentra registros previos porque faltan datos obligatorios del nuevo protocolo y no es seguro inventar pliegues ni evaluador.

Migraciones:

```text
20260910140914_init
20260910141245_init
20260914110403_auth_roles_users
20260916090000_categorias_equipos
20260922120000_mediciones_antropometricas_isak
```

## 6. Decisiones recientes

### Auditoría antropométrica

`id_evaluador` es una relación obligatoria con `usuario`. El controlador ignora cualquier intento de enviar ese identificador desde el frontend y usa el usuario autenticado. Esto evita atribuir una medición a otra persona manipulando el body.

### Cálculos en servidor

El frontend muestra una previsualización reactiva para mejorar la experiencia, pero los valores definitivos se recalculan en `antropometria.calculator.ts` dentro del backend antes de persistirlos. Así el historial no depende de la implementación concreta del navegador.

### Foto por referencia

La BD mantiene una referencia ligera y reemplazable. Guardar binarios en PostgreSQL habría aumentado el tamaño de las respuestas de detalle y habría acoplado la aplicación al almacenamiento de la base de datos.

### Datos antiguos antropométricos

La migración no intenta convertir mediciones incompletas. Si una base contiene datos antiguos, debe respaldarse y definirse una estrategia de normalización antes de aplicar la migración ISAK.

## 7. Seguridad y operación

Resuelto:

- Passwords con bcrypt.
- JWT con secreto configurable y validación de configuración productiva.
- Guards de autenticación y roles en backend.
- Validación y rechazo de propiedades no declaradas.
- Rate limiting global y reforzado para login.
- Límite de tamaño y filtro MIME para fotografías.
- Los archivos de usuario no se versionan.

Pendiente:

- El JWT se guarda en `localStorage`; valorar cookies HttpOnly en producción.
- Añadir Helmet y cabeceras CSP/clickjacking.
- Externalizar `VITE_API_URL`.
- Revisar las vulnerabilidades de `npm audit` antes de desplegar.
- Añadir control de acceso más fino si lesiones o mediciones requieren confidencialidad diferenciada.

## 8. Calidad y pruebas

Validación de referencia del 2026-09-23:

```text
Backend build: correcto
Backend test: 25 tests correctos en 8 archivos
Backend lint: correcto
Frontend build: correcto
```

Las pruebas unitarias recientes cubren:

- Cálculos de sumatorias, grasa y somatotipo.
- Omisión segura de cálculos que dependen de opcionales ausentes.
- Persistencia del evaluador autenticado.
- Rechazo de jugador inexistente al crear una medición.
- Includes y ordenación de la ficha ampliada.
- Reglas de negocio previas de categorías, temporadas, usuarios, jugadores y plantillas.

Los tests e2e protegidos mockean Prisma y cubren autenticación, roles, DTOs y login. El e2e histórico de la aplicación requiere PostgreSQL real.

No hay todavía tests automatizados de componentes o flujos del frontend; la revisión visual de la ficha y el stepper se realiza manualmente en `http://localhost:5173`.

## 9. Riesgos y pendientes

1. No hay CI que ejecute build, tests y lint en cada cambio.
2. Las URLs de API están hardcodeadas para localhost.
3. El almacenamiento local de fotografías no es adecuado para varias réplicas del backend.
4. No hay CRUD de lesiones.
5. `posicion` no está relacionada con `jugador`.
6. La masa muscular no se persiste porque falta una fórmula y variables validadas.
7. Persisten riesgos de `localStorage`, falta de Helmet y dependencias con rangos `latest` en frontend.
8. No hay tests frontend automatizados.

## 10. Roadmap

1. Externalizar configuración de API y fijar versiones frontend.
2. Añadir CI con backend build/test/lint y frontend build.
3. Migrar fotografías a almacenamiento de objetos/CDN.
4. Implementar CRUD y permisos de lesiones.
5. Modelar la relación jugador-posición.
6. Definir y validar el cálculo de masa muscular con el equipo deportivo.
7. Añadir tests de integración frontend y flujos Playwright.
8. Incorporar Helmet, CSP, cookies HttpOnly y política de CORS productiva.
