# Análisis Completo del Proyecto — AthLyzer Sports Train

Fecha de análisis: 2026-09-18.

Este documento amplía el [README.md](../README.md) con un análisis técnico más profundo: arquitectura real del código, funcionalidades verificadas contra el código fuente, riesgos detectados (incluyendo seguridad) y una hoja de ruta priorizada. El README debe seguir siendo la referencia rápida de arranque; este documento es la referencia de análisis y decisiones técnicas.

## Índice

1. Resumen del estado del proyecto
2. Arquitectura y flujo de datos
3. Inventario funcional por módulo (backend)
4. Frontend: rutas, guardas y servicios
5. Modelo de datos (Prisma)
6. Seguridad: estado actual y huecos
7. Calidad, tests y automatización
8. Riesgos detectados (priorizados)
9. Próximos pasos recomendados (roadmap)

---

## 1. Resumen del estado del proyecto

AthLyzer Sports Train es una aplicación de gestión deportiva (usuarios, roles, categorías, equipos, jugadores, temporadas) compuesta por:

- **Backend**: NestJS 12 + Prisma 6 + PostgreSQL, autenticación JWT, autorización por roles, CORS restringido a Vite en desarrollo, filtro global de excepciones, y (desde 2026-09-18) DTOs con `class-validator` + `ValidationPipe` global para los módulos de equipos y jugadores.
- **Frontend**: React + Vite + React Router + Tailwind CSS, sin gestor de estado global (todo vive en `localStorage` + fetch directo por componente/servicio).
- **Orquestación**: scripts raíz (`npm start`) que limpian puertos, resetean el cliente Prisma y levantan backend y frontend en paralelo con `concurrently` + `wait-on`.

El proyecto está en una fase de "MVP funcional con endurecimiento parcial": los flujos CRUD principales existen y funcionan, la autenticación/autorización backend es sólida, pero la validación de entrada y la cobertura de tests son desiguales entre módulos (equipos/jugadores ya reforzados; categorías, usuarios, temporadas y login todavía no).

## 2. Arquitectura y flujo de datos

```text
React (Vite, puerto 5173)
  │  fetch + Authorization: Bearer <JWT>
  ▼
NestJS (puerto 3000, prefijo global /api)
  │  JwtAuthGuard -> RolesGuard -> ValidationPipe (global) -> Controller -> Service
  ▼
Prisma Client
  ▼
PostgreSQL
```

Puntos de diseño relevantes:

- El prefijo `/api` se fija en `backend/src/main.ts`; cualquier ruta nueva debe registrarse bajo un controlador de Nest para heredarlo automáticamente.
- CORS solo se habilita cuando `NODE_ENV !== 'production'`, restringido a orígenes de `localhost`/`127.0.0.1`/`[::1]`/`192.168.x.x` en el puerto 5173. **En producción no hay configuración de CORS explícita**, lo que en la práctica bloquea cualquier origen cross-origin salvo que se añada configuración adicional antes de desplegar.
- El seed de usuarios demo (`auth.seed.ts`) se ejecuta en cada arranque del backend (`main.ts`), no solo en desarrollo; el propio seed decide internamente si crea/actualiza usuarios según `NODE_ENV` y variables `DEMO_*`.
- No existe capa de caché, cola de trabajos ni servicios externos: la arquitectura es monolítica de 2 capas (API + BD) más un frontend SPA.

## 3. Inventario funcional por módulo (backend)

| Módulo | Guardas | Validación de entrada | Reglas de negocio relevantes |
|---|---|---|---|
| `auth` | Público (`/login`) | `LoginDto` (class-validator: `IsEmail`, `IsNotEmpty`) + `ValidationPipe` global | Compara bcrypt, exige `activo = true`, firma JWT con `id_usuario`, `email`, `role` |
| `equipos` | `JwtAuthGuard` + `RolesGuard` (`GET` cualquier rol, mutaciones `admin`) | `CreateEquipoDto` / `UpdateEquipoDto` (class-validator) + `ValidationPipe` global | Requiere `id_temporada` existente; si se informa `id_categoria` debe existir y estar activa |
| `jugadores` | `JwtAuthGuard` + `RolesGuard` (igual patrón) | `CreateJugadorDto` / `UpdateJugadorDto` (class-validator) | DNI único (constraint de BD, mapeado a 409 por el filtro global) |
| `categorias` | `JwtAuthGuard` + `RolesGuard`, **todo el controlador exige `admin`** (incluidos los `GET`) | `CreateCategoriaDto` / `UpdateCategoriaDto` (class-validator) | No permite borrar una categoría con equipos asociados (`_count.equipos > 0`) |
| `usuarios` | `JwtAuthGuard` + `RolesGuard`, **todo el controlador exige `admin`** | `CreateUsuarioDto` / `UpdateUsuarioDto` (class-validator) | Hash bcrypt (12 rounds) en alta/edición de password; expone `GET /roles` |
| `temporadas` | `JwtAuthGuard` + `RolesGuard` (igual patrón que equipos) | `CreateTemporadaDto` / `UpdateTemporadaDto` (class-validator) | Valida que `fecha_fin >= fecha_inicio` |

