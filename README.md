# CryptoGuard

CryptoGuard es una plataforma educativa sobre seguridad de smart contracts EVM. El primer objetivo es un laboratorio de reentrancy que permita estudiar un contrato vulnerable, analizar el fallo y observar una demostración controlada.

## Estado actual

El frontend incluye la portada, el dashboard y el laboratorio guiado Reentrancy Vault. El progreso se guarda en el navegador. El backend y la ejecución de contratos desde la plataforma están pendientes.

El proyecto Foundry se encuentra en la raíz. Incluye contratos en `src/`, pruebas en `test/`, la biblioteca `forge-std` en `lib/` y la configuración en `foundry.toml`.

El contrato de `src/contracts/reentrance/contract-1.sol` es vulnerable a propósito. No debe desplegarse en redes públicas ni utilizarse para custodiar fondos.

## Desarrollo local

Cloná el repositorio completo. El visor del laboratorio lee archivos de `src/` y `test/`. Para levantar la interfaz necesitás Make, npm y una versión de Node.js compatible con Vite (`^20.19.0 || >=22.12.0`).

Desde la raíz del repositorio, instalá las dependencias e iniciá el frontend:

```bash
make install
make dev
```

Abrí [http://127.0.0.1:5173/](http://127.0.0.1:5173/) en tu navegador. Para detener el servidor, usá `Ctrl+C` en la terminal que lo ejecuta.

`make install` instala los paquetes del `package-lock.json` en `apps/frontend/node_modules/`. Para generar el build de producción en `apps/frontend/dist/`, ejecutá `make build`. Los comandos directos de npm están en el [README del frontend](apps/frontend/README.md).

## Foundry

Foundry es el conjunto de herramientas que usa el proyecto para desarrollar y probar contratos EVM:

- **Forge:** compila contratos y ejecuta pruebas y scripts.
- **Cast:** consulta datos e interactúa con contratos mediante RPC.
- **Anvil:** inicia un nodo Ethereum local para desarrollo.
- **Chisel:** permite experimentar con Solidity en una consola interactiva.

Documentación de Foundry: https://book.getfoundry.sh/

Con Foundry instalado, ejecutá estos comandos desde la raíz del repositorio:

| Tarea | Comando |
| --- | --- |
| Compilar contratos | `forge build` |
| Ejecutar todas las pruebas | `forge test` |
| Formatear código Solidity | `forge fmt` |
| Generar una captura de consumo de gas | `forge snapshot` |
| Iniciar un nodo local | `anvil` |
| Ver opciones de interacción con contratos | `cast --help` |
| Ver ayuda de cada herramienta | `forge --help`, `anvil --help`, `cast --help` |

El README original incluía también `cast <subcommand>` como ejemplo general de uso de Cast. Para desplegar usaba `forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>`, un ejemplo de la plantilla de Foundry: **`script/Counter.s.sol` no existe en CryptoGuard**, por lo que ese comando no se puede ejecutar aquí. Cuando agreguemos un script propio de demostración, documentaremos su comando de ejecución con Anvil.

## Organización

- `src/`, `test/`, `lib/` y `foundry.toml`: proyecto Foundry compartido por los laboratorios educativos.
- `labs/`: explicaciones, preguntas y referencias a contratos y pruebas de cada laboratorio.
- `apps/frontend/`: interfaz React y Vite.
- `apps/backend/`: futura API FastAPI y coordinación de demostraciones.
- `research/`: análisis y experimentos independientes de la plataforma.
- `infra/`: configuración de los entornos locales cuando sea necesaria.
- `docs/`: decisiones de arquitectura y documentación técnica.
- `.github/workflows/`: futura integración continua propia del proyecto.

La organización acordada se detalla en [docs/architecture.md](docs/architecture.md).
