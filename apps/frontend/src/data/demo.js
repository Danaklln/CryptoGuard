import { reentrancy } from '../../../../labs/reentrancy/lesson.js'

// The demo user is local to this frontend.
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
    title: reentrancy.title, difficulty: 'Muy fácil', topic: 'Solidity',
    metric: `${reentrancy.sections.length} secciones`, href: '#reentrancy',
  },
]
