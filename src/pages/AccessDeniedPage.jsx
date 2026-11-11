import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'

export function AccessDeniedPage() {
  return (
    <section className="centered-state">
      <span className="state-icon state-icon-warn">
        <Icon name="lock" size={26} />
      </span>
      <p className="eyebrow">Acceso restringido</p>
      <h1>Esta área no está disponible para tu rol</h1>
      <p>
        Tu cuenta no tiene permiso para esta sección. Si necesitas acceso, contacta a un
        administrador.
      </p>
      <Link className="button button-primary" to="/app">
        Volver a mi panel
      </Link>
    </section>
  )
}
