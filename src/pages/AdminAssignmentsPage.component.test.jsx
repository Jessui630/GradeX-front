import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminAssignmentsPage } from './AdminAssignmentsPage'
import {
  asignarEspecialista,
  listarSolicitudesAsignacion,
  obtenerSolicitudAsignacion,
} from '../features/administracion/administracion.api'
import { renderWithAuth } from '../testing/renderWithAuth'

vi.mock('../features/administracion/administracion.api', () => ({
  asignarEspecialista: vi.fn(),
  listarSolicitudesAsignacion: vi.fn(),
  obtenerSolicitudAsignacion: vi.fn(),
}))

const resumen = {
  idSolicitud: 5,
  folio: 'SOL-5',
  nombreProducto: 'Producto de prueba',
  categoria: 'Sneakers',
  marca: 'Marca',
  estadoCodigo: 'PENDIENTE_ASIGNACION',
  estadoNombre: 'Pendiente de asignación',
  fechaSolicitud: '2026-11-25T01:00:00Z',
  especialistasCompatibles: 1,
  asignacion: null,
}

const detalle = {
  idSolicitud: 5,
  folio: 'SOL-5',
  nombreProducto: 'Producto de prueba',
  modelo: 'Modelo M',
  idCategoria: 1,
  categoria: 'Sneakers',
  idMarca: 1,
  marca: 'Marca',
  estadoCodigo: 'PENDIENTE_ASIGNACION',
  estadoNombre: 'Pendiente de asignación',
  fechaSolicitud: '2026-11-25T01:00:00Z',
  fechaUltimoCambio: '2026-11-25T01:00:00Z',
  puedeAsignarse: true,
  asignacion: null,
  especialistasCompatibles: [{
    idEspecialista: 7,
    nombre: 'Especialista compatible',
    aniosExperiencia: 5,
    nivel: 'EXPERTO',
    idCategoria: 1,
    categoria: 'Sneakers',
    idMarca: null,
    marca: null,
    cargaActiva: 2,
    coincideMarca: false,
  }],
}

describe('AdminAssignmentsPage', () => {
  beforeEach(() => {
    listarSolicitudesAsignacion.mockReset().mockResolvedValue({
      elementos: [resumen],
      pagina: 1,
      tamanoPagina: 8,
      total: 1,
    })
    obtenerSolicitudAsignacion.mockReset().mockResolvedValue(detalle)
    asignarEspecialista.mockReset().mockResolvedValue({
      idAsignacion: 1,
      idSolicitud: 5,
      folio: 'SOL-5',
      idEspecialista: 7,
      especialista: 'Especialista compatible',
      fechaAsignacion: '2026-11-25T02:00:00Z',
      estadoCodigo: 'ASIGNADA',
      estadoNombre: 'Asignada',
    })
  })

  it('consulta la solicitud y asigna el especialista compatible', async () => {
    const user = userEvent.setup()
    renderWithAuth(<AdminAssignmentsPage />, {
      usuario: { idUsuario: 1, roles: ['Administrador'] },
    })

    expect(await screen.findByText('SOL-5')).toBeInTheDocument()
    expect(await screen.findByText('Especialista compatible')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Asignar/ }))

    expect(asignarEspecialista).toHaveBeenCalledWith(5, 7)
    expect(await screen.findByText('Solicitud asignada a Especialista compatible.'))
      .toBeInTheDocument()
  })
})
