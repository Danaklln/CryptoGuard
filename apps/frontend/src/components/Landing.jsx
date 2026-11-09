const particles = Array.from({ length: 16 }, (_, index) => ({
  left: `${(index * 37 + 4) % 100}%`,
  size: `${22 + (index * 13) % 34}px`,
  duration: `${18 + (index * 7) % 17}s`,
  delay: `${-index * 3.7}s`,
}))

export default function Landing() {
  return (
    <main className="landing" aria-labelledby="landing-title">
      <div className="ether-background" aria-hidden="true">
        {particles.map((particle, index) => (
          <svg key={index} className="ether-particle" viewBox="0 0 32 52" fill="none" style={{
            left: particle.left, width: particle.size,
            animationDuration: particle.duration, animationDelay: particle.delay,
          }}>
            <path d="M16 2 2 26l14 8 14-8L16 2Z" fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeLinejoin="round" />
            <path d="M16 2v32M2 26l14-6 14 6M16 38 2 30l14 20 14-20-14 8Z" stroke="currentColor" strokeLinejoin="round" />
            <path d="M16 38v12" stroke="currentColor" />
          </svg>
        ))}
      </div>
      <div className="landing-content">
        <h1 id="landing-title" className="landing-title" aria-label="CryptoGuard">
          <span className="landing-wordmark" aria-hidden="true">CRYPTO<span>GU<svg className="landing-ethereum" viewBox="0 0 32 52" fill="none" aria-hidden="true"><path d="M16 0 1 26l15 9 15-9L16 0Z" fill="currentColor" /><path d="M16 0v35L1 26 16 20l15 6" fill="#0b101b" fillOpacity=".3" /><path d="m1 31 15 21 15-21-15 9L1 31Z" fill="currentColor" /><path d="M16 40v12L1 31l15 9Z" fill="#0b101b" fillOpacity=".3" /></svg>RD</span></span>
        </h1>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="#dashboard" className="landing-button">Ingresar</a>
          <button type="button" disabled className="landing-button landing-button-secondary" title="El registro todavía no está disponible">Registrarse</button>
        </div>
      </div>
    </main>
  )
}
