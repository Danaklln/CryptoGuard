import { Info } from 'lucide-react'

export default function SectionHeading({ id, title, description, children }) {
  return (
    <div className="relative flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <h2 id={id} className="text-xl font-bold tracking-tight text-white">{title}</h2>
        <details className="info-popover">
          <summary aria-label={`Información sobre ${title}`}><Info size={16} aria-hidden="true" /></summary>
          <p>{description}</p>
        </details>
      </div>
      {children}
    </div>
  )
}
