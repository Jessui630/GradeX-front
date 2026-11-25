import { test, expect } from '@playwright/test'
import { Buffer } from 'node:buffer'
import {
  concederRol,
  limpiarSolicitudesE2E,
  prepararCriterioE2E,
  prepararEspecialista,
} from './helpers/sql.mjs'

test.setTimeout(180_000)

const sufijo = Date.now()
const contrasena = 'GradeX-Sprint2-flujo-2026'
const contrasenaNueva = 'GradeX-Sprint2-Nueva-2026'
const solicitanteNombre = 'Solicitante E2E Sprint 2'
const solicitanteCorreo = `e2e-s2-solicitante-${sufijo}@example.test`
const especialistaNombre = `Especialista E2E ${sufijo}`
const especialistaCorreo = `e2e-s2-especialista-${sufijo}@example.test`
const adminNombre = `Administrador E2E ${sufijo}`
const adminCorreo = `e2e-s2-admin-${sufijo}@example.test`
const producto = `Producto E2E S2 ${sufijo}`
const marca = `Marca E2E ${sufijo}`

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
)

async function registrar(request, nombreCompleto, correo) {
  const respuesta = await request.post('/api/cuentas', {
    data: { nombreCompleto, correo, contrasena },
  })
  expect(respuesta.status(), await respuesta.text()).toBe(201)
}

async function iniciarSesion(page, correo, clave = contrasena) {
  await page.goto('/login')
  await page.getByLabel('Correo electrónico').fill(correo)
  await page.getByLabel('Contraseña', { exact: true }).fill(clave)
  await page.getByRole('button', { name: 'Entrar a GradeX' }).click()
  await expect(page).toHaveURL(/\/app/)
  await page.goto('/app')
}

async function cerrarSesion(page) {
  await page.getByRole('button', { name: 'Menú de cuenta' }).click()
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)
}

test.beforeAll(async ({ request }) => {
  limpiarSolicitudesE2E()
  await registrar(request, adminNombre, adminCorreo)
  await registrar(request, especialistaNombre, especialistaCorreo)
  await registrar(request, solicitanteNombre, solicitanteCorreo)
  concederRol(adminCorreo, 'Administrador')
  prepararEspecialista(especialistaCorreo)
  prepararCriterioE2E()
})

