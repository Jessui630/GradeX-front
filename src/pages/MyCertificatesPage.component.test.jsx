import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MyCertificatesPage } from './MyCertificatesPage'
import { listarCertificados } from '../features/certificados/certificados.api'
import { ApiError } from '../lib/ApiError'
import { renderWithAuth } from '../testing/renderWithAuth'

vi.mock('../features/certificados/certificados.api', () => ({
  listarCertificados: vi.fn(),
}))

const certificado = {
  idCertificado: 4,
  idSolicitud: 9,
  folio: 'SOL-9',
  numeroCertificado: 'GX-20261125-ABCD1234',
  qrToken: '7a8ea714-73cc-435a-9ea8-6bb99e66dc18',
  fechaEmision: '2026-11-25T01:00:00Z',
  fechaVencimiento: null,
  estadoCodigo: 'EMITIDO',
  estadoNombre: 'Emitido',
  nombreProducto: 'Producto de prueba',
  modelo: 'Modelo X',
  categoria: 'Sneakers',
  marca: 'Marca X',
  dictamen: 'NO_AUTENTICO',
  conditionGrade: 6.5,
  especialista: 'Especialista de prueba',
  especialidad: 'Sneakers',
}

describe('MyCertificatesPage', () => {
  beforeEach(() => {
    listarCertificados.mockReset()
  })

  it('muestra el resultado real y los enlaces del certificado', async () => {
    listarCertificados.mockResolvedValue([certificado])
    renderWithAuth(<MyCertificatesPage />)

    expect(await screen.findByRole('heading', { name: 'GX-20261125-ABCD1234' }))
      .toBeInTheDocument()
    expect(screen.getByText('No auténtico')).toBeInTheDocument()
    expect(screen.getByText('6.50 / 10')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Verificar certificado/ })).toHaveAttribute(
      'href',
      '/verificar/7a8ea714-73cc-435a-9ea8-6bb99e66dc18',
    )
    expect(screen.getByRole('link', { name: /Ver solicitud/ })).toHaveAttribute(
      'href',
      '/app/solicitudes/9',
    )
    expect(screen.getByRole('img', {
      name: 'Código QR de verificación pública del certificado',
    })).toBeInTheDocument()
  })

  it('muestra el estado vacío cuando no hay certificados', async () => {
    listarCertificados.mockResolvedValue([])
    renderWithAuth(<MyCertificatesPage />)
    expect(await screen.findByText('Aún no tienes certificados')).toBeInTheDocument()
  })

  it('muestra error y permite reintentar', async () => {
    listarCertificados.mockRejectedValueOnce(new ApiError('Fallo', { status: 500 }))
      .mockResolvedValueOnce([certificado])
    renderWithAuth(<MyCertificatesPage />)

    expect(await screen.findByText('Error al cargar certificados')).toBeInTheDocument()
    screen.getByRole('button', { name: /Reintentar/ }).click()
    expect(await screen.findByRole('heading', { name: 'GX-20261125-ABCD1234' }))
      .toBeInTheDocument()
  })
})
