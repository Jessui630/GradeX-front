import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { Icon } from '../components/Icon'

const beneficios = [
  {
    icon: 'users',
    titulo: 'Evaluación humana',
    texto: 'Especialistas acreditados revisan cada producto con criterios claros.',
  },
  {
    icon: 'certificate',
    titulo: 'Certificado verificable',
    texto: 'Cada evaluación concluida deja un resultado consultable y compartible.',
  },
  {
    icon: 'shield',
    titulo: 'Acceso seguro',
    texto: 'Tu cuenta se protege con sesiones HttpOnly y verificación de contraseñas.',
  },
]

const pasos = [
  ['Crea tu cuenta', 'Regístrate como solicitante con tus datos básicos.'],
  ['Registra tu producto', 'Completa la información y adjunta la evidencia solicitada.'],
  ['Recibe tu evaluación', 'Un especialista revisa el producto y emite su dictamen.'],
]

export function LandingPage() {
  return (
    <div className="public-shell">
      <a className="skip-link" href="#contenido-publico">
        Saltar al contenido
      </a>

      <header className="public-header">
        <Brand />
        <nav aria-label="Acceso" className="public-actions">
          <Link className="nav-text-link" to="/">
            Inicio
          </Link>
          <Link className="button button-quiet" to="/login">
            Iniciar sesión
          </Link>
          <Link className="button button-primary" to="/registro">
            Crear cuenta
            <Icon name="arrow-right" size={18} />
          </Link>
        </nav>
      </header>

      <main id="contenido-publico">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <Icon name="spark" size={16} />
              Evaluación profesional de originalidad
            </span>
            <h1>
              Decide con criterio.
              <span> Compra con confianza.</span>
            </h1>
            <p className="hero-lede">
              Evalúa la originalidad de tus productos con especialistas y evidencia
              verificable. Sin decisiones automáticas: revisión humana y resultado documentado.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary button-large" to="/registro">
                Empezar ahora
                <Icon name="arrow-right" size={19} />
              </Link>
              <Link className="button button-secondary button-large" to="/login">
                Ya tengo cuenta
              </Link>
            </div>
            <p className="microcopy">
              <Icon name="lock" size={15} />
              Registro exclusivo para solicitantes. Tu contraseña nunca se muestra ni se
              guarda en texto plano.
            </p>
          </div>

          <div aria-label="Vista conceptual de una evaluación" className="hero-visual">
            <div className="visual-orbit visual-orbit-one" />
            <div className="visual-orbit visual-orbit-two" />
            <div className="verification-card">
              <div className="verification-top">
              <span className="status-dot" />
              <span>Evaluación en curso</span>
              <span className="verification-id">Vista de producto</span>
            </div>
            <div className="verification-body">
              <div className="product-illustration">
                <Icon name="box" size={42} />
              </div>
              <div>
                <p className="card-kicker">Expediente de producto</p>
                <h2>Información, evidencia y revisión</h2>
                <p>
                  El especialista documenta su análisis. El resultado queda disponible al
                  finalizar la evaluación.
                </p>
              </div>
            </div>
              <div className="verification-checks">
                <span>
                  <Icon name="check" size={16} /> Datos protegidos
                </span>
                <span>
                  <Icon name="check" size={16} /> Trazabilidad
                </span>
                <span>
                  <Icon name="check" size={16} /> Dictamen humano
                </span>
              </div>
            </div>
            <div className="floating-card floating-card-top">
              <Icon name="certificate" size={22} />
              <span>Certificado digital</span>
            </div>
            <div className="floating-card floating-card-bottom">
              <Icon name="shield" size={22} />
              <span>Sesión protegida</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="beneficios-titulo" className="feature-section">
          <div className="section-heading">
            <p className="eyebrow">Una evaluación que puedes entender</p>
            <h2 id="beneficios-titulo">Claridad antes de decidir</h2>
          </div>
          <div className="feature-grid">
            {beneficios.map((beneficio) => (
              <article className="feature-card" key={beneficio.titulo}>
                <span className="feature-icon">
                  <Icon name={beneficio.icon} size={24} />
                </span>
                <h3>{beneficio.titulo}</h3>
                <p>{beneficio.texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="pasos-titulo" className="steps-section">
          <div className="section-heading">
            <p className="eyebrow">De la duda al resultado</p>
            <h2 id="pasos-titulo">Un recorrido simple</h2>
          </div>
          <ol className="steps-grid">
            {pasos.map(([titulo, texto], indice) => (
              <li className="step-card" key={titulo}>
                <span className="step-number">0{indice + 1}</span>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="cta-panel">
          <div>
            <p className="eyebrow">Tu primera evaluación empieza aquí</p>
            <h2>Crea tu cuenta de solicitante</h2>
            <p>Sin roles seleccionables ni accesos anticipados. Solo tus datos básicos.</p>
          </div>
          <Link className="button button-light button-large" to="/registro">
            Crear mi cuenta
            <Icon name="arrow-right" size={19} />
          </Link>
        </section>
      </main>

      <footer className="public-footer">
        <Brand />
        <p>Evaluación profesional de originalidad de productos.</p>
        <Link to="/login">Acceso a mi cuenta</Link>
      </footer>
    </div>
  )
}