Observación importante: **`categorias` y `usuarios` restringen incluso la lectura (`GET`) a rol `admin`**, a diferencia de `equipos`, `jugadores` y `temporadas`, donde cualquier usuario autenticado puede leer. Esto es una decisión de negocio implícita en el código (no documentada explícitamente en el README) que conviene confirmar que es intencional.

> Actualizado 2026-09-18: todos los módulos (`auth`, `equipos`, `jugadores`, `categorias`, `usuarios`, `temporadas`) usan ya DTOs con `class-validator` y el `ValidationPipe` global; ya no queda ningún controlador/servicio recibiendo `data: any`.

> Actualizado 2026-09-18 (2ª vez): nuevo módulo `jugador-equipo` (`/api/equipos/:idEquipo/plantilla`) para gestionar la relación jugador↔equipo mediante altas/bajas lógicas sobre la tabla `jugador_equipo` (individuales y en bloque). Lectura abierta a cualquier rol autenticado, mutaciones restringidas a `admin`, mismo patrón que `equipos`/`jugadores`/`temporadas`.

## 4. Frontend: rutas, guardas y servicios

- El enrutado (`frontend/src/router.tsx`) usa dos guardas: `RequireAuth` (cualquier usuario con `accessToken` válido en `localStorage`) y `RequireAdmin` (además exige `role === 'admin'`, si no redirige a `/dashboard`).
- Las rutas de `categorias` y `usuarios` usan `RequireAdmin` en frontend, coherente con la restricción de rol `admin` que exige el backend en esos módulos.
- Las rutas de `equipos`, `jugadores` y `temporadas` solo usan `RequireAuth` (cualquier rol autenticado), también coherente con el backend, aunque los formularios de creación/edición/borrado en frontend no ocultan ni deshabilitan la UI según el rol: si un usuario no-admin navega directamente a `/equipos/crear`, el backend rechazará el `POST` con 403, pero el formulario se renderiza igualmente.
- `frontend/src/main.tsx` no usa `App.tsx` (el archivo existe pero está vacío); el punto de entrada real es `Router` renderizado directamente.
- `auth.service.ts` apunta a `http://localhost:3000/api/auth` **hardcodeado**, sin variable de entorno (`VITE_API_URL` o similar). Esto es un riesgo de despliegue: cualquier entorno que no sea `localhost:3000` requiere editar código fuente.
- Los `package.json` de frontend usan `"latest"` para React, Vite, React Router, TypeScript, etc., en lugar de rangos semánticos fijos. Esto facilita quedar desalineado entre entornos/instalaciones (`npm install` en dos máquinas distintas en días distintos puede traer versiones diferentes).

## 5. Modelo de datos (Prisma)

Modelos definidos en `backend/prisma/schema.prisma`: `rol`, `usuario`, `categoria`, `temporada`, `equipo`, `jugador`, `jugador_equipo`, `lesion`, `medicion_antropometrica`, `posicion`.

Puntos relevantes:

- `equipo.id_temporada` usa `onDelete: Cascade` hacia `temporada` a nivel de base de datos: si se borrase una temporada directamente en BD (fuera de la API), se borrarían en cascada sus equipos y, transitivamente, `jugador_equipo`. Desde la API esto ya no es alcanzable: `TemporadasService.remove()` comprueba `_count.equipo` y rechaza el borrado con `400` si hay equipos asociados (mismo patrón que `categorias`).
- `equipo.id_categoria` usa `onDelete: Restrict`: coherente con la regla de negocio en `categorias.service.ts` que impide borrar categorías con equipos asociados.
- `jugador.dni` es único a nivel de BD; el filtro global (`GlobalExceptionFilter`) traduce el error `P2002` de Prisma en un 409 con mensaje legible, pero no hay una validación previa (`class-validator` o consulta) que dé un mensaje más amigable antes de tocar la BD.
- Modelos `lesion`, `medicion_antropometrica` y `posicion` **existen en el esquema y en las migraciones pero no tienen módulo, servicio, controlador ni pantalla en frontend**. Son funcionalidad modelada pero no implementada todavía.
- `jugador_equipo` ya tiene un módulo dedicado (2026-09-18, ver sección 3) que gestiona el alta/baja de jugadores en un equipo mediante borrado lógico (`activo`, `fecha_inicio`, `fecha_fin`), preservando el histórico en vez de borrar filas. La tabla `posicion` sigue sin relación con `jugador` en el esquema, por lo que no es posible filtrar jugadores por posición sin ampliar el modelo de datos (limitación conocida de la nueva pantalla de plantilla).

