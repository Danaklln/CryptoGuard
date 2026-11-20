import { reentrancy } from '../../../../labs/reentrancy/lesson.js'
import { evmIntro } from '../../../../labs/evm-intro/lesson.js'

// The demo user is local to this frontend.
export const demoUser = {
  name: 'Naxope',
}

export const demoChallenges = [
  {
    id: 'evm-intro', type: 'MODULE', visual: 'cube',
    title: evmIntro.title, difficulty: 'Nivel inicial',
    metric: `${evmIntro.sections.length} secciones`, href: '#evm-intro',
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
