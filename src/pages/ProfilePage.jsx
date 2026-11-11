import { Icon } from '../components/Icon'
import { useAuth } from '../features/auth/auth-context'
import { etiquetaRol } from '../features/auth/roles'
import { iniciales } from '../lib/iniciales'

export function ProfilePage() {
  const { usuario } = useAuth()

  return (
    <div className="workspace-page profile-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Cuenta</p>
          <h1>Perfil</h1>
          <p>Consulta tus datos y el estado de tu cuenta.</p>
        </div>
      </header>

      <section className="panel-card">
        <div className="panel-card-heading profile-identity">
          <span aria-hidden="true" className="avatar avatar-large">
            {iniciales(usuario?.nombreCompleto)}
          </span>
          <div>
            <h2>{usuario?.nombreCompleto}</h2>
            <p className="muted-note">{usuario?.correo}</p>
          </div>
          <span className="badge badge-info">
            {usuario?.roles?.map(etiquetaRol).join(' · ')}
          </span>
        </div>
      </section>

      <section className="panel-card profile-note">
        <Icon name="lock" size={20} />
        <div>
          <h2>Cuenta protegida</h2>
          <p>
            Tu sesión y tus datos están protegidos. La edición de datos estará disponible
            próximamente.
          </p>
        </div>
      </section>
    </div>
  )
}
