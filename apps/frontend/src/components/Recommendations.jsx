import { ChevronLeft, ChevronRight } from 'lucide-react'
import ChallengeCard from './ChallengeCard.jsx'
import SectionHeading from './SectionHeading.jsx'

export default function Recommendations({ challenges }) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby="recommendations-title">
      <SectionHeading id="recommendations-title" title="Recomendados para vos" description="Estos desafíos son ejemplos del diseño. Las recomendaciones no están personalizadas y los cursos aún no están disponibles. Podés marcar favoritos durante esta visita; se borran al recargar.">
        <div className="flex gap-1.5">
          <button disabled className="pagination-button" aria-label="Recomendaciones anteriores" title="Ya se muestran todos los desafíos de ejemplo"><ChevronLeft size={18} aria-hidden="true" /></button>
          <button disabled className="pagination-button" aria-label="Más recomendaciones" title="Ya se muestran todos los desafíos de ejemplo"><ChevronRight size={18} aria-hidden="true" /></button>
        </div>
      </SectionHeading>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{challenges.map(challenge => <ChallengeCard key={challenge.id} challenge={challenge} />)}</div>
    </section>
  )
}
