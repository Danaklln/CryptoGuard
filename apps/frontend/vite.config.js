import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: [
        '.',
        '../../labs/evm-intro/lesson.js',
        '../../labs/reentrancy/lesson.js',
        '../../src/contracts/reentrance/contract-1.sol',
        '../../src/contracts/reentrance/attacker.sol',
        '../../test/Reentrance.t.sol',
      ],
    },
  },
})