## 6. Seguridad: estado actual y huecos

Lo que ya está bien resuelto:

- Passwords con bcrypt (12 rounds), nunca en texto plano.
- JWT firmado con secreto configurable (`JWT_SECRET`), con fallback de desarrollo (`DEV_JWT_SECRET`) que **lanza error si `NODE_ENV=production` y no hay `JWT_SECRET`** (buen diseño, evita despliegues inseguros por omisión).
- Autorización real en backend (`JwtAuthGuard` + `RolesGuard`), no solo en frontend.
- DTOs + `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`) ya activos para equipos y jugadores.

Huecos detectados:

- ~~Sin rate limiting en `POST /api/auth/login`~~ Resuelto 2026-09-18: `@nestjs/throttler` registrado globalmente (`ThrottlerGuard` como `APP_GUARD`, 100 peticiones/minuto por IP) y con un límite reforzado de 5 intentos/minuto en el login (`@Throttle`).
- ~~Sin DTO/validación estructurada en `auth.controller.ts`~~ Resuelto 2026-09-18: `LoginDto` con `class-validator` (`IsEmail`, `IsNotEmpty`) ya valida el body de login antes de llegar al servicio.
- ~~`categorias`, `usuarios` y `temporadas` siguen con `data: any`~~ Resuelto 2026-09-18: los tres módulos ya usan DTOs de creación/actualización con `class-validator`, en línea con `equipos`/`jugadores`.
- **Token en `localStorage`**: ya documentado como riesgo conocido en el README; sigue vigente (vulnerable a robo por XSS si en el futuro se introduce contenido no confiable).
- **Sin CSP ni cabeceras de seguridad HTTP** (`helmet` no está instalado): no hay protección adicional contra XSS/clickjacking a nivel de cabeceras HTTP en el backend.
- **CORS no configurado para producción**: si se despliega, habrá que decidir y codificar explícitamente los orígenes permitidos en producción (actualmente el bloque de `enableCors` solo se ejecuta fuera de producción).
- **Sin límite de tamaño de payload ni sanitización adicional** más allá de lo que Express/Nest traen por defecto.
- **`npm audit` con vulnerabilidades pendientes** (ya señalado en README): no se ha revisado el detalle de severidad/CVE por paquete todavía.

## 7. Calidad, tests y automatización

- Lint: `oxlint` en backend, con la regla `@typescript-eslint/no-explicit-any` **desactivada explícitamente** (`backend/oxlint.json`). Esto significa que el lint no detecta ni impedirá que se sigan añadiendo `data: any` en los módulos pendientes; el criterio para eliminarlos depende de disciplina manual o de una futura reactivación de esa regla.
- Tests unitarios (`npm run test`, Vitest): 20 tests. 2 en `app.controller.spec.ts`, 12 en specs de servicio de `categorias`/`temporadas`/`usuarios`/`jugadores`, y 6 nuevos (2026-09-18) en `jugador-equipo.service.spec.ts` (equipo inexistente, exclusión de disponibles ya activos, reactivación de relación inactiva en vez de duplicarla, jugador inexistente, quitar un jugador no activo, soft-delete al quitar).
- Tests e2e (`npm run test:e2e`, Vitest + Supertest):
  - `test/app.e2e-spec.ts`: histórico, requiere una PostgreSQL real conectada vía `DATABASE_URL` (falla en entornos sin BD, incluido el entorno de este análisis).
  - `test/protected-endpoints.e2e-spec.ts` (2026-09-18): 30 tests organizados en 5 bloques independientes (equipos/usuarios, `auth.login` casos de negocio, categorias, jugadores, temporadas), cada uno con su propia instancia de la app y `PrismaService` mockeado (no requiere BD real). Cubre 401/403/400/200/201 por módulo, 429 de rate limiting en login, y los tres casos de negocio de login (usuario inexistente 404, usuario inactivo 400, password incorrecta 400).
  - No hay tests e2e todavia para categorias/usuarios/jugadores/temporadas más alla de los casos JWT/roles ya cubiertos; ver más abajo los tests unitarios de servicio que ya cubren las reglas de negocio más finas (borrado en cascada, unicidad).
- Frontend: no hay tests automatizados (ni unitarios ni e2e/UI) configurados en `frontend/package.json`.
- No hay pipeline de CI configurado en el repositorio (no se detectó carpeta `.github/workflows` ni configuración equivalente): las validaciones (`build`, `test`, `lint`) se ejecutan manualmente.

## 8. Riesgos detectados (priorizados)

**Alto**

