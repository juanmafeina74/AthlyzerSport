# ADR-007 - Prisma como Capa Única de Acceso a Datos

Estado

Aceptado

Fecha

2026-09

---

# Contexto

AthLyzer utiliza PostgreSQL.

---

# Problema

Definir una estrategia uniforme de acceso a datos.

---

# Decisión
 
Prisma Client es la capa estándar de acceso a PostgreSQL desde el
backend de AthLyzer en tiempo de ejecución.
 
El esquema de referencia se mantiene en:
 
backend/prisma/schema.prisma
 
Las modificaciones de estructura deben gestionarse mediante migraciones
Prisma.
 
Los scripts SQL históricos o administrativos no deben convertirse en
una segunda capa de persistencia de la aplicación.
 
El uso de SQL nativo requerirá:
 
- Justificación técnica.
- Consultas parametrizadas.
- Pruebas específicas.
- Revisión arquitectónica.

---

# Reglas

Utilizar Prisma Client.

Evitar SQL directo.

---

# Excepciones

Únicamente para:

- optimización crítica
- reporting complejo
- limitaciones del ORM

---

# Beneficios

- Mantenibilidad
- Tipado TypeScript
- Menos errores
- Productividad