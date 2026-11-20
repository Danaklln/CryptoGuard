import { useState } from 'react'
import { ArrowRight, FileCode2, RotateCcw } from 'lucide-react'
import { attackSteps, reentrancy } from '../../../../labs/reentrancy/lesson.js'
import GuidedLesson from './GuidedLesson.jsx'

function CodeViewer({ section }) {
  const [showFullFile, setShowFullFile] = useState(false)
  const { file, from, to, highlight = [] } = section.code
  const { name, source } = reentrancy.files[file]
  const lines = source.trimEnd().split('\n')
  const firstLine = showFullFile ? 1 : from
  const lastLine = showFullFile ? lines.length : to

  return (
    <aside className="lab-code lab-panel" aria-label="Código del laboratorio">
      <div className="lab-code-header">
        <span><FileCode2 size={16} aria-hidden="true" />{name}</span>
        <button type="button" className="lab-text-button" aria-pressed={showFullFile} onClick={() => setShowFullFile(!showFullFile)}>
          {showFullFile ? 'Ver fragmento' : 'Ver archivo completo'}
        </button>
      </div>
      <pre tabIndex={0} aria-label={`Código de ${name}, líneas ${firstLine} a ${lastLine}`}>
        <code>
          {lines.slice(firstLine - 1, lastLine).map((line, index) => {
            const number = firstLine + index
            return (
              <span className={`lab-code-line${highlight.includes(number) ? ' lab-code-highlight' : ''}`} key={number}>
                <span className="lab-line-number" aria-hidden="true">{number}</span>
                <span>{line || ' '}</span>
              </span>
            )
          })}
        </code>
      </pre>
    </aside>
  )
}

function AttackDemo() {
  const [step, setStep] = useState(0)
  const current = attackSteps[step]

  return (
    <section className="lab-attack" aria-labelledby="attack-title">
      <h3 id="attack-title">Demostración del ataque</h3>
      <p className="text-muted">Recorrido interactivo basado en los resultados esperados de la prueba de Foundry.</p>
      <div className="lab-attack-state" aria-live="polite">
        <p className="font-medium text-violet-light">{step + 1} / {attackSteps.length} · {current.title}</p>
        <p>{current.description}</p>
        <dl className="lab-balances">
          <div><dt>ETH en la bóveda</dt><dd>{current.vault} ETH</dd></div>
          <div><dt>ETH en el atacante</dt><dd>{current.attacker} ETH</dd></div>
          <div><dt>Saldo registrado del atacante</dt><dd>{typeof current.credit === 'number' ? `${current.credit} ETH` : current.credit}</dd></div>
        </dl>
      </div>
      <div className="lab-actions">
        <button type="button" className="lab-button" onClick={() => setStep(step - 1)} disabled={step === 0}>Paso anterior</button>
        {step < attackSteps.length - 1 ? (
          <button type="button" className="lab-button lab-button-primary" onClick={() => setStep(step + 1)}>Siguiente paso <ArrowRight size={16} aria-hidden="true" /></button>
        ) : (
          <button type="button" className="lab-button" onClick={() => setStep(0)}><RotateCcw size={16} aria-hidden="true" /> Reiniciar demostración</button>
        )}
      </div>
    </section>
  )
}

function renderSupplement(section) {
  return (
    <>
      <CodeViewer key={section.id} section={section} />
      {section.demonstration && <AttackDemo />}
      {section.id === 'prevencion' && (
        <div className="lab-comparison">
          <p><strong>Vulnerable</strong> Verificar saldo → enviar ETH → descontar saldo</p>
          <p><strong>Corregido</strong> Verificar saldo → descontar saldo → enviar ETH</p>
        </div>
      )}
    </>
  )
}

export default function ReentrancyLab(props) {
  return <GuidedLesson lesson={reentrancy} renderSupplement={renderSupplement} {...props} />
}
