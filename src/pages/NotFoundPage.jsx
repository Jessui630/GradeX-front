import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'

export function NotFoundPage() {
  return (
    <section className="centered-state">
      <span className="state-icon">
        <Icon name="search" size={26} />
      </span>
      <p className="eyebrow">Error 404</p>
      <h1>No encontramos esta página</h1>
      <p>La dirección puede haber cambiado o el enlace ya no está disponible.</p>
      <Link className="button button-primary" to="/">
        Ir al inicio
      </Link>
    </section>
  )
}
