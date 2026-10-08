# ADR-006 - Seguridad Basada en Roles

Estado

Aceptado

Fecha

2026-09

---

# Contexto

La aplicación dispone de múltiples perfiles de usuario.

---

# Roles

admin

usuario

jugador

---

# Decisión

La autorización se realiza exclusivamente en backend.

Mediante:

- JwtAuthGuard
- RolesGuard

---

# Justificación

La interfaz no es una medida de seguridad.

Ocultar botones no implica autorización.

---

# Regla de Autorización
 
Los permisos se determinan por endpoint y caso de uso.
 
Matriz actual resumida:
 
- Usuarios: admin.
- Categorías: admin.
- Equipos: lectura autenticada; mutaciones admin.
- Jugadores: lectura autenticada; mutaciones admin.
- Temporadas: lectura autenticada; mutaciones admin.
- Plantillas: lectura autenticada; asignación y retirada admin.
- Mediciones antropométricas: admin y usuario.
 
La protección del frontend es una medida de experiencia de usuario.
La autorización efectiva y obligatoria se aplica en el backend.

---

# Consecuencias

Un usuario sin permisos nunca debe poder ejecutar una acción administrativa aunque manipule el frontend.