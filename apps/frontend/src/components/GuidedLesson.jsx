import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

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

export default function GuidedLesson({ lesson, progress, onSelect, onComplete, renderSupplement }) {
  const heading = useRef(null)
  const shouldFocus = useRef(false)
  const index = lesson.sections.findIndex(section => section.id === progress.section)
  const section = lesson.sections[index]
  const total = lesson.sections.length
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
    <main id={lesson.id} className="page-container lab-page scroll-mt-20" tabIndex={-1}>
      <a className="lab-back" href="#labs"><ArrowLeft size={16} aria-hidden="true" /> Volver a Labs</a>
      <div className="lab-intro">
        <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">{lesson.title}</h1>
        <p>{lesson.description}</p>
      </div>
      <div className="lab-layout">
        <nav className="lab-sections lab-panel" aria-label={`Secciones de ${lesson.title}`}>
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
            {lesson.sections.map((item, position) => (
              <option key={item.id} value={item.id}>
                {`Sección ${position + 1} de ${total} · ${item.title}`}
              </option>
            ))}
          </select>
          <ol className="lab-section-list">
            {lesson.sections.map((item, position) => (
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
          {renderSupplement?.(section)}
          <SectionQuestion
            key={section.id}
            section={section}
            completed={progress.completed.includes(section.id)}
            onComplete={onComplete}
          />
          <div className="lab-actions lab-lesson-navigation">
            {index > 0 && <button type="button" className="lab-button" onClick={() => selectSection(lesson.sections[index - 1].id)}><ArrowLeft size={16} aria-hidden="true" /> Anterior</button>}
            {index < total - 1 ? (
              <button type="button" className="lab-button ml-auto" onClick={() => selectSection(lesson.sections[index + 1].id)}>Siguiente sección <ArrowRight size={16} aria-hidden="true" /></button>
            ) : <a href="#dashboard" className="lab-button ml-auto">Volver al dashboard <ArrowRight size={16} aria-hidden="true" /></a>}
          </div>
        </article>
      </div>
    </main>
  )
}
