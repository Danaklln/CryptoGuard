import { useState } from 'react'
import { BookOpen, Bookmark, Bot, Flag, GraduationCap, Hexagon, Shield, Terminal } from 'lucide-react'

const typeIcons = { MODULE: BookOpen, MACHINE: Terminal, SHERLOCK: Shield, CTF: Flag }

const typeLabels = { MODULE: 'MÓDULO', MACHINE: 'LABORATORIO', SHERLOCK: 'AUDITORÍA', CTF: 'CTF' }

function ChallengeArtwork({ variant }) {
  if (variant === 'cube') return (
    <div className="artwork cube-art" aria-hidden="true">
      <svg width="96" height="96" fill="none" viewBox="0 0 100 100">
        <path d="M50 15L85 35V65L50 85L15 65V35L50 15Z" fill="#1e1b4b" stroke="#a78bfa" strokeWidth="2" />
        <path d="M50 15V50L85 35" fill="#2e1065" stroke="#a78bfa" strokeWidth="1.5" />
        <path d="M50 50L15 35M50 50V85" stroke="#a78bfa" strokeWidth="1.5" />
        <rect x="22" y="20" width="10" height="10" rx="1.5" transform="rotate(25 22 20)" fill="#a78bfa" opacity=".9" />
        <rect x="70" y="24" width="8" height="8" rx="1" transform="rotate(-15 70 24)" fill="#c4abff" opacity=".8" />
      </svg>
    </div>
  )
  if (variant === 'bot') return <div className="artwork bot-art" aria-hidden="true"><div><Bot size={36} strokeWidth={2.5} /></div></div>
  if (variant === 'shield') return <div className="artwork shield-art" aria-hidden="true"><Shield size={36} /></div>
  return <div className="artwork ctf-art" aria-hidden="true"><span className="font-display text-xl font-bold tracking-wider text-white">Arena CTF</span><span className="mt-1 flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-widest text-violet-light"><Hexagon size={16} />CLASIFICATORIA EVM</span></div>
}

export default function ChallengeCard({ challenge }) {
  const [saved, setSaved] = useState(false)
  const TypeIcon = typeIcons[challenge.type]

  return (
    <article className="challenge-card group" aria-labelledby={`challenge-${challenge.id}`}>
      <div className="card-visual">
        <div className="relative z-10 flex items-center justify-between">
          <span className={`type-tag ${challenge.type === 'MACHINE' ? 'type-machine' : ''}`}><TypeIcon size={13} aria-hidden="true" />{typeLabels[challenge.type]}</span>
          <button className="bookmark-button" onClick={() => setSaved(!saved)} aria-pressed={saved} aria-label={`Marcar ${challenge.title} como favorito en esta vista previa`} title="Favorito temporal: se borra al recargar la página"><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" /></button>
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><ChallengeArtwork variant={challenge.visual} /></div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 id={`challenge-${challenge.id}`} className="text-base font-bold leading-snug text-white transition-colors group-hover:text-violet-light">{challenge.title}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted"><span className={challenge.difficulty === 'Intermedio' ? 'text-amber-400' : challenge.visual !== 'cube' ? 'text-violet-light' : ''}>{challenge.difficulty}</span>{challenge.topic && <><span aria-hidden="true">•</span><span>{challenge.topic}</span></>}</p>
        </div>
        <div className="mt-4 flex items-start justify-between gap-3 border-t border-outline-variant/70 pt-3 font-mono text-xs">
          <span className="flex items-center gap-1.5 text-violet-light">{challenge.type === 'MODULE' ? <GraduationCap size={14} aria-hidden="true" /> : <span className={`status-dot ${challenge.difficulty === 'Intermedio' ? 'bg-amber-400' : 'bg-violet'}`} />}{challenge.metric}</span>
        </div>
      </div>
    </article>
  )
}
