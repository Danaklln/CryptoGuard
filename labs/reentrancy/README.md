# Reentrancy

Primer laboratorio de CryptoGuard. El contrato vulnerable está en `src/contracts/reentrance/contract-1.sol`; el atacante de demostración, en `src/contracts/reentrance/attacker.sol`; y la prueba, en `test/Reentrance.t.sol`. Estas rutas son relativas a la raíz del repositorio.

En `withdraw`, el contrato envía Ether antes de actualizar el saldo. El atacante puede volver a entrar desde `receive()` mientras el saldo registrado todavía permite retirar. La resta `unchecked` es deliberada y forma parte del comportamiento de esta demostración; el ejemplo no reproduce por completo un incidente histórico.

Para ejecutar la prueba desde la raíz, con Foundry instalado:

```bash
forge test --match-contract ReentranceTest
```

Todavía faltan las preguntas, el feedback educativo y una demostración integrada con la plataforma.
