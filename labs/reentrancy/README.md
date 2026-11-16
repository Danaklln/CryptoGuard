# Reentrancy Vault

Primer laboratorio de CryptoGuard. El contrato vulnerable está en `src/contracts/reentrance/contract-1.sol`; el atacante de demostración, en `src/contracts/reentrance/attacker.sol`; y la prueba, en `test/Reentrance.t.sol`. Estas rutas son relativas a la raíz del repositorio.

En `withdraw`, el contrato envía Ether antes de actualizar el saldo. El atacante puede volver a entrar desde `receive()` mientras el saldo registrado todavía permite retirar. La resta `unchecked` es deliberada y forma parte del comportamiento de esta demostración; el ejemplo no reproduce por completo un incidente histórico.

Para ejecutar la prueba desde la raíz, con Foundry instalado:

```bash
forge test --match-contract ReentranceTest
```

El recorrido guiado está en `/#reentrancy`. Incluye seis secciones con preguntas y feedback, un visor de código y una demostración interactiva basada en los resultados esperados de `test_drain`. La demostración se recorre en el navegador y las respuestas correctas se guardan localmente. Para ejecutar la prueba en una EVM, usá Forge desde la raíz.

`lesson.js` define el contenido educativo y referencia los archivos de Foundry que se muestran en el visor.
