# Análisis del Proyecto: AthLyzer Sports Train

Fecha de actualización: 2026-10-08.

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

AthLyzer Sports Train es una aplicación web para gestión deportiva con autenticación, equipos, temporadas, jugadores, plantillas y evaluación antropométrica en modalidades BASICA e ISAK.

### Implementado

- Backend NestJS 12, Prisma 6 y PostgreSQL.
- Frontend React, Vite, TypeScript, React Router y Tailwind CSS.
- Login con bcrypt y JWT.
- Autorización backend mediante `JwtAuthGuard`, `RolesGuard` y `@Roles`.
- DTOs con `class-validator`, `PartialType` y `ValidationPipe` global.
- CRUD de categorías, equipos, jugadores, temporadas y usuarios.
- Gestión de plantillas jugador-equipo con baja lógica y operaciones en bloque.
- Catálogo de posiciones administrable, posición preferida en alta/edición/ficha de jugador y posición principal configurable por jugador en cada plantilla.
- Ficha ampliada de jugador con datos personales, equipos, lesiones y mediciones recientes.
- Doble clic, teclado y botón visible para abrir una ficha desde el listado de jugadores.
- Subida de fotografías para administradores, con almacenamiento local de archivos y ruta persistida en BD.
- Captura antropométrica BASICA e ISAK, seleccionada según la configuración del equipo; los equipos nuevos usan BASICA y los existentes se migraron como ISAK.
- Mediciones asociadas al equipo y protocolo usados, con historial mixto por jugador; el servidor valida la pertenencia y la versión de configuración antes de guardar.
- Formulario BASICA de peso, talla, cintura opcional y observaciones; el formulario ISAK conserva sus seis pliegues obligatorios, perímetros, diámetros, cálculos y somatocarta.
- API antropométrica con auditoría del evaluador y cálculos derivados persistidos en servidor; BASICA no genera resultados ISAK.
- Throttling global y límite específico para login.
- Gestión de lesiones y readaptación con registro, mapa anatómico, tablero por fases, cambio de fase y alta médica.

### No implementado todavía

- Edición general y eliminación de lesiones; las operaciones disponibles son listado, alta y cambio de fase.
- Filtrado de lesiones por equipo en la API y permisos más granulares que los roles actuales `admin` y `usuario`.
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
| Equipos | CRUD por temporada/categoría; modalidad antropométrica configurable | CRUD, configuración de modalidad para `admin` y navegación a plantilla | Lectura autenticada, mutación `admin` |
| Jugadores | CRUD, detalle relacional y foto | Listado, CRUD y ficha | Lectura autenticada, mutación `admin` |
| Jugador-equipo | Asignación individual/en bloque y baja lógica | Dual listbox | Lectura autenticada, mutación `admin` |
| Antropometría | Crear, historial por jugador y cálculo ISAK; persistencia de BASICA | Captura BASICA/ISAK según equipo, selector explícito de equipo, historial y somatocarta ISAK | `admin`, `usuario` |
| Lesiones y readaptación | Listado, alta y cambio de fase; alta médica con reglas de transición | Tablero por fases, mapa anatómico anterior/posterior, registro de lesión y resumen en dashboard/ficha | `admin`, `usuario` |
| Posiciones | Catálogo CRUD; posición preferida en jugador y posición por pertenencia jugador-equipo | Gestión de catálogo, selector en jugador/ficha y selector en plantilla | `admin` |

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

### Lesiones y readaptación

El módulo está registrado en Nest y expone `GET /api/lesiones`, `POST /api/lesiones` y `PATCH /api/lesiones/:id/fase`. Las tres operaciones requieren autenticación y los roles `admin` o `usuario`. El listado devuelve todas las lesiones, con jugador, ordenadas por fecha de inicio; no acepta filtro por jugador o equipo en la API.

El alta requiere jugador, fecha de inicio, tipo de lesión y zona corporal; las observaciones son opcionales. El registro comienza en `Fase 1`. La actualización acepta `Fase 1` a `Fase 4` o `Alta Médica`; el alta solo se admite desde `Fase 4` y una lesión dada de alta no puede volver a readaptación. No hay operaciones de edición general ni de eliminación.

En frontend, `/lesiones` presenta el tablero de las cuatro fases, permite cambiar la fase mediante selector o arrastrar la lesión a otra columna y registra zonas en un mapa corporal anterior/posterior. Las altas médicas aparecen en una sección aparte. El dashboard selecciona un equipo y muestra sus jugadores con lesiones activas, pero obtiene el listado general de lesiones y filtra por plantilla en el cliente. La ficha del jugador muestra el número de lesiones activas y hasta cuatro registros recientes.

