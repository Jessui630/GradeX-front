import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RequestDetailPage } from './RequestDetailPage'
import { obtenerRequisitos } from '../features/catalog/catalog.api'
import { obtenerCertificadoSolicitud } from '../features/certificados/certificados.api'
import { obtenerSolicitud, subirEvidencia } from '../features/solicitudes/solicitudes.api'
import { renderWithAuth } from '../testing/renderWithAuth'

vi.mock('../features/catalog/catalog.api', () => ({
  obtenerRequisitos: vi.fn(),
}))
vi.mock('../features/certificados/certificados.api', () => ({
  obtenerCertificadoSolicitud: vi.fn(),
}))
vi.mock('../features/solicitudes/solicitudes.api', () => ({
  obtenerSolicitud: vi.fn(),
  subirEvidencia: vi.fn(),
}))

const detalleBase = {
  idSolicitud: 5,
  folio: 'SOL-5',
  nombreProducto: 'Producto de prueba',
  modelo: 'Modelo M',
  sku: 'SKU-1',
  numeroSerie: 'SERIE-1',
  imei: null,
  accesorios: null,
  descripcion: 'Descripción del producto',
  observaciones: null,
  idCategoria: 1,
  categoria: 'Sneakers',
  marca: 'Marca de prueba',
  estadoCodigo: 'FINALIZADA',
  estadoNombre: 'Finalizada',
  esBorrador: false,
  fechaSolicitud: '2026-11-25T01:00:00Z',
  fechaUltimoCambio: '2026-11-25T02:00:00Z',
  accionPendiente: null,
  evidencias: [],
  seguimiento: [],
  especialista: { idEspecialista: 1, nombre: 'Especialista de prueba' },
  evaluacion: { dictamen: 'AUTENTICO', fechaFin: '2026-11-25T02:00:00Z' },
  certificadoDisponible: true,
  evidenciaAdicionalSolicitada: null,
  resultadosEvaluacion: [],
}

const certificado = {
  idCertificado: 2,
  idSolicitud: 5,
  folio: 'SOL-5',
  numeroCertificado: 'GX-20261125-ABCD1234',
  qrToken: '7a8ea714-73cc-435a-9ea8-6bb99e66dc18',
  fechaEmision: '2026-11-25T02:00:00Z',
  fechaVencimiento: null,
  estadoCodigo: 'EMITIDO',
  estadoNombre: 'Emitido',
  nombreProducto: 'Producto de prueba',
  modelo: 'Modelo M',
  categoria: 'Sneakers',
  marca: 'Marca de prueba',
  dictamen: 'NO_AUTENTICO',
  conditionGrade: 5.5,
  especialista: 'Especialista de prueba',
  especialidad: 'Sneakers',
}

describe('RequestDetailPage', () => {
  beforeEach(() => {
    obtenerSolicitud.mockReset()
    obtenerCertificadoSolicitud.mockReset()
    obtenerRequisitos.mockReset()
    subirEvidencia.mockReset()
  })

  it('muestra el certificado real, su dictamen y el QR', async () => {
    obtenerSolicitud.mockResolvedValue(detalleBase)
    obtenerCertificadoSolicitud.mockResolvedValue(certificado)
    renderWithAuth(<RequestDetailPage id="5" />, {
      route: '/app/solicitudes/5',
      usuario: { idUsuario: 1, roles: ['Solicitante'] },
    })

    expect(await screen.findByRole('heading', { name: 'Producto de prueba' }))
      .toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: certificado.numeroCertificado }))
      .toBeInTheDocument()
    expect(screen.getByText('No auténtico')).toBeInTheDocument()
    expect(screen.getByText('5.50 / 10')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Verificar certificado/ })).toHaveAttribute(
      'href',
      '/verificar/7a8ea714-73cc-435a-9ea8-6bb99e66dc18',
    )
    expect(screen.getByRole('img', {
      name: 'Código QR de verificación pública del certificado',
    })).toBeInTheDocument()
  })

  it('permite adjuntar evidencia adicional cuando falta evidencia', async () => {
    obtenerSolicitud.mockResolvedValue({
      ...detalleBase,
      estadoCodigo: 'FALTA_EVIDENCIA',
      estadoNombre: 'Falta evidencia',
      certificadoDisponible: false,
      evidenciaAdicionalSolicitada: 'Adjunta una etiqueta adicional.',
      evaluacion: null,
    })
    obtenerRequisitos.mockResolvedValue({
      evidencias: [
        { idTipoEvidencia: 2, nombre: 'Etiqueta', cantidadMaxima: 3 },
      ],
    })
    subirEvidencia.mockResolvedValue({ idEvidencia: 8 })
    const user = userEvent.setup()
    renderWithAuth(<RequestDetailPage id="5" />, {
      route: '/app/solicitudes/5',
      usuario: { idUsuario: 1, roles: ['Solicitante'] },
    })

    expect(await screen.findByText('El especialista solicitó más información'))
      .toBeInTheDocument()
    expect(screen.getByText('Adjunta una etiqueta adicional.')).toBeInTheDocument()
    expect(await screen.findByRole('option', { name: 'Etiqueta' })).toBeInTheDocument()
    expect(screen.getByLabelText('Tipo de evidencia')).toHaveValue('2')
    const archivoInput = screen.getByLabelText(/Imagen \(JPG, PNG o WEBP/)
    await user.upload(
      archivoInput,
      new File(['imagen'], 'etiqueta.png', { type: 'image/png' }),
    )
    expect(archivoInput.files).toHaveLength(1)
    fireEvent.submit(archivoInput.closest('form'))
    expect(screen.queryByText('Selecciona una imagen.')).not.toBeInTheDocument()
    expect(screen.queryByText(
      'Selecciona un tipo de evidencia con capacidad disponible.',
    )).not.toBeInTheDocument()

    expect(subirEvidencia).toHaveBeenCalled()
    expect(await screen.findByText(
      'Evidencia adicional enviada. La evaluación continuará.',
    )).toBeInTheDocument()
  })
})
