import { Navigate } from 'react-router-dom'
import { Icon } from '../components/Icon'

function PageHeading({ eyebrow, title, children }) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{children}</p>
      </div>
    </header>
  )
}

function UnavailableCard({ icon, title, description }) {
  return (
    <article className="panel-card unavailable-card">
      <div className="panel-card-heading">
        <span className="feature-icon">
          <Icon name={icon} size={23} />
        </span>
        <div>
          <p className="card-kicker">Próximamente</p>
          <h2>{title}</h2>
        </div>
        <span className="badge badge-neutral">
          <Icon name="clock" size={14} /> No disponible
        </span>
      </div>
      <p>{description}</p>
      <p className="panel-note">
        No se muestran datos simulados. Esta capacidad se habilitará cuando su contrato y
        su implementación estén listos.
      </p>
    </article>
  )
}

export function SolicitantePanel() {
  return <Navigate replace to="/app" />
}

export function EspecialistaPanel() {
  return (
    <div className="workspace-page">
      <PageHeading eyebrow="Rol especialista" title="Evaluaciones">
        Este módulo se habilitará con las historias de asignación y evaluación.
      </PageHeading>

      <div className="panel-grid">
        <UnavailableCard
          description="Disponible con HU-007."
          icon="clipboard"
          title="Asignaciones"
        />
        <UnavailableCard
          description="Disponible con HU-008."
          icon="search"
          title="Evaluaciones en curso"
        />
        <UnavailableCard
          description="Disponible con HU-009."
          icon="certificate"
          title="Dictámenes"
        />
      </div>

      <section className="panel-card available-card">
        <div className="panel-card-heading">
          <span className="feature-icon">
            <Icon name="users" size={23} />
          </span>
          <div>
            <p className="card-kicker">Base preparada</p>
            <h2>Acceso por rol confirmado</h2>
          </div>
          <span className="badge badge-success">
            <Icon name="check" size={14} /> Autorizado
          </span>
        </div>
        <p>
          Los permisos se validan en el servidor; esta vista no concede acceso por sí sola.
        </p>
      </section>
    </div>
  )
}

export function AdministradorPanel() {
  return (
    <div className="workspace-page">
      <PageHeading eyebrow="Rol administrador" title="Administración">
        Este módulo se habilitará con las historias de catálogo, especialistas y asignación.
      </PageHeading>

      <div className="panel-grid">
        <UnavailableCard
          description="Disponible con HU-015."
          icon="settings"
          title="Catálogo"
        />
        <UnavailableCard
          description="Disponible con HU-014."
          icon="users"
          title="Especialistas"
        />
        <UnavailableCard
          description="Disponible con HU-006."
          icon="clipboard"
          title="Solicitudes y asignaciones"
        />
      </div>

      <section className="panel-card available-card">
        <div className="panel-card-heading">
          <span className="feature-icon">
            <Icon name="shield" size={23} />
          </span>
          <div>
            <p className="card-kicker">Control vigente</p>
            <h2>Autorización del lado del servidor</h2>
          </div>
          <span className="badge badge-success">
            <Icon name="check" size={14} /> Activo
          </span>
        </div>
        <p>
          Los permisos se validan en ASP.NET Core; ocultar un enlace no sustituye esa validación.
        </p>
      </section>
    </div>
  )
}
