import { Home, UserRound, ShieldCheck } from 'lucide-react'

export default function Header({ user }) {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-outline-variant bg-background/95 backdrop-blur-md">
      <div className="page-container flex h-full items-center justify-between gap-3">
        <div className="flex items-center gap-4 sm:gap-8">
          <a href="#dashboard" className="font-display text-lg font-bold tracking-wider text-white" aria-label="Inicio de CryptoGuard">CRYPTOGUARD</a>
          <nav aria-label="Navegación principal" className="flex items-center gap-1">
            <a href="#dashboard" aria-current="page" className="nav-link nav-active"><Home size={16} aria-hidden="true" /><span className="hidden sm:inline">Inicio</span><span className="sr-only sm:hidden">Inicio</span></a>
            <button disabled title="Los perfiles no están disponibles en esta vista previa" className="nav-link hidden sm:flex"><UserRound size={16} aria-hidden="true" />Perfil</button>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="demo-tag">DEMO</span>
          <div className="avatar" role="img" aria-label={`${user.name} — avatar de demostración`}><ShieldCheck size={20} aria-hidden="true" /><span /></div>
        </div>
      </div>
    </header>
  )
}
