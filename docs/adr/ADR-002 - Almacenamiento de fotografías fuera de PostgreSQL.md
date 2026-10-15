# ADR-002 - Almacenamiento Externo de Fotografías

Estado

Aceptado

Fecha

2026-09

---

# Contexto

Los jugadores pueden disponer de una fotografía de perfil.

---

# Problema

Determinar dónde almacenar las imágenes.

Opciones:

1. PostgreSQL (BLOB)
2. Sistema de ficheros
3. Object Storage
4. CDN

---

# Decisión

PostgreSQL almacenará únicamente una ruta o URL en `jugador.foto`.

En el entorno actual, los archivos se guardan en:

backend/uploads/jugadores/

y se publican bajo:

/uploads/jugadores/...

El contrato de persistencia permite sustituir el almacenamiento local
por almacenamiento de objetos o CDN sin modificar el modelo de jugador.

---

# Justificación

Ventajas:

- Base de datos más ligera
- Backups más rápidos
- Mejor rendimiento
- Escalable

---

# Modelo

jugador

foto

varchar

---

# Evolución Futura

Compatible con:

- Azure Blob Storage
- AWS S3
- Cloudflare R2
- CDN corporativa