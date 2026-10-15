# ADR-001 - Autenticación basada en JWT

Estado

Aceptado

Fecha

2026-09

---

# Contexto

AthLyzer requiere autenticar usuarios desde una aplicación React consumiendo una API NestJS.

La aplicación debe:

- ser stateless
- escalar horizontalmente
- funcionar en despliegues cloud
- soportar múltiples clientes

---

# Problema

Era necesario seleccionar una estrategia de autenticación.

Alternativas evaluadas:

1. Sessions en servidor
2. JWT
3. OAuth completo
4. OpenID Connect

---

# Decisión

AthLyzer utiliza autenticación basada en access tokens JWT emitidos y
verificados por el backend NestJS.

El frontend conserva actualmente la respuesta de autenticación, incluido
el accessToken, en localStorage bajo la clave `athlyzer_user`.

Las solicitudes protegidas envían el token mediante:

Authorization: Bearer <accessToken>

Actualmente no se utilizan refresh tokens. Cuando el token caduca, el
usuario debe volver a iniciar sesión.

---

# Consecuencias

Beneficios

- Escalable
- Stateless
- Compatible con SPA React
- Fácil integración futura

Costes

- Gestión de expiración
- Revocación más compleja

---

# Futuras Evoluciones
Las siguientes posibilidades todavía no forman parte de la decisión aceptada:
 
- Incorporación de refresh tokens.
- Sustitución de localStorage por cookies seguras HttpOnly.
- Integración con un proveedor OpenID Connect.
- Integración futura con Microsoft Entra ID.
 
Cualquiera de estos cambios requerirá un nuevo ADR o la sustitución
formal de este ADR.