## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```

### Para compilar

```shell
forge build
```

### Para ejecutar los tests con trace

```shell
forge test -vvvv
```

### Extraer el runtime bytecode a binario (.bin) con jq

jq -r '.deployedBytecode.object' out/contract-1.sol/Reentrance.json > Reentrance.bin
jq -r '.deployedBytecode.object' out/attacker.sol/Attacker.json     > Attacker.bin

### validar que tengan hex adentro

head -c 80 Reentrance.bin ; echo
head -c 80 Attacker.bin   ; echo

### Decompilar a pseudo-codigo con heimdall-rs

heimdall decompile Reentrance.bin -o ./heimdall-reentrance --include-sol --skip-resolving
heimdall decompile Attacker.bin   -o ./heimdall-attacker   --include-sol --skip-resolving

#### Para ver el pseudo-Solidity generado

cat heimdall-reentrance/decompiled.sol
cat heimdall-attacker/decompiled.sol
