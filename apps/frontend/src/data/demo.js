// Presentation fixtures only. These are not accounts, backend results or live labs.
export const demoUser = {
  name: 'Naxope',
}

export const demoChallenges = [
  {
    id: 'evm-intro', type: 'MODULE', visual: 'cube',
    title: 'Introducción a EVM', difficulty: 'Nivel inicial',
    metric: '8 secciones', detail: 'Gratis',
  },
  {
    id: 'smart-contracts-intro', type: 'MODULE', visual: 'cube',
    title: 'Introducción a los Smart Contracts', difficulty: 'Nivel inicial',
    metric: '4 secciones', detail: 'Gratis',
  },
  {
    id: 'reentrancy', type: 'MACHINE', visual: 'bot',
    title: 'Reentrancy Vault', difficulty: 'Muy fácil', topic: 'Foundry / Anvil',
    metric: '6 secciones', detail: 'Solidity 0.8.x',
  },
]

// Reuse the card's metadata so the professor's demo stays consistent.
const reentrancyChallenge = demoChallenges.find(challenge => challenge.id === 'reentrancy')

export const demoProgress = {
  title: reentrancyChallenge.title,
  difficulty: reentrancyChallenge.difficulty,
  metric: reentrancyChallenge.metric,
  detail: reentrancyChallenge.detail,
  lastActive: 'hace 12 min (ejemplo)',
  target: 'Anvil (sin conexión)',
  framework: reentrancyChallenge.topic,
  objectives: [
    { id: '01', title: 'Leer el contrato y comprender los depósitos', status: 'complete' },
    { id: '02', title: 'Analizar el flujo de retiro de fondos', status: 'complete' },
    { id: '03', title: 'Identificar Reentrancy en withdraw()', status: 'complete' },
    { id: '04', title: 'Estudiar el atacante y su función receive()', status: 'complete' },
    { id: '05', title: 'Analizar la prueba de vaciado con Foundry', status: 'current' },
    { id: '06', title: 'Explicar cómo prevenir Reentrancy', status: 'pending' },
  ],
}
