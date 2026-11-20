import vault from '../../src/contracts/reentrance/contract-1.sol?raw'
import attacker from '../../src/contracts/reentrance/attacker.sol?raw'
import test from '../../test/Reentrance.t.sol?raw'

export const reentrancy = {
  id: 'reentrancy',
  title: 'Reentrancy Vault',
  description: 'Analizá cómo una llamada externa permite retirar más ETH del que se depositó y aprendé a corregir el orden de las operaciones.',
  files: {
    vault: { name: 'contract-1.sol', source: vault },
    attacker: { name: 'attacker.sol', source: attacker },
    test: { name: 'Reentrance.t.sol', source: test },
  },
  sections: [
    {
      id: 'introduccion',
      title: 'Introducción a Reentrancy',
      paragraphs: [
        'Cuando un contrato transfiere ETH a otro contrato, el receptor puede ejecutar su propio código durante la transferencia. Si ese código vuelve a llamar al contrato original antes de que termine la primera operación, la segunda llamada puede encontrar un estado que todavía no se actualizó.',
        'En 2016, el ataque a The DAO mostró las consecuencias de este patrón. Una función se invocó de forma recursiva y permitió transferir ETH varias veces dentro de una misma transacción. En este laboratorio vas a estudiar una bóveda simplificada para entender el mismo mecanismo.',
      ],
      source: { label: 'Informe de Ethereum sobre The DAO', url: 'https://blog.ethereum.org/2016/06/17/critical-update-re-dao-vulnerability' },
      code: { file: 'vault', from: 4, to: 19 },
      question: '¿Qué tiene que poder hacer el contrato receptor para que haya Reentrancy?',
      answers: [
        'Volver a invocar el contrato original antes de que termine la primera llamada.',
        'Esperar a que la primera transacción termine y enviar otra.',
        'Modificar directamente el saldo almacenado por la bóveda.',
      ],
      correct: 0,
      feedback: 'La llamada al receptor cede el control. El receptor puede volver a entrar mientras la llamada original sigue pendiente.',
      hint: 'Pensá qué ocurre durante la transferencia, antes de que la bóveda recupere el control.',
    },
    {
      id: 'contrato',
      title: 'Conocer la bóveda',
      paragraphs: [
        'La bóveda distingue dos cantidades. Por un lado, el ETH que posee el contrato en total. Por otro, el saldo que registra para cada cuenta en el mapping balances.',
        'deposit() acredita el ETH recibido a quien llamó. withdraw() consulta ese saldo para decidir si el retiro está permitido. El saldo registrado es la cuenta que lleva la bóveda para cada depositante.',
      ],
      code: { file: 'vault', from: 4, to: 13 },
      question: 'Si dos cuentas distintas depositan 5 ETH cada una, ¿qué queda registrado?',
      answers: [
        'Una sola cuenta con 10 ETH registrados.',
        '10 ETH en la bóveda y 5 ETH registrados para cada cuenta.',
        '5 ETH en la bóveda y 10 ETH registrados para cada cuenta.',
      ],
      correct: 1,
      feedback: 'Cada depósito incrementa balances[msg.sender]. La bóveda recibe 10 ETH en total y conserva dos saldos individuales de 5 ETH.',
      hint: 'Mirá qué dirección se usa como clave en deposit().',
    },
    {
      id: 'fallo',
      title: 'Encontrar el fallo',
      paragraphs: [
        'Seguí withdraw() en orden. Primero comprueba que el saldo alcanza, después envía ETH mediante call y recién cuando esa llamada termina descuenta el importe.',
        'Si el receptor llama a withdraw() durante call, la comprobación se vuelve a ejecutar con el saldo anterior. En este ejemplo, unchecked permite que las restas al volver de las llamadas anidadas desborden sin revertir toda la transacción.',
      ],
      code: { file: 'vault', from: 11, to: 18, highlight: [13, 16] },
      question: '¿Qué orden de operaciones deja abierta la vulnerabilidad?',
      answers: [
        'Consultar el saldo antes de verificar el importe.',
        'Descontar el saldo antes de enviar ETH.',
        'Enviar ETH y descontar el saldo después de la llamada externa.',
      ],
      correct: 2,
      feedback: 'La línea que envía ETH se ejecuta antes del descuento. Por eso cada llamada anidada todavía ve el saldo original.',
      hint: 'Compará dónde aparece msg.sender.call con dónde aparece el descuento en balances.',
    },
    {
      id: 'atacante',
      title: 'Comprender el atacante',
      paragraphs: [
        'El contrato atacante deposita 1 ETH y pide retirar ese mismo importe. Cuando la bóveda envía el primer ETH, la función receive() del atacante vuelve a llamar a withdraw().',
        'Cada llamada anidada pide el mismo importe. receive() deja de volver a entrar cuando la bóveda ya no tiene ETH suficiente para otro retiro. Entonces las llamadas pendientes terminan en orden inverso.',
      ],
      code: { file: 'attacker', from: 17, to: 27, highlight: [22, 25] },
      question: '¿Qué dispara el siguiente retiro?',
      answers: [
        'El depósito inicial llama a receive() de forma automática.',
        'La recepción de ETH ejecuta receive(), que vuelve a invocar withdraw() si quedan fondos.',
        'Foundry inicia una segunda transacción para cada retiro.',
      ],
      correct: 1,
      feedback: 'receive() se ejecuta dentro de la transferencia que hizo la bóveda. Desde ahí se encadena el siguiente retiro en la misma transacción.',
      hint: 'Buscá la llamada a target.withdraw() que aparece dentro de receive().',
    },
    {
      id: 'demostracion',
      title: 'Comprobar el ataque',
      paragraphs: [
        'La prueba test_drain parte de dos depósitos de 5 ETH. Recorré el escenario para ver qué pasa con los fondos desde el depósito del atacante hasta las comprobaciones finales de la prueba.',
      ],
      code: { file: 'test', from: 28, to: 45, highlight: [29, 40, 41] },
      demonstration: true,
      question: 'Si el atacante aportó 1 ETH y termina con 11 ETH en su contrato, ¿cuánto obtuvo de los otros depositantes?',
      answers: ['10 ETH.', '11 ETH.', '1 ETH.'],
      correct: 0,
      feedback: 'Los 11 ETH finales incluyen el ETH que aportó el atacante. Los otros 10 ETH eran los depósitos de las víctimas.',
      hint: 'Restá del saldo final del atacante lo que aportó al iniciar el ataque.',
    },
    {
      id: 'prevencion',
      title: 'Prevenir Reentrancy',
      paragraphs: [
        'Aplicá Checks-Effects-Interactions. Primero verificá el saldo, después descontá el importe y al final enviá ETH. Si falla la transferencia y la función revierte, la EVM también revierte el descuento.',
        'En el contrato actual, la llamada anidada pasa porque sigue viendo 1 ETH acreditado. Con el saldo actualizado antes de transferir, esa misma llamada ve 0 ETH registrados y falla la comprobación.',
      ],
      source: { label: 'Documentación de Solidity sobre Reentrancy', url: 'https://docs.soliditylang.org/en/latest/security-considerations.html#reentrancy' },
      code: { file: 'vault', from: 11, to: 18, highlight: [13, 16] },
      question: '¿Qué cambio impide que el atacante retire dos veces el mismo saldo?',
      answers: [
        'Verificar el resultado de call después de enviar ETH.',
        'Mantener el descuento dentro de unchecked.',
        'Descontar el saldo antes de ejecutar call.',
      ],
      correct: 2,
      feedback: 'Al descontar primero, una llamada anidada encuentra el saldo ya actualizado. Quitar unchecked también evita ocultar un underflow en este ejemplo.',
      hint: 'La segunda llamada tiene que encontrar el estado correcto aunque la primera siga activa.',
    },
  ],
}

export const attackSteps = [
  { title: 'Depósitos iniciales', description: 'Dos cuentas depositan 5 ETH cada una.', vault: 10, attacker: 0, credit: 0 },
  { title: 'Depósito del atacante', description: 'El atacante aporta 1 ETH. La bóveda tiene 11 ETH y le registra un saldo de 1 ETH al atacante.', vault: 11, attacker: 0, credit: 1 },
  { title: 'Primer retiro', description: 'La bóveda entrega 1 ETH y queda esperando el retorno de receive(). El descuento del saldo todavía está pendiente.', vault: 10, attacker: 1, credit: 1 },
  { title: 'Retiros anidados', description: 'receive() vuelve a pedir 1 ETH mientras hay fondos. Justo después de la última transferencia, los descuentos siguen pendientes.', vault: 0, attacker: 11, credit: 1 },
  { title: 'Resultado esperado', description: 'Al terminar las llamadas, la prueba comprueba 0 ETH en la bóveda y 11 ETH en el contrato atacante. Las restas sin chequeo dejan un saldo registrado desbordado.', vault: 0, attacker: 11, credit: 'Desbordado' },
]