La API no limita los resultados al equipo del usuario: cualquier `admin` o `usuario` autorizado puede consultar el listado global de lesiones. No hay aislamiento por club/tenant ni permisos por equipo; debe tenerse en cuenta al manejar esta información sensible.

### Antropometría BASICA e ISAK

La modalidad se configura en el equipo. Solo `admin` puede modificarla; los equipos existentes se inicializaron como ISAK y los nuevos usan BASICA por defecto. La versión de configuración aumenta cuando cambia la modalidad para detectar formularios desactualizados.

Con pertenencias activas, la persona evaluadora selecciona explícitamente el equipo y su protocolo vigente; el sistema no elige automáticamente entre equipos. La fecha de medición debe quedar dentro de las fechas de pertenencia. Si no hay equipos activos, se puede elegir BASICA o ISAK y guardar sin equipo, salvo que la fecha corresponda a una pertenencia ya finalizada. El endpoint valida contexto y registra la medición dentro de una transacción serializable.

BASICA recoge peso y talla obligatorios, cintura y observaciones opcionales. No calcula ni almacena porcentaje de grasa, músculo, sumatorias, somatotipo o somatocarta. ISAK exige los seis pliegues principales y conserva las medidas opcionales y resultados calculados existentes. El frontend muestra un formulario adaptado a cada protocolo y el historial indica protocolo y equipo.

El stepper frontend envía medidas brutas en una única petición `POST /api/mediciones-antropometricas`. Para ISAK, el servidor calcula:

- Sumatoria de seis pliegues.
- Sumatoria de ocho pliegues si existen bicipital y cresta ilíaca.
- Porcentaje de grasa mediante la ecuación de Faulkner usada por el proyecto.
- Endomorfia y ectomorfia Heath-Carter.
- Mesomorfia y coordenadas de somatocarta cuando están las medidas requeridas.

El evaluador se obtiene del JWT (`request.user.id_usuario`) y no se acepta desde el cliente. El historial se consulta con `GET /api/mediciones-antropometricas/jugador/:idJugador` y se ordena por fecha descendente. Cada registro conserva protocolo y equipo de origen; cambiar la configuración no recalcula ni modifica el historial.

## 4. Frontend y rutas

Las rutas privadas se renderizan dentro de `Layout`, que contiene sidebar, header y área de trabajo. `RequireAuth` exige token; `RequireAdmin` exige rol `admin`; `RequireEvaluator` permite `admin` y `usuario` para la creación antropométrica. La edición de equipo permite a administradores configurar la modalidad antropométrica.

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
/lesiones
/temporadas...
```

Los servicios frontend usan `authHeaders()` y mantienen actualmente la URL de API `http://localhost:3000/api` en código. Esto sigue siendo una limitación para despliegue fuera del entorno local.

## 5. Modelo de datos

El esquema Prisma contiene:

- `rol` y `usuario`: autenticación, autorización y auditoría.
- `categoria`, `temporada` y `equipo`: organización deportiva.
- `jugador`: identidad deportiva, foto como ruta y posición preferida opcional.
- `jugador_equipo`: pertenencia histórica, dorsal, posición principal opcional para ese equipo y estado activo.
- `lesion`: jugador, fechas, tipo, zona corporal, gravedad, fase de readaptación, alta médica y observaciones; no tiene relación directa con equipo.
- `equipo`: protocolo antropométrico vigente y versión de configuración.
- `medicion_antropometrica`: protocolo utilizado, equipo de origen opcional, medidas compartidas y resultados derivados nullable según modalidad. Los pliegues ISAK son nullable en el esquema para admitir BASICA, pero ISAK los exige en DTO y servicio.
- `posicion`: catálogo de posiciones relacionado con la posición preferida del jugador y la posición de cada pertenencia jugador-equipo. Las dos referencias son opcionales y usan `Restrict` para evitar borrar posiciones asignadas.

La migración `20260922120000_mediciones_antropometricas_isak` transforma el modelo antropométrico inicial y se detiene si detecta registros antiguos que no se pueden atribuir de forma segura. La migración `20261006160000_protocolos_antropometricos` agrega las modalidades por equipo y medición, cambia los seis pliegues a nullable y conserva los registros anteriores como ISAK sin recalcularlos ni atribuirles equipo.

Migraciones:

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

## 6. Decisiones recientes

### Auditoría antropométrica

`id_evaluador` es una relación obligatoria con `usuario`. El controlador ignora cualquier intento de enviar ese identificador desde el frontend y usa el usuario autenticado. Esto evita atribuir una medición a otra persona manipulando el body.

