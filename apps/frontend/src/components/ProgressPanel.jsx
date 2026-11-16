import { ArrowRight, Check } from 'lucide-react'
import { reentrancy } from '../../../../labs/reentrancy/lesson.js'
import SectionHeading from './SectionHeading.jsx'

function Objective({ objective }) {
  return (
    <li className={`objective objective-${objective.status}`}>
      <span className="objective-label">{objective.status === 'current' && <span className="status-dot bg-violet" />}{objective.id}: {objective.title}</span>
      {objective.status === 'complete' ? <span className="objective-check"><Check size={12} aria-hidden="true" /><span className="sr-only">Completado</span></span> : objective.status === 'current' ? <span className="current-tag">Actual</span> : <span className="objective-pending"><span className="sr-only">Pendiente</span></span>}
    </li>
  )
}

export default function ProgressPanel({ progress }) {
  const completed = progress.completed.length
  const total = reentrancy.sections.length
  const percent = Math.round(completed / total * 100)
  const objectives = reentrancy.sections.map((section, index) => {
    const done = progress.completed.includes(section.id)
    return {
      id: String(index + 1).padStart(2, '0'),
      title: section.title,
      status: done ? 'complete' : section.id === progress.section && completed > 0 ? 'current' : 'pending',
    }
  })
  const buttonLabel = completed === total ? 'Repasar laboratorio' : completed > 0 ? 'Continuar laboratorio' : 'Empezar laboratorio'

  return (
    <section className="flex flex-col gap-4" aria-labelledby="progress-title">
      <SectionHeading id="progress-title" title="Tu progreso" description="Completá cada sección respondiendo su pregunta. Tu avance se guarda en este navegador." />
      <div className="progress-panel">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-2xl font-bold tracking-tight text-white">{reentrancy.title}</h3>
            <span className="font-mono text-xs font-semibold text-violet-light">{completed} / {total} SECCIONES COMPLETADAS · {percent}%</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-outline-variant" role="progressbar" aria-label="Progreso de Reentrancy Vault" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${completed} de ${total} secciones completadas`}><div className="progress-fill" style={{ width: `${percent}%` }} /></div>
        </div>
        <div className="h-px bg-outline-variant" />
        <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">{objectives.map(objective => <Objective key={objective.id} objective={objective} />)}</ol>
        <div className="flex justify-end pt-1">
          <a href="#reentrancy" className="resume-button">{buttonLabel}<ArrowRight size={15} aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  )
}
