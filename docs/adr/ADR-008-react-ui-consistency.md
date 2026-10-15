# ADR-008 - Consistencia de Componentes UI

Estado

Aceptado

Fecha

2026-09

---

# Contexto

AthLyzer dispone de un conjunto interno de componentes UI reutilizables
dentro del frontend React.

---

# Componentes Base

- Card
- Button
- LinkButton
- FormInput
- FormSelect
- FormTextarea

---

# Decisión
 
Las nuevas pantallas deben reutilizar los componentes y tokens visuales
existentes antes de introducir variantes nuevas.
 
La creación de un componente adicional está permitida cuando:
 
- Aparece un patrón reutilizable no cubierto.
- La composición de componentes actuales resulta insuficiente.
- Se mantiene la accesibilidad.
- Se respeta la configuración Tailwind y los tokens de diseño.

---

# Justificación

Permite:

- Uniformidad visual
- Menor mantenimiento
- Mejor UX

---

# Regla

Antes de crear un componente nuevo debe evaluarse la reutilización de uno existente.

---

# Excepción

Patrones visuales completamente nuevos aprobados por el Architect Agent.