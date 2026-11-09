import { ArrowRight, Check, Terminal } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'

function Objective({ objective }) {
  return (
    <li className={`objective objective-${objective.status}`}>
      <span className="objective-label">{objective.status === 'current' && <span className="status-dot bg-violet" />}{objective.id}: {objective.title}</span>
      {objective.status === 'complete' ? <span className="objective-check"><Check size={12} aria-hidden="true" /><span className="sr-only">Completado (ejemplo)</span></span> : objective.status === 'current' ? <span className="current-tag">Actual</span> : <span className="objective-pending"><span className="sr-only">Pendiente (ejemplo)</span></span>}
    </li>
  )
}

export default function ProgressPanel({ progress }) {
  const completed = progress.objectives.filter(objective => objective.status === 'complete').length
  const percent = Math.round(completed / progress.objectives.length * 100)
  const current = progress.objectives.find(objective => objective.status === 'current')

  return (
    <section className="flex flex-col gap-4" aria-labelledby="progress-title">
      <SectionHeading id="progress-title" title="Tu progreso" description="Este progreso es de ejemplo. No se ejecutó ningún objetivo, no hay una sesión activa ni una conexión a blockchain o a un servicio RPC." />
      <div className="progress-panel">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5"><h3 className="text-2xl font-bold tracking-tight text-white">{progress.title}</h3></div>
            <span className="font-mono text-xs font-semibold text-violet-light">{completed} / {progress.objectives.length} OBJETIVOS COMPLETADOS • {percent}%</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="font-mono text-slate-300">Última actividad: {progress.lastActive}</span><span aria-hidden="true">•</span><span>Dificultad: <strong className="font-medium text-violet-light">{progress.difficulty}</strong></span><span aria-hidden="true">•</span><span>{progress.metric}</span><span aria-hidden="true">•</span><span>{progress.detail}</span><span aria-hidden="true">•</span><span>Entorno: {progress.target}</span></div>
            {current && <span className="font-mono font-semibold text-slate-300">Objetivo {current.id} · Ejemplo</span>}
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-outline-variant" role="progressbar" aria-label="Progreso de demostración del laboratorio" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${completed} de ${progress.objectives.length} objetivos de ejemplo completados`}><div className="progress-fill" style={{ width: `${completed / progress.objectives.length * 100}%` }} /></div>
        </div>
        <div className="h-px bg-outline-variant" />
        <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">{progress.objectives.map(objective => <Objective key={objective.id} objective={objective} />)}</ol>
        <div className="flex flex-col justify-between gap-4 pt-1 sm:flex-row sm:items-center">
          <span className="flex items-center gap-2 font-mono text-xs text-muted"><Terminal size={15} className="shrink-0 text-violet" aria-hidden="true" />{progress.framework}</span>
          <div className="flex flex-col items-start gap-2 sm:items-end"><button disabled className="resume-button" aria-describedby="execution-note">Continuar laboratorio<ArrowRight size={15} aria-hidden="true" /></button><span id="execution-note" className="text-xs text-muted">Vista previa · ejecución no disponible</span></div>
        </div>
      </div>
    </section>
  )
}
