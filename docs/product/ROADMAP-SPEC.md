# AthLyzer Roadmap Specification

Version: 1.0

Owner: Product Management

Status: Active

Last Review: 2026-10

---

Este roadmap expresa dirección y prioridades propuestas, no un compromiso de entrega ni una autorización para ampliar una tarea. Los estados de funcionalidades completadas deben contrastarse con el código actual y actualizarse cuando cambie la implementación. La especificación de producto describe el alcance confirmado; el análisis técnico registra evidencia y limitaciones.

# Visión Estratégica

AthLyzer debe evolucionar desde una aplicación de gestión deportiva y antropometría a una plataforma integral de gestión del rendimiento deportivo.

La plataforma debe permitir gestionar:

- Estructura deportiva
- Jugadores
- Equipos
- Rendimiento
- Salud
- Planificación
- Evaluaciones
- Históricos
- Analítica

Todo ello manteniendo:

- Escalabilidad
- Seguridad
- Auditoría
- Trazabilidad completa

---

# Estado Actual

Version Actual

Foundation Platform

---

# Funcionalidades Completadas

## Seguridad

- Login JWT
- Roles
- Guards
- Rate limiting
- Validación DTO

---

## Organización Deportiva

- Usuarios
- Roles
- Categorías
- Equipos
- Temporadas

---

## Gestión Deportiva

- Jugadores
- Plantillas
- Histórico jugador-equipo
- Fotografías

---

## Antropometría

- Protocolo ISAK
- Somatotipo
- Somatocarta
- Histórico mediciones

---

## Calidad Técnica

- Testing backend
- DTO Validation
- Prisma
- React + TypeScript
- UI unificada

---

# Objetivo General 2027

Convertir AthLyzer en un ecosistema completo para clubes deportivos.

---

# Roadmap Fase 1

Estado

Prioridad Alta

Objetivo

Completar gestión deportiva básica.

---

## RF-001 Gestión de Posiciones

Estado:

Pendiente

Objetivo:

Asignar posiciones deportivas a jugadores.

Ejemplos:

- Portero
- Defensa
- Centrocampista
- Delantero

Beneficios:

- Mejor segmentación
- Informes
- Convocatorias

---

## RF-002 Dashboard Deportivo

Estado:

Pendiente

Objetivo:

Visualizar KPIs principales.

Indicadores:

- Jugadores activos
- Equipos activos
- Lesiones activas
- Mediciones recientes
- Distribución categorías

---

## RF-003 Refresh Tokens

Estado:

Pendiente

Objetivo:

Mejorar experiencia de autenticación.

Beneficios:

- Menos relogins
- Mayor seguridad

---

## RF-004 Auditoría Global

Estado:

Pendiente

Objetivo:

Registrar todas las acciones críticas.

Eventos:

- Crear jugador
- Editar jugador
- Borrar jugador
- Login
- Cambios administrativos

---

## RF-005 Notificaciones

Estado:

Pendiente

Objetivo:

Sistema de alertas.

Casos:

- Lesiones
- Evaluaciones pendientes
- Jugadores inactivos

---

# Roadmap Fase 2

Estado

Prioridad Muy Alta

Objetivo

Construir plataforma de rendimiento deportivo.

---

## RF-101 Planes de Entrenamiento

Descripción:

Diseño y gestión de entrenamientos.

Entidades:

- Plan
- Sesión
- Ejercicio
- Bloque

Capacidades:

- Plantillas
- Duplicación
- Historial

---

## RF-102 Biblioteca de Ejercicios

Descripción:

Repositorio centralizado.

Metadatos:

- Categoría
- Nivel
- Objetivo
- Material

Contenido:

- Imagen
- Vídeo
- Descripción

---

## RF-103 Control de Carga

Descripción:

Seguimiento de esfuerzo.

Métricas:

- RPE
- Duración
- Volumen
- Carga aguda
- Carga crónica

---

## RF-104 Asistencia

Descripción:

Registro asistencia entrenamientos.

Estados:

- Asiste
- Ausente
- Lesionado
- Justificado

