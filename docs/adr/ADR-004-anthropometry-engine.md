# ADR-004 - Motor de Cálculo Antropométrico

Estado

Aceptado

Fecha

2026-09

---

# Contexto

AthLyzer incorpora evaluación ISAK.

---

# Problema

Determinar dónde deben realizarse los cálculos.

Opciones:

1. Frontend
2. Backend

---

# Decisión
 
El backend es la fuente autoritativa de los resultados antropométricos
persistidos.
 
El frontend puede realizar cálculos reactivos para ofrecer
previsualizaciones durante la captura, pero dichos valores no sustituyen
los resultados calculados y validados por el backend.
 
El frontend envía las medidas brutas. El backend calcula y persiste,
como mínimo:
 
- Sumatorias de pliegues.
- Porcentaje de grasa.
- Componentes del somatotipo.
 
El identificador del evaluador se obtiene del JWT autenticado y nunca
del body de la petición.
 
La masa muscular permanecerá sin calcular hasta disponer de una fórmula
validada y de todas las variables requeridas.

Ampliación acordada el 2026-10-06: las reglas de cálculo anteriores se
aplican a ISAK. BASICA registra peso, talla, cintura opcional y observaciones
opcionales, sin calcular indicadores derivados. Cada medición conserva su
protocolo y resultados originales aunque cambie la modalidad del equipo.

---

# Justificación

Ventajas:

- Fuente única de verdad
- Consistencia
- Auditoría
- Evita manipulaciones

---

# Responsabilidades

Frontend:

- captura datos
- visualización

Backend:

- sumatorios
- grasa corporal
- somatotipo
- somatocarta

---

# Regla

El frontend nunca será considerado fuente oficial de resultados.