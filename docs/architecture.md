# Arquitectura inicial

CryptoGuard se organiza como un monorepo con tres áreas: plataforma educativa (`apps/`), laboratorios (`labs/` junto con el proyecto Foundry de la raíz) e investigación (`research/`).

El frontend presentará los ejercicios y hablará con una única API FastAPI. El backend leerá contenido y código de laboratorios conocidos, evaluará respuestas y, cuando se implemente la demostración, coordinará una ejecución aislada de Foundry y Anvil. Las rutas del código Solidity parten de `src/`; las pruebas, de `test/`; la dependencia `forge-std` está en `lib/`.

`research/` puede producir un caso que luego se revise y convierta en laboratorio versionado, pero la plataforma no ejecuta directamente scripts experimentales. PostgreSQL, Docker, CI y los componentes de investigación se incorporarán según las necesidades del MVP, sin crear servicios separados para cada módulo.

El primer recorrido previsto es: seleccionar reentrancy, leer la explicación, observar el contrato en Monaco, responder preguntas, ejecutar una demostración controlada y recibir feedback.
