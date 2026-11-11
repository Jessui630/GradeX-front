import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { Icon } from '../components/Icon'

export function LandingPage() {
  return (
    <div className="public-shell landing-shell">
      <a className="skip-link" href="#contenido-publico">
        Saltar al contenido
      </a>

      <header className="public-header landing-header">
        <Brand />
      </header>

      <main className="landing-main" id="contenido-publico">
        <section aria-labelledby="landing-title" className="landing-hero">
          <span className="eyebrow">
            <Icon name="spark" size={16} />
            Evaluación profesional de originalidad
          </span>
          <h1 id="landing-title">
            Decide con criterio.
            <span>Compra con confianza.</span>
          </h1>
          <p className="hero-lede">
            Verifica tus productos con especialistas y evidencia real. Revisión humana y un
            resultado claro.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" to="/registro">
              Crear cuenta
              <Icon name="arrow-right" size={19} />
            </Link>
            <Link className="button button-secondary button-large" to="/login">
              Iniciar sesión
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
