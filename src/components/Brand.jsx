import { Link } from 'react-router-dom'
import { Icon } from './Icon'

export function Brand({ to = '/', light = false }) {
  return (
    <Link className={`brand${light ? ' brand-light' : ''}`} to={to}>
      <span className="brand-mark">
        <Icon name="shield" size={21} />
      </span>
      <span className="brand-name">
        Grade<span>X</span>
      </span>
    </Link>
  )
}
