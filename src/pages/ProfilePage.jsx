import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useAuth } from '../features/auth/auth-context'
import { etiquetaRol, ROLE, tieneRol } from '../features/auth/roles'

export function ProfilePage() {
  const { usuario } = useAuth()
  const esSolicitante = tieneRol(usuario, ROLE.SOLICITANTE)

  return (
    <div className="workspace-page profile-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Cuenta</p>
          <h1>Perfil</h1>
        </div>
        {esSolicitante ? (
          <Link className="button button-primary" to="/app/evaluaciones/nueva">
            <Icon name="spark" size={17} /> Nueva evaluación
          </Link>
        ) : null}
      </header>

      <section className="panel-card">
        <div className="panel-card-heading">
          <span className="avatar avatar-large" aria-hidden="true">
            {usuario?.nombreCompleto
              ?.split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((parte) => parte[0]?.toUpperCase())
              .join('')}
          </span>
          <div>
            <h2>{usuario?.nombreCompleto}</h2>
            <p className="muted-note">{usuario?.correo}</p>
          </div>
        </div>
        <dl className="account-details">
          <div>
            <dt>Roles</dt>
            <dd>{usuario?.roles?.map(etiquetaRol).join(', ')}</dd>
          </div>
          <div>
            <dt>Sesión</dt>
            <dd>Cookie HttpOnly · persistida en SQL Server</dd>
          </div>
          <div>
            <dt>Contraseña</dt>
            <dd>IdentityV3 · mínimo 15 caracteres</dd>
          </div>
        </dl>
      </section>

      <section className="panel-card profile-note">
        <Icon name="lock" size={20} />
        <p>
          La edición de datos personales y preferencias llegará con la HU-016. Por ahora
          puedes consultar tu cuenta y cerrar sesión desde la navegación.
        </p>
      </section>
    </div>
  )
}
