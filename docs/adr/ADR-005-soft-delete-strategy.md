# ADR-005 - Estrategia de Borrado Lógico

Estado

Aceptado

Fecha

2026-09

---

# Contexto

AthLyzer gestiona información histórica deportiva.

---

# Problema

Determinar cuándo eliminar físicamente información.

---

# Decisión
 
El borrado lógico se aplica actualmente a la relación `jugador_equipo`.
 
No se establece todavía una política global de borrado lógico para
todas las entidades de AthLyzer.
 
Ampliación acordada el 2026-10-06: no se permite el borrado físico de
equipos, tengan o no mediciones. Se conservan los vínculos históricos
medición-jugador-equipo y se protegen las relaciones medición-equipo y
equipo-temporada con Restrict. No se introduce una baja lógica de equipos
ni una política nueva para el resto de entidades.

Para cada entidad nueva deberá decidirse explícitamente entre:
 
- Eliminación física.
- Desactivación.
- Borrado lógico.
- Anonimización.
- Retención histórica.
 
La decisión dependerá de sus requisitos funcionales, de auditoría,
integridad y protección de datos.

---

# Justificación

Permite:

- Auditoría
- Histórico
- Recuperación
- Reporting

---

# Aplicación

Especialmente en:

- jugador_equipo
- usuarios
- evaluaciones
- registros deportivos

---

# Excepciones

Ficheros temporales.

Cache.

Datos explícitamente marcados para purga.