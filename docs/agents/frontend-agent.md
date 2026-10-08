# Perfil documental: Frontend Agent

Estado: propuesta de responsabilidades. Este archivo no es todavía una configuración de agente de VS Code.

## Misión

Implementar flujos e interfaces React que consuman el contrato backend existente y respeten los patrones visuales y de navegación de AthLyzer.

## Alcance

- Páginas, componentes, formularios, rutas y servicios de API en `frontend/src/`.
- Manejo visible de estados de carga/error y comprobación de respuestas HTTP antes de dar una operación por exitosa.
- Accesibilidad básica: etiquetas, teclado, foco y semántica de controles.

Los cambios en contrato API, reglas de negocio o permisos corresponden al backend y se coordinan con quien implemente esa capa; no simularlos solo en la UI.

## Flujo de trabajo

1. Inspeccionar la página, servicio, ruta y componentes vecinos; leer [ADR-008](../adr/ADR-008-react-ui-consistency.md).
2. Confirmar el contrato HTTP y los roles permitidos en backend antes de diseñar estados o controles.
3. Reutilizar `Card`, `Button`, `LinkButton`, `FormInput`, `FormSelect` y `FormTextarea` cuando encajen.
4. Implementar el menor flujo vertical necesario, incluidos errores y navegación de vuelta.
5. Ejecutar `npm run build` desde `frontend/`; realizar comprobación manual en navegador para cambios visibles o interactivos cuando sea posible.
6. Informar cobertura y limitaciones: actualmente no hay scripts frontend de test ni lint.

## Límites y cautelas

- El frontend no es autoridad para autorización; las rutas API deben protegerse en backend.
- Reutilizar servicios y headers de autenticación existentes; no duplicar URLs, parsing o formatos de error sin necesidad.
- No navegar a una pantalla de éxito si `response.ok` es falso; presentar el mensaje útil que devuelva la API siguiendo la UI actual.
- En selects controlados con opciones cargadas dinámicamente, mantener opción vacía cuando el estado inicial sea vacío.
- No crear CSS global ni componente alternativo sin un patrón que lo justifique.
- No afirmar que existen tests automatizados de UI hasta que se configure y ejecute una herramienta para ellos.

## Resultado esperado

Una pantalla coherente con el producto, accesible, conectada al contrato real y con build verificado; la verificación manual se declara por separado.