import { Navigate } from 'react-router-dom'
import { Icon } from '../components/Icon'

function UnavailablePanel({ eyebrow, title, description, icon }) {
  return (
    <div className="workspace-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>

      <section className="panel-card unavailable-card">
        <div className="panel-card-heading">
          <span className="feature-icon">
            <Icon name={icon} size={23} />
          </span>
          <div>
            <h2>Disponible próximamente</h2>
          </div>
          <span className="badge badge-neutral">
            <Icon name="clock" size={14} /> No disponible
          </span>
        </div>
        <p>
          Este espacio se habilitará cuando sus funciones estén publicadas. No se muestran
          datos simulados.
        </p>
      </section>
    </div>
  )
}

export function SolicitantePanel() {
  return <Navigate replace to="/app" />
}

export function EspecialistaPanel() {
  return (
    <UnavailablePanel
      description="Aquí verás tus evaluaciones asignadas."
      eyebrow="Rol especialista"
      icon="clipboard"
      title="Evaluaciones"
    />
  )
}

export function AdministradorPanel() {
  return (
    <UnavailablePanel
      description="Aquí podrás gestionar el catálogo y los especialistas."
      eyebrow="Rol administrador"
      icon="settings"
      title="Administración"
    />
  )
}
