import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpecialistEvaluationPage } from './SpecialistEvaluationPage'
import { obtenerRequisitos } from '../features/catalog/catalog.api'
import {
  emitirCertificado,
  finalizarEvaluacion,
  guardarEvaluacion,
  obtenerArchivoEvidencia,
  obtenerAsignacion,
  solicitarEvidencia,
} from '../features/especialista/especialista.api'
import { renderWithAuth } from '../testing/renderWithAuth'

vi.mock('../features/catalog/catalog.api', () => ({
  obtenerRequisitos: vi.fn(),
}))
vi.mock('../features/especialista/especialista.api', () => ({
  emitirCertificado: vi.fn(),
  finalizarEvaluacion: vi.fn(),
  guardarEvaluacion: vi.fn(),
  obtenerArchivoEvidencia: vi.fn(),
  obtenerAsignacion: vi.fn(),
  solicitarEvidencia: vi.fn(),
}))

const asignacion = {
  idSolicitud: 5,
  folio: 'SOL-5',
  nombreProducto: 'Producto de prueba',
  modelo: 'Modelo M',
  sku: 'SKU-1',
  numeroSerie: null,
  imei: null,
  accesorios: null,
  descripcion: 'Descripción',
  observaciones: null,
  idCategoria: 1,
  categoria: 'Sneakers',
  idMarca: null,
  marca: null,
  estadoCodigo: 'ASIGNADA',
  estadoNombre: 'Asignada',
  fechaSolicitud: '2026-11-25T01:00:00Z',
  puedeEvaluar: true,
  puedeSolicitarEvidencia: true,
  puedeEmitirCertificado: false,
  evidencias: [],
  criterios: [
    {
      idCriterio: 1,
      nombre: 'Condición',
      descripcion: 'Estado general',
      tipoDato: 'NUMERICO',
      obligatorio: true,
      orden: 1,
    },
  ],
  evaluacion: null,
  certificado: null,
}

describe('SpecialistEvaluationPage', () => {
  beforeEach(() => {
    obtenerAsignacion.mockReset().mockResolvedValue(asignacion)
    obtenerRequisitos.mockReset().mockResolvedValue({
      evidencias: [{ idTipoEvidencia: 2, nombre: 'Etiqueta' }],
    })
    guardarEvaluacion.mockReset().mockResolvedValue({})
    finalizarEvaluacion.mockReset().mockResolvedValue({})
    solicitarEvidencia.mockReset().mockResolvedValue(null)
    emitirCertificado.mockReset().mockResolvedValue({})
    obtenerArchivoEvidencia.mockReset()
  })

  it('exige dictamen y calificación antes de finalizar y envía los criterios', async () => {
    const user = userEvent.setup()
    renderWithAuth(
      <Routes>
        <Route
          element={<SpecialistEvaluationPage />}
          path="/app/especialista/asignaciones/:id"
        />
      </Routes>,
      {
        route: '/app/especialista/asignaciones/5',
        usuario: { idUsuario: 2, roles: ['Especialista'] },
      },
    )

    expect(await screen.findByRole('heading', { name: 'Producto de prueba' }))
      .toBeInTheDocument()
    await user.type(screen.getByLabelText('Condition Grade (0-10) *'), '8.5')
    await user.type(screen.getByLabelText('Valor de Condición'), '9')
    await user.click(screen.getByRole('button', { name: /Finalizar evaluación/ }))
    expect(await screen.findByText(
      'Selecciona un dictamen antes de finalizar la evaluación.',
    )).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Dictamen *'), 'AUTENTICO')
    await user.click(screen.getByRole('button', { name: /Finalizar evaluación/ }))

    expect(finalizarEvaluacion).toHaveBeenCalledWith(5, expect.objectContaining({
      dictamen: 'AUTENTICO',
      conditionGrade: 8.5,
      technicalHealth: null,
      resultados: [expect.objectContaining({
        idCriterio: 1,
        valorNumerico: 9,
      })],
    }))
    expect(await screen.findByText(/Evaluación finalizada/)).toBeInTheDocument()
  })
})