### Cálculos en servidor

El frontend muestra una previsualización reactiva para mejorar la experiencia, pero los valores definitivos se recalculan en `antropometria.calculator.ts` dentro del backend antes de persistirlos. Así el historial no depende de la implementación concreta del navegador.

### Foto por referencia

La BD mantiene una referencia ligera y reemplazable. Guardar binarios en PostgreSQL habría aumentado el tamaño de las respuestas de detalle y habría acoplado la aplicación al almacenamiento de la base de datos.

### Datos antiguos antropométricos

La migración de modalidades marca los equipos y mediciones existentes como ISAK. Las mediciones antiguas quedan sin equipo porque no se puede inferir su plantilla de origen; sus medidas y resultados se conservan sin recálculo. Los equipos nuevos se crean en BASICA. El borrado físico de equipos se rechaza y la relación medición-equipo usa `Restrict` para proteger el historial.

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
- El listado de lesiones es global para los roles `admin` y `usuario`; no existe filtrado de API por equipo ni aislamiento por organización.

## 8. Calidad y pruebas

Validación ejecutada durante la revisión del 2026-10-06:

```text
Backend build: correcto
Backend test: 53 tests correctos en 10 archivos
Backend lint: correcto
Frontend build: correcto
Backend e2e protegido: 51 tests correctos en 1 archivo (Prisma mock)
```

Las pruebas unitarias recientes cubren:

- Cálculos de sumatorias, grasa y somatotipo.
- Omisión segura de cálculos que dependen de opcionales ausentes.
- Persistencia del evaluador autenticado.
- Rechazo de jugador inexistente al crear una medición.
- Includes y ordenación de la ficha ampliada.
- Reglas de negocio previas de categorías, temporadas, usuarios, jugadores y plantillas.
- Protocolos BASICA/ISAK, validación condicional, pertenencia y fecha, conflicto por configuración obsoleta y conservación del historial al reconfigurar equipos.

Los tests e2e protegidos mockean Prisma y cubren autenticación, roles, DTOs, protocolos, configuración de equipo y login. La prueba de migración `protocolos-antropometricos-migration.e2e-spec.ts` aplica migraciones en un esquema PostgreSQL aislado; requiere `DATABASE_URL` y se habilita explícitamente mediante `TEST_PROTOCOL_MIGRATION=1`. No se ejecutó en la revisión indicada. No hay tests automatizados de componentes o flujos frontend.

La compilación de frontend y backend, los tests unitarios y el lint pasaron durante esa revisión. Los builds no sustituyen la comprobación manual de los recorridos en navegador.

## 9. Riesgos y pendientes

1. No hay CI que ejecute build, tests y lint en cada cambio.
2. Las URLs de API están hardcodeadas para localhost.
3. El almacenamiento local de fotografías no es adecuado para varias réplicas del backend.
4. La gestión de lesiones es parcial: falta editar/eliminar, y la API lista todas las lesiones sin filtrar por equipo; revisar el alcance de acceso porque son datos sensibles.
5. Cada pertenencia admite una posición principal; varias posiciones simultáneas para el mismo jugador y equipo requerirían ampliar la relación.
6. La masa muscular no se persiste porque falta una fórmula y variables validadas.
7. Persisten riesgos de `localStorage`, falta de Helmet y dependencias con rangos `latest` en frontend.
8. No hay tests frontend automatizados.
9. La selección y posterior deselección de un equipo mientras su configuración está cargando puede dejar bloqueado el estado de carga del formulario antropométrico.
10. Una edición de equipo abierta en una sesión antigua puede sobrescribir una modalidad modificada en otra sesión; la versión evita conflictos al registrar mediciones, pero la edición administrativa no envía la versión originalmente leída.
11. La ficha del jugador no muestra el perímetro de cintura de mediciones BASICA y mantiene indicadores ISAK vacíos en el resumen básico.

## 10. Roadmap

1. Externalizar configuración de API y fijar versiones frontend.
2. Añadir CI con backend build/test/lint y frontend build.
3. Migrar fotografías a almacenamiento de objetos/CDN.
4. Completar edición/eliminación de lesiones y definir si el acceso y las consultas deben limitarse por equipo; conservar la regla de alta médica irreversible salvo decisión funcional.
5. Confirmar si una pertenencia jugador-equipo debe admitir varias posiciones simultáneas o una única posición principal.
6. Definir y validar el cálculo de masa muscular con el equipo deportivo.
7. Añadir tests de integración frontend y flujos Playwright.
8. Incorporar Helmet, CSP, cookies HttpOnly y política de CORS productiva.