test('flujo especialista, administración, evidencia adicional, certificado y perfil', async ({ page }) => {
  // 1. Solicitante crea y envía una solicitud completa.
  await iniciarSesion(page, solicitanteCorreo)
  await page.getByRole('link', { name: 'Nueva evaluación' }).first().click()
  await expect(page).toHaveURL(/\/app\/evaluaciones\/nueva$/)
  await page.getByRole('button', { name: /Sneakers/ }).click()
  await page.getByLabel(/Nombre del producto/).fill(producto)
  await page.getByLabel('Modelo', { exact: true }).fill('Modelo E2E S2')
  await page.getByLabel('Descripción', { exact: true }).fill('Producto para el flujo E2E de Sprint 2.')
  await page.getByRole('button', { name: /Continuar a evidencia/ }).click()
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'evidencia-s2.png',
    mimeType: 'image/png',
    buffer: png,
  })
  await expect(page.locator('.evidence-preview img').first()).toBeVisible()
  await page.getByRole('button', { name: /Revisar solicitud/ }).click()
  await page.getByRole('button', { name: /Enviar solicitud/ }).click()
  await expect(page.getByRole('heading', { name: /Tu evaluación ya está en cola/ })).toBeVisible()
  await cerrarSesion(page)

  // 2. Administrador asigna el especialista compatible.
  await iniciarSesion(page, adminCorreo)
  await page.getByRole('link', { name: 'Administración' }).click()
  await expect(page.getByRole('heading', { name: 'Panel administrativo' })).toBeVisible()
  const solicitudAdmin = page.locator('.admin-request-select').filter({ hasText: producto })
  await expect(solicitudAdmin).toBeVisible()
  const respuestaDetalle = page.waitForResponse(
    (respuesta) => /\/api\/administracion\/solicitudes\/\d+$/.test(respuesta.url()) &&
      respuesta.request().method() === 'GET',
    { timeout: 30_000 },
  )
  await solicitudAdmin.click()
  expect((await respuestaDetalle).status()).toBe(200)
  const detalleAdmin = page.locator('.admin-detail')
  await expect(detalleAdmin.getByRole('heading', { name: producto }))
    .toBeVisible({ timeout: 30_000 })
  const especialistaCompatible = page
    .locator('.compatible-list li')
    .filter({ hasText: especialistaNombre })
  await expect(especialistaCompatible).toBeVisible()
  await especialistaCompatible.getByRole('button', { name: /Asignar/ }).click()
  await expect(page.getByText(`Solicitud asignada a ${especialistaNombre}.`)).toBeVisible()
  await cerrarSesion(page)

  // 3. Especialista evalúa, guarda borrador y solicita evidencia adicional.
  await iniciarSesion(page, especialistaCorreo)
  await page.getByRole('link', { name: 'Asignaciones' }).click()
  await expect(page.getByRole('heading', { name: 'Mis asignaciones' })).toBeVisible()
  const asignacion = page.locator('.request-card').filter({ hasText: producto })
  await expect(asignacion).toBeVisible()
  await asignacion.click()
  await expect(page).toHaveURL(/\/app\/especialista\/asignaciones\/\d+$/)
  await expect(page.getByRole('heading', { name: producto })).toBeVisible()
  await page.locator('#conditionGrade').fill('9')
  await page.locator('#technicalHealth').fill('95')
  await page.getByLabel('Valor de Condición E2E').fill('9.5')
  await page.locator('#observacionesGenerales').fill('Evaluación E2E con evidencia adicional.')
  await page.getByRole('button', { name: /Guardar borrador/ }).click()
  await expect(page.getByText('Borrador de evaluación guardado.')).toBeVisible()
  await page.locator('#descripcionEvidencia').fill('Adjunta una foto adicional de la etiqueta trasera.')
  await page.getByRole('button', { name: /Solicitar evidencia/ }).click()
  await expect(page.getByText(/Solicitud de evidencia registrada/)).toBeVisible()
  await cerrarSesion(page)

  // 4. Solicitante aporta la evidencia adicional solicitada.
  await iniciarSesion(page, solicitanteCorreo)
  await page.getByRole('link', { name: 'Mis solicitudes' }).first().click()
  const solicitudSolicitante = page.locator('.request-card').filter({ hasText: producto })
  await expect(solicitudSolicitante).toBeVisible()
  await solicitudSolicitante.click()
  await expect(page.getByRole('heading', { name: 'El especialista solicitó más información' })).toBeVisible()
  await page.locator('#archivoEvidenciaAdicional').setInputFiles({
    name: 'evidencia-s2-adicional.png',
    mimeType: 'image/png',
    buffer: png,
  })
  await page.locator('#descripcionEvidenciaAdicional').fill('Etiqueta adicional E2E')
  await page.getByRole('button', { name: /Enviar evidencia/ }).click()
  await expect(page.getByText('Evidencia adicional enviada. La evaluación continuará.')).toBeVisible()
  await expect(page.getByText('En evaluación').first()).toBeVisible()
  await cerrarSesion(page)

  // 5. Especialista finaliza y emite el certificado.
  await iniciarSesion(page, especialistaCorreo)
  await page.getByRole('link', { name: 'Asignaciones' }).click()
  await page.locator('.request-card').filter({ hasText: producto }).click()
  await expect(page.getByRole('heading', { name: producto })).toBeVisible()
  await page.locator('#dictamen').selectOption('AUTENTICO')
  await page.getByRole('button', { name: /Finalizar evaluación/ }).click()
  await expect(page.getByText(/Evaluación finalizada/)).toBeVisible()
  await page.getByRole('button', { name: /Emitir certificado/ }).click()
  await expect(page.getByText('Certificado emitido correctamente.')).toBeVisible()
  await expect(page.getByRole('heading', { name: /^GX-/ })).toBeVisible()
  await expect(page.locator('.certificate-result strong')
    .filter({ hasText: 'Auténtico' })).toBeVisible()
  await expect(page.getByRole('img', { name: /Código QR/ })).toBeVisible()
  const enlacePublico = page.getByRole('link', { name: /Ver enlace público/ })
  await expect(enlacePublico).toBeVisible()
  await enlacePublico.click()
  await expect(page).toHaveURL(/\/verificar\/[0-9a-f-]+$/)
  await expect(page.getByText(producto).first()).toBeVisible()
  await expect(page.locator('.certificate-result strong')
    .filter({ hasText: 'Auténtico' })).toBeVisible()
  await expect(page.getByText('9.00 / 10')).toBeVisible()
  await expect(page.getByText(especialistaNombre).first()).toBeVisible()
  await page.goto('/app')
  await cerrarSesion(page)

  // 6. Solicitante consulta el certificado y actualiza su perfil y contraseña.
  await iniciarSesion(page, solicitanteCorreo)
  await page.getByRole('link', { name: 'Mis solicitudes' }).first().click()
  await page.locator('.request-card').filter({ hasText: producto }).click()
  await expect(page.getByRole('link', { name: /Verificar certificado/ })).toBeVisible()
  await expect(page.getByText('9.00 / 10')).toBeVisible()
  await expect(page.getByRole('img', { name: /Código QR/ })).toBeVisible()
  await page.getByRole('link', { name: 'Mis certificados', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Mis certificados' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /^GX-/ })).toBeVisible()
  await page.getByRole('link', { name: 'Perfil', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible()
  await page.locator('#nombreCompletoPerfil').fill('Solicitante E2E Actualizado')
  await page.getByRole('button', { name: /Guardar cambios/ }).click()
  await expect(page.getByText('Datos del perfil actualizados.')).toBeVisible()
  await page.locator('#contrasenaActual').fill(contrasena)
  await page.locator('#contrasenaNuevaPerfil').fill(contrasenaNueva)
  await page.locator('#confirmacionContrasena').fill(contrasenaNueva)
  await page.getByRole('button', { name: /Actualizar contraseña/ }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('Contraseña actualizada. Inicia sesión nuevamente.')).toBeVisible()
  await iniciarSesion(page, solicitanteCorreo, contrasenaNueva)
  await expect(page.getByRole('heading', { name: /Hola, Solicitante/ })).toBeVisible()
  await cerrarSesion(page)

  // 7. Administrador consulta especialistas y crea una marca real.
  await iniciarSesion(page, adminCorreo)
  await page.getByRole('link', { name: 'Administración' }).click()
  await page.getByRole('button', { name: /Catálogo/ }).click()
  await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
  await page.locator('#marcaNombre').fill(marca)
  await page.getByRole('button', { name: /Guardar marca/ }).click()
  await expect(page.getByText(`Marca ${marca} guardada.`)).toBeVisible()
  await expect(page.getByText(marca).first()).toBeVisible()
  await page.getByRole('button', { name: /Especialistas/ }).click()
  await expect(page.getByRole('heading', { name: 'Especialistas acreditados' })).toBeVisible()
  await expect(page.getByText(especialistaNombre).first()).toBeVisible()
})