1. Ausencia de CI: nada impide subir código que rompe `build`/`test`/`lint` a la rama principal.
2. ~~`POST /api/auth/login` sin rate limiting ni DTO validado~~ Resuelto 2026-09-18: `LoginDto` + `@nestjs/throttler` (5 intentos/minuto) ya mitigan payloads malformados y fuerza bruta.
3. ~~Falta de tests de integración para `categorias`, `usuarios`, `temporadas` y `auth`~~ Resuelto 2026-09-18: `protected-endpoints.e2e-spec.ts` cubre ahora JWT/roles, DTOs y casos de negocio de login para los 5 módulos, y los tests unitarios de servicio cubren además borrado en cascada y unicidad (ver punto 7).

**Medio**

4. ~~`data: any` persistente en `categorias`, `usuarios`, `temporadas`~~ Resuelto 2026-09-18 (DTOs + class-validator ya aplicados en los tres módulos, más `auth`).
5. ~~`onDelete: Cascade` de `temporada -> equipo` sin confirmación ni aviso en la capa de aplicación~~ Resuelto 2026-09-18: `TemporadasService.remove()` ahora comprueba equipos asociados y rechaza el borrado con `400` (mismo patrón que `categorias`), en vez de dejar que la cascada de BD actúe en silencio a través de la API.
6. URL de API hardcodeada en el frontend (`http://localhost:3000/api/auth` y previsiblemente en el resto de servicios): bloquea el despliegue a otro dominio/puerto sin tocar código.
7. Dependencias `"latest"` en `frontend/package.json`: riesgo de builds no reproducibles entre máquinas/tiempos distintos.
8. Vulnerabilidades reportadas por `npm audit` sin triaje documentado (ni en backend ni en frontend).

**Bajo**

9. Regla de lint `no-explicit-any` desactivada: no hay barrera automática que impida reintroducir `any` en el futuro.
10. `App.tsx` vacío y sin uso: código muerto que puede confundir a nuevas personas del equipo.
11. Modelos `lesion`, `medicion_antropometrica`, `posicion` sin ninguna implementación (ni API ni UI): expectativa funcional del dominio (deportivo/médico) todavía no cubierta.
12. Sin cabeceras de seguridad HTTP (`helmet`) ni límites de tamaño de payload explícitos.

## 9. Próximos pasos recomendados (roadmap)

Orden sugerido, de mayor a menor impacto/menor esfuerzo:

1. ~~Extender DTOs + `class-validator` a `auth` (login), `categorias`, `usuarios` y `temporadas`~~ **Completado 2026-09-18**, siguiendo el patrón ya validado en `equipos`/`jugadores` (DTO de creación + `PartialType` para actualización).
2. ~~Añadir rate limiting básico al login~~ **Completado 2026-09-18**: `@nestjs/throttler` con límite global (100/min) y límite reforzado en login (5/min).
3. ~~Ampliar `protected-endpoints.e2e-spec.ts` para cubrir `categorias`, `jugadores`, `temporadas` y `auth.login`~~ **Completado 2026-09-18**: 30 tests en 5 bloques independientes.
4. ~~Añadir tests unitarios de servicio para las reglas de negocio más sensibles~~ **Completado 2026-09-18**: `categorias.service.spec.ts`, `temporadas.service.spec.ts`, `usuarios.service.spec.ts` y `jugadores.service.spec.ts` (12 tests) cubren no-borrado de categoría con equipos, el riesgo de cascada en `temporadas.remove()`, y la propagación del error `P2002` de Prisma para unicidad de email/DNI.
5. ~~Impedir el borrado en cascada silencioso de `temporada -> equipo`~~ **Completado 2026-09-18**: `TemporadasService.remove()` rechaza con `400` si la temporada tiene equipos asociados, en vez de dejar que Prisma/BD borre en cascada sin aviso.
6. **Configurar CI** (build + test + lint de backend y build de frontend) en cada PR/push a la rama principal.
7. **Externalizar la URL de la API en frontend** (variable de entorno de Vite, p. ej. `VITE_API_URL`), en vez de hardcodear `localhost:3000`.
8. **Revisar y fijar versiones** en `frontend/package.json` (sustituir `"latest"` por rangos semánticos concretos) y ejecutar `npm audit` en ambas carpetas, documentando el triaje de cada hallazgo.
9. **Decidir y documentar explícitamente** si la restricción de `GET` a rol `admin` en `categorias` y `usuarios` es intencional (y dejarlo reflejado en el README/documentación de API), o alinearla con el patrón de `equipos`/`jugadores`/`temporadas` si no lo es.
10. **Planificar la implementación de `lesion`, `medicion_antropometrica` y `posicion`** (API + UI) si siguen siendo parte del alcance funcional del producto, o retirarlos del esquema si se han descartado.
11. **Añadir `helmet` y límites de tamaño de payload** en el backend como capa adicional de seguridad HTTP.
