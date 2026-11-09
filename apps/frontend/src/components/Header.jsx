import { Home, UserRound, ShieldCheck, FlaskConical } from 'lucide-react'

export default function Header({ user }) {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-outline-variant bg-background/95 backdrop-blur-md">
      <div className="page-container flex h-full items-center justify-between gap-3">
        <div className="flex items-center gap-4 sm:gap-8">
          <a href="#inicio" className="font-display text-lg font-bold tracking-wider text-white" aria-label="Inicio de CryptoGuard"><span aria-hidden="true">CRYPTO<span className="text-violet">GU<svg className="landing-ethereum" viewBox="0 0 32 52" fill="none" aria-hidden="true"><path d="M16 0 1 26l15 9 15-9L16 0Z" fill="currentColor" /><path d="M16 0v35L1 26 16 20l15 6" fill="#0b101b" fillOpacity=".3" /><path d="m1 31 15 21 15-21-15 9L1 31Z" fill="currentColor" /><path d="M16 40v12L1 31l15 9Z" fill="#0b101b" fillOpacity=".3" /></svg>RD</span></span></a>
          <nav aria-label="Navegación principal" className="flex items-center gap-1">
            <a href="#inicio" className="nav-link"><Home size={16} aria-hidden="true" /><span className="hidden sm:inline">Inicio</span><span className="sr-only sm:hidden">Inicio</span></a>
            <a href="#labs" className="nav-link"><FlaskConical size={16} className="hidden sm:block" aria-hidden="true" /><span>Labs</span></a>
            <button disabled title="Los perfiles no están disponibles en esta vista previa" className="nav-link hidden sm:flex"><UserRound size={16} aria-hidden="true" />Perfil</button>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="avatar" role="img" aria-label={`${user.name} — avatar de demostración`}><ShieldCheck size={20} aria-hidden="true" /><span /></div>
        </div>
      </div>
    </header>
  )
}
