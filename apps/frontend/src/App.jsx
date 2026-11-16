import { useEffect, useState, useSyncExternalStore } from 'react'
import Header from './components/Header.jsx'
import Landing from './components/Landing.jsx'
import ReentrancyLab from './components/ReentrancyLab.jsx'
import Welcome from './components/Welcome.jsx'
import Recommendations from './components/Recommendations.jsx'
import ProgressPanel from './components/ProgressPanel.jsx'
import Footer from './components/Footer.jsx'
import { demoUser, demoChallenges } from './data/demo.js'
import { reentrancy } from '../../../labs/reentrancy/lesson.js'

const progressKey = 'cryptoguard:reentrancy:v1'
const sectionIds = reentrancy.sections.map(section => section.id)

function readProgress() {
  const initial = { section: sectionIds[0], completed: [] }
  try {
    const saved = JSON.parse(window.localStorage.getItem(progressKey))
    return {
      section: sectionIds.includes(saved?.section) ? saved.section : initial.section,
      completed: Array.isArray(saved?.completed) ? sectionIds.filter(id => saved.completed.includes(id)) : [],
    }
  } catch {
    return initial
  }
}

function subscribeToNavigation(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

export default function App() {
  const hash = useSyncExternalStore(subscribeToNavigation, () => window.location.hash)
  const [progress, setProgress] = useState(readProgress)
  const isLab = hash === '#reentrancy'

  useEffect(() => {
    try {
      window.localStorage.setItem(progressKey, JSON.stringify(progress))
    } catch {
      // Progress remains usable in memory if storage is unavailable.
    }
  }, [progress])

  useEffect(() => {
    if (hash === '#labs') document.getElementById('labs')?.scrollIntoView()
    if (hash === '#reentrancy') {
      window.scrollTo(0, 0)
      document.getElementById('reentrancy')?.focus({ preventScroll: true })
    }
  }, [hash])

  if (!isLab && hash !== '#dashboard' && hash !== '#labs') return <Landing />

  function completeSection(id) {
    setProgress(current => {
      if (current.completed.includes(id)) return current
      return { ...current, completed: [...current.completed, id] }
    })
  }

  return (
    <>
      <a className="skip-link" href={isLab ? '#reentrancy' : '#dashboard'}>Ir al contenido principal</a>
      <Header user={demoUser} />
      {isLab ? (
        <ReentrancyLab
          progress={progress}
          onSelect={section => setProgress(current => ({ ...current, section }))}
          onComplete={completeSection}
        />
      ) : (
        <main id="dashboard" className="page-container flex scroll-mt-20 flex-col gap-9 pt-8 pb-16" tabIndex={-1}>
          <Welcome user={demoUser} />
          <Recommendations challenges={demoChallenges} />
          <ProgressPanel progress={progress} />
          <Footer />
        </main>
      )}
    </>
  )
}
