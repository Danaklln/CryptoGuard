import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, FileCode2, RotateCcw } from 'lucide-react'
import { attackSteps, reentrancy } from '../../../../labs/reentrancy/lesson.js'

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

function SectionQuestion({ section, completed, onComplete }) {
  const [selected, setSelected] = useState(completed ? section.correct : null)
  const [result, setResult] = useState(completed ? 'correct' : null)

  function checkAnswer(event) {
    event.preventDefault()
    if (selected === null) return
    if (selected === section.correct) {
      setResult('correct')
      onComplete(section.id)
    } else {
      setResult('incorrect')
    }
  }

  return (
    <form className="lab-question" onSubmit={checkAnswer}>
      <fieldset>
        <legend className="font-semibold text-white">{section.question}</legend>
        <div className="lab-options">
          {section.answers.map((answer, index) => (
            <label className="lab-option" key={answer}>
              <input
                type="radio"
                name={section.id}
                checked={selected === index}
                disabled={completed}
                onChange={() => {
                  setSelected(index)
                  setResult(null)
                }}
              />
              <span>{answer}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {!completed && <button type="submit" className="lab-button lab-button-primary" disabled={selected === null}>Comprobar respuesta</button>}
      <div aria-live="polite">
        {result === 'correct' && <p className="lab-feedback lab-feedback-correct"><strong>Correcto.</strong> {section.feedback}</p>}
        {result === 'incorrect' && <p className="lab-feedback lab-feedback-retry"><strong>Probá de nuevo.</strong> {section.hint}</p>}
      </div>
    </form>
  )
}

export default function ReentrancyLab({ progress, onSelect, onComplete }) {
  const heading = useRef(null)
  const shouldFocus = useRef(false)
  const index = reentrancy.sections.findIndex(section => section.id === progress.section)
  const section = reentrancy.sections[index]
  const total = reentrancy.sections.length
  const completed = progress.completed.length

  useEffect(() => {
    if (shouldFocus.current) {
      heading.current?.focus()
      shouldFocus.current = false
    }
  }, [section.id])

  function selectSection(id) {
    if (id === section.id) return
    shouldFocus.current = true
    onSelect(id)
  }

  return (
    <main id="reentrancy" className="page-container lab-page scroll-mt-20" tabIndex={-1}>
      <a className="lab-back" href="#labs"><ArrowLeft size={16} aria-hidden="true" /> Volver a Labs</a>
      <div className="lab-intro">
        <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">{reentrancy.title}</h1>
        <p>{reentrancy.description}</p>
      </div>
      <div className="lab-layout">
        <nav className="lab-sections lab-panel" aria-label="Secciones del laboratorio">
          <div className="lab-sections-heading">
            <h2>Secciones</h2>
            <span>{completed} / {total} completadas</span>
          </div>
          <progress className="lab-progress" max={total} value={completed} aria-label="Secciones completadas" />
          <select
            className="lab-section-select"
            aria-label="Elegí una sección"
            value={section.id}
            onChange={event => selectSection(event.target.value)}
          >
            {reentrancy.sections.map((item, position) => (
              <option key={item.id} value={item.id}>
                {`Sección ${position + 1} de ${total} · ${item.title}`}
              </option>
            ))}
          </select>
          <ol className="lab-section-list">
            {reentrancy.sections.map((item, position) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="lab-section-button"
                  aria-current={item.id === section.id ? 'step' : undefined}
                  onClick={() => selectSection(item.id)}
                >
                  <span className="lab-section-number" aria-hidden="true">{String(position + 1).padStart(2, '0')}</span>
                  <span>{item.title}</span>
                  {progress.completed.includes(item.id) && <><Check size={15} className="ml-auto text-primary" aria-hidden="true" /><span className="sr-only"> · Completada</span></>}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <article className="lab-lesson lab-panel" aria-labelledby="lab-section-title">
          <p className="lab-eyebrow">Sección {index + 1} de {total}</p>
          <h2 id="lab-section-title" tabIndex={-1} ref={heading}>{section.title}</h2>
          {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          {section.source && <p><a className="lab-source" href={section.source.url} target="_blank" rel="noreferrer">{section.source.label}</a></p>}
          <CodeViewer key={section.id} section={section} />
          {section.demonstration && <AttackDemo />}
          {section.id === 'prevencion' && (
            <div className="lab-comparison">
              <p><strong>Vulnerable</strong> Verificar saldo → enviar ETH → descontar saldo</p>
              <p><strong>Corregido</strong> Verificar saldo → descontar saldo → enviar ETH</p>
            </div>
          )}
          <SectionQuestion
            key={section.id}
            section={section}
            completed={progress.completed.includes(section.id)}
            onComplete={onComplete}
          />
          <div className="lab-actions lab-lesson-navigation">
            {index > 0 && <button type="button" className="lab-button" onClick={() => selectSection(reentrancy.sections[index - 1].id)}><ArrowLeft size={16} aria-hidden="true" /> Anterior</button>}
            {index < total - 1 ? (
              <button type="button" className="lab-button ml-auto" onClick={() => selectSection(reentrancy.sections[index + 1].id)}>Siguiente sección <ArrowRight size={16} aria-hidden="true" /></button>
            ) : <a href="#dashboard" className="lab-button ml-auto">Volver al dashboard <ArrowRight size={16} aria-hidden="true" /></a>}
          </div>
        </article>
      </div>
    </main>
  )
}
