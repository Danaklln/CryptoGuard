import { useEffect, useState, useSyncExternalStore } from 'react'
import Header from './components/Header.jsx'
import Landing from './components/Landing.jsx'
import GuidedLesson from './components/GuidedLesson.jsx'
import ReentrancyLab from './components/ReentrancyLab.jsx'
import Welcome from './components/Welcome.jsx'
import Recommendations from './components/Recommendations.jsx'
import ProgressPanel from './components/ProgressPanel.jsx'
import Footer from './components/Footer.jsx'
import { demoUser, demoChallenges } from './data/demo.js'
import { reentrancy } from '../../../labs/reentrancy/lesson.js'
import { evmIntro } from '../../../labs/evm-intro/lesson.js'

function readProgress(lesson, progressKey) {
  const sectionIds = lesson.sections.map(section => section.id)
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

function useLessonProgress(lesson) {
  const progressKey = `cryptoguard:${lesson.id}:v1`
  const [progress, setProgress] = useState(() => readProgress(lesson, progressKey))

  useEffect(() => {
    try {
      window.localStorage.setItem(progressKey, JSON.stringify(progress))
    } catch {
      // Progress remains usable in memory if storage is unavailable.
    }
  }, [progressKey, progress])

  function completeSection(id) {
    setProgress(current => {
      if (current.completed.includes(id)) return current
      return { ...current, completed: [...current.completed, id] }
    })
  }

  return {
    progress,
    onSelect: section => setProgress(current => ({ ...current, section })),
    onComplete: completeSection,
  }
}

export default function App() {
  const hash = useSyncExternalStore(subscribeToNavigation, () => window.location.hash)
  const vault = useLessonProgress(reentrancy)
  const intro = useLessonProgress(evmIntro)
  const isLab = hash === '#reentrancy' || hash === '#evm-intro'

  useEffect(() => {
    if (hash === '#labs') document.getElementById('labs')?.scrollIntoView()
    if (isLab) {
      window.scrollTo(0, 0)
      document.getElementById(hash.slice(1))?.focus({ preventScroll: true })
    }
  }, [hash, isLab])

  if (!isLab && hash !== '#dashboard' && hash !== '#labs') return <Landing />

  return (
    <>
      <a className="skip-link" href={isLab ? hash : '#dashboard'}>Ir al contenido principal</a>
      <Header user={demoUser} />
      {hash === '#evm-intro' ? (
        <GuidedLesson lesson={evmIntro} {...intro} />
      ) : hash === '#reentrancy' ? (
        <ReentrancyLab {...vault} />
      ) : (
        <main id="dashboard" className="page-container flex scroll-mt-20 flex-col gap-9 pt-8 pb-16" tabIndex={-1}>
          <Welcome user={demoUser} />
          <Recommendations challenges={demoChallenges} />
          <ProgressPanel progress={vault.progress} />
          <Footer />
        </main>
      )}
    </>
  )
}