---

## RF-105 Convocatorias

Descripción:

Gestión de convocados.

Capacidades:

- Selección
- Confirmación
- Historial

---

# Roadmap Fase 3

Estado

Prioridad Alta

Objetivo

Área médica y salud deportiva.

---

## RF-201 Gestión Médica

Descripción:

Historial médico del jugador.

Capacidades:

- Diagnósticos
- Tratamientos
- Observaciones

---

## RF-202 Gestión de Lesiones

Descripción:

Ampliación módulo actual.

Información:

- Tipo lesión
- Gravedad
- Tiempo recuperación
- Fase recuperación

---

## RF-203 Retorno al Juego

Descripción:

Workflow médico.

Estados:

- Tratamiento
- Readaptación
- Alta médica
- Alta deportiva

---

## RF-204 Cuestionarios Wellness

Descripción:

Control diario bienestar.

Variables:

- Sueño
- Fatiga
- Estrés
- Dolor muscular

---

# Roadmap Fase 4

Estado

Prioridad Media

Objetivo

Análisis avanzado.

---

## RF-301 Analytics

KPIs:

- Evolución física
- Tendencias lesiones
- Comparativas temporada

---

## RF-302 Informes PDF

Generación automática de:

- Fichas jugador
- Informes físicos
- Informes equipo

---

## RF-303 Exportación Excel

Exportables:

- Equipos
- Jugadores
- Evaluaciones
- Lesiones

---

## RF-304 Comparativas Avanzadas

Comparar:

- Jugador vs Jugador
- Jugador vs Categoría
- Jugador vs Temporada

---

# Roadmap Fase 5

Estado

Prioridad Media

Objetivo

Experiencia digital avanzada.

---

## RF-401 Portal del Jugador

Acceso personal.

Funciones:

- Perfil
- Métricas
- Historial
- Evaluaciones

---

## RF-402 Portal del Entrenador

Funciones:

- Equipos
- Entrenamientos
- Convocatorias
- Estadísticas

---

## RF-403 Aplicación Móvil

React Native.

Módulos:

- Login
- Calendario
- Convocatorias
- Evaluaciones

---

# Roadmap Arquitectónico

## RA-001 CI/CD

Prioridad:

Crítica

Objetivo:

Automatizar:

- Build
- Test
- Lint

---

## RA-002 Security Hardening

Objetivo:

Implementar:

- Helmet
- CSP
- HTTPS
- Refresh tokens

---

## RA-003 Observabilidad

Objetivo:

Implementar:

- Logs estructurados
- Métricas
- Alertas

---

## RA-004 Multi-Club

Objetivo:

Preparar AthLyzer para múltiples organizaciones.

Conceptos:

- Club
- Sede
- Organización

---

# Perfiles Propuestos para Futuros Agentes

Los documentos de `docs/agents/` describen responsabilidades propuestas. Por ahora son documentación de preparación: no son agentes registrados ni archivos de configuración invocables de VS Code. Su conversión a agentes ejecutables requiere una decisión y una tarea posterior.

## Architect Agent

Responsable:

Diseño y análisis.

---

## Backend Agent

Responsable:

APIs y negocio.

---

## Frontend Agent

Responsable:

Experiencia usuario.

---

## QA Agent

Responsable:

Calidad.

---

## Futuro Product Agent

Responsable:

Historias de usuario.
Priorización.
Roadmap.

---

# Criterios de Priorización

Las nuevas funcionalidades deben valorarse según:

1. Impacto deportivo.

2. Impacto en usuario.

3. Complejidad técnica.

4. Riesgo.

5. Reutilización futura.

6. Valor estratégico.

---

# Restricciones

No introducir funcionalidades que:

- rompan históricos
- generen deuda técnica
- reduzcan seguridad
- dupliquen capacidades existentes

---

# Objetivo Final

AthLyzer debe convertirse en una plataforma integral de gestión deportiva, rendimiento físico y seguimiento de atletas, manteniendo una arquitectura moderna, escalable y orientada a datos.
