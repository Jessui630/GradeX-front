import { useState } from 'react'
import { Icon } from '../components/Icon'
import { AdminAssignmentsPage } from './AdminAssignmentsPage'
import { AdminCatalogPage } from './AdminCatalogPage'
import { AdminSpecialistsPage } from './AdminSpecialistsPage'

const SECCIONES = [
  { id: 'asignaciones', etiqueta: 'Asignaciones', icon: 'clipboard' },
  { id: 'especialistas', etiqueta: 'Especialistas', icon: 'users' },
  { id: 'catalogo', etiqueta: 'Catálogo', icon: 'box' },
]

export function AdminDashboardPage() {
  const [seccion, setSeccion] = useState('asignaciones')

  return (
    <div className="workspace-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Panel administrativo</h1>
          <p>Gestiona asignaciones, especialistas y el catálogo real de GradeX.</p>
        </div>
      </header>

      <nav aria-label="Secciones de administración" className="admin-tabs">
        {SECCIONES.map((item) => (
          <button
            aria-pressed={seccion === item.id}
            className={`filter-chip${seccion === item.id ? ' is-active' : ''}`}
            key={item.id}
            onClick={() => setSeccion(item.id)}
            type="button"
          >
            <Icon name={item.icon} size={17} /> {item.etiqueta}
          </button>
        ))}
      </nav>

      {seccion === 'asignaciones' ? <AdminAssignmentsPage /> : null}
      {seccion === 'especialistas' ? <AdminSpecialistsPage /> : null}
      {seccion === 'catalogo' ? <AdminCatalogPage /> : null}
    </div>
  )
}
