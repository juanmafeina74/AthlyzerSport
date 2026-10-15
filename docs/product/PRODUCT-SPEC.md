# AthLyzer Sports Train: especificación de producto

Estado: documento de referencia previo a la futura configuración de agentes.
Fecha de revisión: 2026-10-08.

## Propósito y alcance

AthLyzer Sports Train es una aplicación web para centralizar la gestión deportiva de jugadores, equipos, temporadas y categorías, junto con información de lesiones y evaluaciones antropométricas. El producto actual está implementado como una aplicación para una organización: no existe todavía un modelo de clubes, tenants ni separación de datos entre organizaciones.

Esta especificación distingue el comportamiento confirmado en el código de las ideas de evolución. Si esta descripción difiere del comportamiento implementado, no se debe cambiar el contrato por inferencia: se debe confirmar el requisito con la persona solicitante y actualizar esta documentación cuando la decisión sea aceptada.

## Objetivos

- Centralizar la información deportiva y administrativa disponible en la aplicación.
- Mantener el historial de pertenencia de jugadores a equipos.
- Permitir registrar mediciones antropométricas y consultar su evolución.
- Facilitar la gestión de temporadas, categorías, equipos, jugadores y usuarios.
- Proteger datos personales y de salud mediante permisos aplicados en backend.

La trazabilidad es actualmente específica: se conserva el historial de la relación jugador-equipo y se registra el evaluador de cada medición. No existe un registro de auditoría general para todas las entidades.

## Roles y alcance actual

Los nombres de rol existentes son `admin`, `usuario` y `jugador`. El permiso efectivo se define en cada endpoint backend; la visibilidad de una ruta o botón frontend no concede ni revoca acceso por sí misma.

| Rol | Capacidades confirmadas |
|---|---|
| `admin` | Administración de usuarios y operaciones administrativas de categorías, temporadas, equipos, jugadores y plantillas. También accede a lesiones y mediciones. Las restricciones de negocio de borrado siguen aplicando. |
| `usuario` | Acceso a operaciones de lesiones y a consulta/registro antropométrico según los endpoints protegidos actuales. No asumir permisos de administración de otros módulos. |
| `jugador` | El rol existe, pero no hay que inferir un portal ni acceso limitado a la ficha propia: ese alcance está pendiente de diseño e implementación explícitos. |

Los `GET` de otros módulos pueden admitir cualquier usuario autenticado; se debe verificar el controlador y sus guards antes de definir permisos de una nueva operación.

## Capacidades implementadas

- Autenticación mediante credenciales, bcrypt y JWT; autorización por roles en backend.
- Gestión de usuarios, categorías, temporadas, equipos y jugadores.
- Gestión de plantilla jugador-equipo, con altas individuales/en bloque y baja lógica que conserva la relación histórica.
- Posiciones: catálogo administrable por `admin`, posición preferida opcional del jugador y posición principal opcional por pertenencia jugador-equipo, mantenibles desde las pantallas de administración, jugador y plantilla.
- Lesiones: consulta, alta y cambio de fase de readaptación. Esto no equivale a un CRUD completo.
- Antropometría: alta de mediciones e historial por jugador. El servidor calcula y persiste resultados derivados.
- Fotografía de jugador almacenada como archivo; la base de datos conserva una referencia, no el binario.
- Interfaz React con rutas privadas y componentes UI compartidos.

El inventario detallado de endpoints y pantallas debe contrastarse con el código y con [el análisis del proyecto](../ANALISIS-PROYECTO.md), cuya fecha de referencia puede ser anterior a este documento.

## Reglas de negocio confirmadas

- Para iniciar sesión, el usuario debe existir, estar activo, tener una contraseña válida y tener un rol asignado.
- Una categoría con equipos asociados no se puede eliminar.
- Una temporada con equipos asociados no se puede eliminar. No confiar en cascadas de base de datos para saltarse esta regla.
- Quitar un jugador de una plantilla desactiva la relación y conserva su historial; una asignación posterior puede reactivar la relación existente.
- La posición preferida pertenece al jugador; la posición principal asignada a una plantilla pertenece a la relación jugador-equipo y puede ser distinta. Se conserva una sola posición principal por pertenencia.
- El evaluador de una medición se obtiene de la identidad autenticada en el JWT, nunca de un identificador confiado del body.
- Los equipos existentes se inicializan con ISAK; los nuevos usan BASICA por defecto. Solo admin puede cambiar su modalidad.
- Con pertenencias activas, cada medición requiere seleccionar explícitamente un equipo y usar su modalidad vigente. Sin equipos activos, se elige BASICA o ISAK al registrar y se guarda sin equipo. No se registran mediciones de pertenencias finalizadas.
- El protocolo, equipo de origen y resultados de una medición no cambian al reconfigurar el equipo. Las mediciones previas a esta funcionalidad se conservan como ISAK sin atribuirles equipo.
- No se permite el borrado físico de equipos; se conservan los vínculos históricos con sus mediciones. Esta regla no implica una política global de baja lógica.
- Las fotografías no se almacenan en PostgreSQL. El almacenamiento actual es local y no debe tratarse como una solución distribuida de producción.
- Los resultados antropométricos persistidos se calculan en backend. La previsualización del frontend no es fuente de verdad.
- BASICA solo recoge peso, talla, cintura opcional y observaciones opcionales; no calcula grasa, músculo, sumatorias ni somatotipo. ISAK conserva sus seis pliegues obligatorios y el calculador existente.

## Fuera del alcance confirmado / evolución

Son ideas, no requisitos actuales: planificación de entrenamientos, portal del jugador, aplicación móvil, gestión documental, analítica avanzada, varios clubes/deportes y una auditoría global. El modelo actual admite una posición principal por jugador-equipo; admitir varias posiciones simultáneas en la misma pertenencia requeriría ampliar la relación. El cálculo de masa muscular solo debe incorporarse cuando se acuerden y validen sus variables y fórmula. Las iniciativas futuras y su priorización se recogen en [ROADMAP-SPEC.md](ROADMAP-SPEC.md); ese documento no implica por sí mismo compromiso de implementación.

## Criterio para nuevas funcionalidades

Una funcionalidad nueva debe resolver un caso de uso solicitado, preservar las reglas e historiales existentes y definir sus permisos, datos sensibles y criterios de aceptación. No introducir alcance futuro como requisito técnico sin confirmación explícita.