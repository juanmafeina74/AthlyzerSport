# ADR-003 - Histórico Jugador-Equipo

Estado

Aceptado

Fecha

2026-09

---

# Contexto

Un jugador puede pertenecer a múltiples equipos a lo largo del tiempo.

---

# Problema

Determinar cómo gestionar los cambios de equipo.

Alternativas:

1. Relación directa jugador-equipo
2. Tabla histórica intermedia

---

# Decisión

Utilizar entidad jugador_equipo.

Incluir:

- fecha_inicio
- fecha_fin
- activo
- dorsal

---

# Justificación

Permite:

- Histórico completo
- Auditoría
- Consultas temporales
- Estadísticas futuras

---

# Regla de Integridad

La retirada de un jugador de una plantilla no elimina físicamente
la relación `jugador_equipo`.

La operación debe:

1. Marcar la relación como inactiva.
2. Informar su fecha de finalización cuando corresponda.
3. Conservar dorsal y fechas como parte del histórico.
4. Reactivar una relación compatible existente cuando el jugador
   vuelva a incorporarse, evitando duplicados innecesarios.

Este ADR no establece por sí solo que un jugador solo pueda tener un
equipo activo. Esa restricción deberá definirse mediante una regla
funcional y, cuando proceda, una restricción de datos.

---

# Consecuencias

Compatible con:

- Transferencias
- Cesiones
- Comparativas históricas
- Evolución jugador