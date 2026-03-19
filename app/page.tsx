import Link from 'next/link';

export default function LandingPage() {
  const features = [
    { icon: '🏆', title: 'Rankings en Vivo', desc: 'Compite por ser el mejor hincha de tu equipo en tablas de posición actualizadas en tiempo real.' },
    { icon: '🛡️', title: 'Clanes de Hinchas', desc: 'Únete o crea un clan, compite en grupo y gana premios junto a los tuyos.' },
    { icon: '⚡', title: 'Puntaje por Asistencia', desc: 'Verifica tu asistencia a partidos y suma puntos. Más lejos vayas, más puntos ganas.' },
    { icon: '🎖️', title: 'Badges y Logros', desc: 'Colecciona medallas únicas que demuestran tu fanatismo. Trotamundos, Fiel de Invierno y más.' },
    { icon: '🎯', title: 'Desafíos', desc: 'Participa en desafíos especiales de FanHub, tu club o marcas auspiciadoras.' },
    { icon: '🎁', title: 'Premios Reales', desc: 'Los mejores hinchas ganan millas, experiencias VIP y merchandise oficial.' },
  ];

  const teams = ['Colo-Colo', 'Universidad de Chile', 'Universidad Católica', 'Everton', 'Huachipato', 'Audax Italiano'];

  return (
    <div className="min-h-screen bg-surface">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="FanHub">
              <circle cx="16" cy="16" r="15" fill="#39ff14" fillOpacity="0.1" stroke="#39ff14" strokeWidth="1.5"/>
              <polygon points="16,6 20,13 28,14 22,20 24,28 16,24 8,28 10,20 4,14 12,13" fill="none" stroke="#39ff14" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="16" cy="16" r="3" fill="#39ff14"/>
            </svg>
            <span className="font-black text-xl tracking-tight text-white">Fan<span className="text-brand-500">Hub</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Registrarse gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* BG glow */}
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-surface-card border border-brand-500/30 rounded-full px-4 py-1.5 text-sm text-brand-400 mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            Piloto Chile — Fútbol Primera División 2026
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            El mejor hincha{' '}
            <span className="text-brand-500 neon-text">gana.</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            FanHub convierte tu pasión por el fútbol en puntaje, estatus y premios reales.
            Asiste a partidos, crea tu clan y compite por ser el número uno.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 neon-glow"
            >
              Empezar gratis →
            </Link>
            <Link
              href="/login"
              className="border border-surface-border hover:border-gray-500 text-gray-300 font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Ya tengo cuenta
            </Link>
          </div>

          {/* Teams pill list */}
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {teams.map((team) => (
              <span key={team} className="bg-surface-card border border-surface-border text-xs text-gray-400 px-3 py-1 rounded-full">
                {team}
              </span>
            ))}
            <span className="bg-surface-card border border-surface-border text-xs text-gray-400 px-3 py-1 rounded-full">
              +10 más
            </span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-surface-border bg-surface-card/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { n: '16', label: 'Equipos Primera División' },
              { n: '5-8', label: 'Badges para coleccionar' },
              { n: '100+', label: 'Pts por partido local' },
            ].map(({ n, label }) => (
              <div key={label}>
                <div className="text-4xl font-black text-brand-500">{n}</div>
                <div className="text-sm text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Todo lo que necesita un verdadero hincha</h2>
          <p className="text-gray-500 text-center mb-16 max-w-xl mx-auto">
            Funcionalidades diseñadas para los más fanáticos de los fanáticos
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-surface-card border border-surface-border rounded-xl p-6 hover:border-brand-500/40 transition-colors">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring teaser */}
      <section className="py-24 px-4 bg-surface-card/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">¿Cómo funciona el puntaje?</h2>
            <p className="text-gray-500">Cada acción vale puntos. Más comprometido, más alto en el ranking.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { action: 'Partido de local', pts: '100', detail: 'Foto de entrada + geoloc.' },
              { action: 'Partido de visita', pts: '100+', detail: '+1 pt/km de distancia' },
              { action: 'Partido internacional', pts: '200+', detail: '+1 pt/100km desde Chile' },
              { action: 'Socio del club', pts: '300', detail: 'Una vez por club' },
            ].map((item) => (
              <div key={item.action} className="bg-surface-elevated rounded-xl p-5 text-center border border-surface-border">
                <div className="text-3xl font-black text-brand-500">{item.pts}</div>
                <div className="text-xs text-gray-300 font-semibold mt-1">{item.action}</div>
                <div className="text-xs text-gray-600 mt-1">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-black mb-4">¿Listo para el podio?</h2>
          <p className="text-gray-400 mb-8">Únete a los primeros hinchas del piloto y gana los badges exclusivos de fundadores.</p>
          <Link
            href="/register"
            className="inline-block bg-brand-600 hover:bg-brand-500 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all hover:scale-105 neon-glow"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border py-8 px-4 text-center text-sm text-gray-600">
        <p>© 2026 FanHub. Piloto Chile — Fútbol Primera División.</p>
        <p className="mt-1">
          <a href="https://www.perplexity.ai/computer" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
            Created with Perplexity Computer
          </a>
        </p>
      </footer>
    </div>
  );
}
