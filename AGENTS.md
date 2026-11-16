# Guía de trabajo

- Mantené `src/`, `test/`, `lib/` y `foundry.toml` como el proyecto Foundry de la raíz.
- Ubicá el contenido educativo de cada ejercicio en `labs/<id>/` y referenciá allí sus contratos y pruebas sin duplicarlos.
- Mantené separados `apps/frontend/` (interfaz) y `apps/backend/` (API y coordinación).
- `research/` debe poder evolucionar sin ser una dependencia para iniciar la plataforma ni ejecutar laboratorios educativos.
- No ejecutes contratos o comandos enviados libremente por usuarios. Las demostraciones de la plataforma deben seleccionar laboratorios conocidos y ejecutarse con aislamiento y límites antes de exponerse desde la web.
- Agregá herramientas, servicios y dependencias cuando una funcionalidad concreta del MVP los necesite.
- Escribí la interfaz y el contenido educativo en español de Argentina, con voseo. Conservá en inglés los nombres de vulnerabilidades y los nombres completos de laboratorios o desafíos (por ejemplo, `Reentrancy`, `Oracle Manipulation`, `Reentrancy Vault` y `Reentrancy Vault Exploitation Lab`), además de los nombres de herramientas y las siglas técnicas.
