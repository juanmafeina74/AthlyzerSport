# AthLyzer Sports Train: especificación de seguridad

Estado: documento de referencia previo a la futura configuración de agentes.
Fecha de revisión: 2026-10-06.

## Controles implementados

- El login verifica contraseñas con bcrypt y emite JWT.
- Las rutas protegidas validan JWT mediante `JwtAuthGuard`; `RolesGuard` y `@Roles(...)` aplican los permisos declarados por endpoint.
- El `ValidationPipe` global rechaza campos no declarados (`whitelist`, `forbidNonWhitelisted`) y transforma DTOs (`transform`).
- `ThrottlerGuard` aplica un límite global de 100 solicitudes por 60 segundos; login aplica un límite más estricto de 5 por 60 segundos. Preservar estos límites salvo decisión explícita y pruebas actualizadas.
- El evaluador de una medición antropométrica procede del usuario autenticado, no del payload.
- Las fotografías se guardan fuera de PostgreSQL y la base de datos conserva su ruta. El almacenamiento actual es local.

La configuración concreta vive en `backend/src/main.ts`, `backend/src/app.module.ts`, los guards y controladores. Inspeccionarla antes de modificarla; esta lista no sustituye el código ni acredita controles de producción aún no implementados.

## Identidad y autorización

- Roles conocidos: `admin`, `usuario`, `jugador`. No crear roles ni deducir permisos basándose solo en el nombre del rol.
- Toda ruta que requiera sesión debe estar protegida por el guard JWT siguiendo el módulo vecino. Añadir guard de roles y declarar el mínimo privilegio en cada operación que lo necesite.
- La autorización efectiva siempre está en backend. Ocultar controles en frontend no es un control de seguridad.
- El frontend conserva actualmente la sesión en `localStorage`; tratar XSS y exposición del token como riesgos conocidos, no afirmar que se usan cookies HttpOnly.
- No aceptar del cliente el evaluador u otra identidad que deba derivarse del JWT.
- Lesiones y mediciones pueden contener información sensible. Limitar acceso y respuestas a lo necesario; confirmar requisitos de confidencialidad antes de ampliar acceso.

## Entrada, credenciales y secretos

- Usar DTOs en cuerpos `POST`, `PUT` y `PATCH`, con `class-validator` y el pipe global. Validar también parámetros, archivos, tamaños y formatos conforme al endpoint.
- Nunca almacenar contraseñas en texto plano ni usar hashes débiles o caseros. No registrar contraseñas, JWT completos, secretos ni cuerpos que puedan contenerlos.
- Leer secretos desde configuración de entorno/gestor de secretos. No versionar `.env`, `JWT_SECRET`, `DATABASE_URL`, credenciales ni datos personales reales.
- Las pruebas deben usar datos ficticios y secretos de prueba.

## Archivos y datos

- No guardar binarios de imágenes en PostgreSQL; persistir solo la referencia. Validar tipo y tamaño en el backend y no confiar en el nombre o MIME declarado por el cliente como única comprobación.
- No cambiar acciones de borrado en Prisma sin revisar su impacto sobre relaciones e historial. Las reglas de protección de temporadas/categorías y la baja lógica de plantillas deben conservarse.
- Aplicar minimización de datos en logs, respuestas y nuevas columnas; no introducir auditoría o retención global sin definir alcance y acceso.

## Controles pendientes de producción

El análisis del proyecto registra como pendientes la configuración productiva explícita de CORS, Helmet/cabeceras, CSP, uso de HTTPS y valorar cookies HttpOnly. No describirlos como controles ya activos. Cualquier habilitación requiere decisión de despliegue y validación de compatibilidad.

## Revisión de seguridad por cambio

Para cada cambio, evaluar según su impacto: autenticación, permisos por rol, datos personales/sanitarios, validación de entradas, abuso/rate limit, errores filtrados, archivos y efectos de migración. Documentar riesgos reales y pruebas aplicables, sin exigir casos irrelevantes para una operación.