import Header from './components/Header.jsx'
import Welcome from './components/Welcome.jsx'
import Recommendations from './components/Recommendations.jsx'
import ProgressPanel from './components/ProgressPanel.jsx'
import Footer from './components/Footer.jsx'
import { demoUser, demoChallenges, demoProgress } from './data/demo.js'

function subscribeToNavigation(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

export default function App() {
  const hash = useSyncExternalStore(subscribeToNavigation, () => window.location.hash)
  if (hash !== '#dashboard' && hash !== '#labs') return <Landing />

  return (
    <>
      <a className="skip-link" href="#dashboard">Ir al contenido principal</a>
      <Header user={demoUser} />
      <main id="dashboard" className="page-container flex scroll-mt-20 flex-col gap-9 pt-8 pb-16" tabIndex={-1}>
        <Welcome user={demoUser} />
        <Recommendations challenges={demoChallenges} />
        <ProgressPanel progress={demoProgress} />
        <Footer />
      </main>
    </>
  )
}
import { useSyncExternalStore } from 'react'
import Landing from './components/Landing.jsx'
