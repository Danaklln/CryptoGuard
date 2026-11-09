export default function Footer() {
  return (
    <footer className="mt-4 flex flex-col justify-between gap-3 border-t border-outline-variant/70 pt-4 font-mono text-xs text-muted sm:flex-row">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><span className="flex items-center gap-1.5 text-violet-light"><span className="status-dot bg-violet" />Panel de demostración</span><span aria-hidden="true">•</span><span>Sin entorno de ejecución conectado</span><span aria-hidden="true">•</span><span>Datos de ejemplo</span></div>
      <span>CryptoGuard · Aprendé seguridad</span>
    </footer>
  )
}
