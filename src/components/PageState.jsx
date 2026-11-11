import { Link } from 'react-router-dom'
import { Icon } from './Icon'

export function EmptyState({
  icon = 'clipboard',
  title,
  description,
  actionTo,
  actionLabel,
  compact = false,
}) {
  return (
    <section className={`empty-state${compact ? ' compact' : ''}`}>
      <span className="state-icon">
        <Icon name={icon} size={compact ? 22 : 26} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionTo && actionLabel ? (
        <Link className="button button-primary" to={actionTo}>
          {actionLabel}
          <Icon name="arrow-right" size={18} />
        </Link>
      ) : null}
    </section>
  )
}

export function PageLoader({ label = 'Cargando información…', compact = false }) {
  return (
    <div className={`page-loader${compact ? ' compact' : ''}`} role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  )
}

export function InlineError({ children }) {
  return (
    <div className="alert alert-error" role="alert">
      <Icon name="alert" size={18} />
      {children}
    </div>
  )
}
