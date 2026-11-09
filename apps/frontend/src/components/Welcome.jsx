export default function Welcome({ user }) {
  return (
    <section className="flex flex-col justify-between gap-4 pt-2 md:flex-row md:items-center" aria-labelledby="welcome-title">
      <div className="min-w-0">
        <h1 id="welcome-title" className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">¡Hola, {user.name}!</h1>
        <p className="mt-2 text-xs text-muted">Datos de demostración: el usuario, los desafíos y el progreso son ejemplos.</p>
      </div>
      <button className="secondary-button self-start md:self-center" disabled title="Los perfiles no están disponibles en esta vista previa">Ver perfil</button>
    </section>
  )
}
